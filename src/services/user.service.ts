import { z } from 'zod';
import { User } from '../models/user.model';
import { Teacher } from '../models/teacher.model';
import { Session, SessionStatus } from '../models/session.model';
import { Types } from 'mongoose';
import { AppError } from '../utils/AppError';
import { parse } from '../utils/validate';

export const createUserSchema = z.object({
  fullName: z.string().trim().min(1, 'fullName is required'),
  email: z.string().trim().email('A valid email is required'),
  phone: z.string().trim().min(5, 'A valid phone number is required'),
});

export const createUser = async (body: unknown) => {
  const data = parse(createUserSchema, body);
  const existing = await User.findOne({ email: data.email.toLowerCase() }).lean();
  if (existing) {
    throw new AppError('A user with this email already exists', 409);
  }
  return User.create(data);
};

export const createTeacherSchema = z.object({
  fullName: z.string().trim().min(1, 'fullName is required'),
  email: z.string().trim().email('A valid email is required'),
  specialization: z.string().trim().min(1, 'specialization is required'),
  experience: z.number().min(0, 'experience must be >= 0'),
});

export const createTeacher = async (body: unknown) => {
  const data = parse(createTeacherSchema, body);
  return Teacher.create(data);
};

/**
 * API 6 – all sessions of a user, split into upcoming (BOOKED) and COMPLETED.
 * Implemented with an aggregation pipeline ($lookup + $facet).
 */
export const getUserSessions = async (userId: string) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const [result] = await Session.aggregate([
    { $match: { userId: new Types.ObjectId(userId) } },
    {
      $lookup: {
        from: Teacher.collection.name,
        localField: 'teacherId',
        foreignField: '_id',
        as: 'teacher',
      },
    },
    { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        startTime: 1,
        endTime: 1,
        status: 1,
        completedAt: 1,
        teacher: {
          _id: '$teacher._id',
          fullName: '$teacher.fullName',
          email: '$teacher.email',
          specialization: '$teacher.specialization',
          experience: '$teacher.experience',
        },
      },
    },
    {
      $facet: {
        upcomingSessions: [
          { $match: { status: SessionStatus.BOOKED } },
          { $sort: { startTime: 1 } },
        ],
        completedSessions: [
          { $match: { status: SessionStatus.COMPLETED } },
          { $sort: { completedAt: -1 } },
        ],
      },
    },
  ]);

  return {
    upcomingSessions: result?.upcomingSessions ?? [],
    completedSessions: result?.completedSessions ?? [],
  };
};
