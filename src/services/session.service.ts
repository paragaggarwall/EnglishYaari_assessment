import { z } from 'zod';
import { Types } from 'mongoose';
import { Session, SessionStatus } from '../models/session.model';
import { Teacher } from '../models/teacher.model';
import { User } from '../models/user.model';
import { AppError } from '../utils/AppError';
import { objectId, parse } from '../utils/validate';

const createSessionSchema = z.object({
  teacherId: objectId,
  startTime: z.coerce.date({ message: 'startTime must be a valid date' }),
  endTime: z.coerce.date({ message: 'endTime must be a valid date' }),
});

const bookSessionSchema = z.object({ userId: objectId });

export const createSession = async (body: unknown) => {
  const data = parse(createSessionSchema, body);

  if (data.endTime <= data.startTime) {
    throw new AppError('endTime must be greater than startTime', 400);
  }

  const teacher = await Teacher.exists({ _id: data.teacherId });
  if (!teacher) {
    throw new AppError('Teacher not found', 404);
  }

  return Session.create({ ...data, status: SessionStatus.AVAILABLE });
};

/**
 * Accepts a timestamp in milliseconds or seconds and returns the
 * [start, end) range of that calendar day in UTC.
 */
const dayRangeFromTimestamp = (raw: unknown): { start: Date; end: Date } => {
  const num = Number(raw);
  if (raw === undefined || raw === '' || !Number.isFinite(num) || num < 0) {
    throw new AppError('dateTimestamp query param must be a valid timestamp', 400);
  }
  const ms = num < 1e11 ? num * 1000 : num; // treat 10-digit values as seconds
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) {
    throw new AppError('dateTimestamp query param must be a valid timestamp', 400);
  }
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
};

/**
 * API 3 – AVAILABLE sessions for the supplied date (aggregation pipeline).
 */
export const getAvailableSessions = async (dateTimestamp: unknown) => {
  const { start, end } = dayRangeFromTimestamp(dateTimestamp);

  return Session.aggregate([
    {
      $match: {
        status: SessionStatus.AVAILABLE,
        startTime: { $gte: start, $lt: end },
      },
    },
    { $sort: { startTime: 1 } },
    {
      $lookup: {
        from: Teacher.collection.name,
        localField: 'teacherId',
        foreignField: '_id',
        as: 'teacher',
      },
    },
    { $unwind: '$teacher' },
    {
      $project: {
        _id: 1,
        startTime: 1,
        endTime: 1,
        status: 1,
        teacher: {
          _id: '$teacher._id',
          fullName: '$teacher.fullName',
          email: '$teacher.email',
          specialization: '$teacher.specialization',
          experience: '$teacher.experience',
        },
      },
    },
  ]);
};

/**
 * API 4 – book a session. The status check and update happen in a single
 * atomic findOneAndUpdate so two users can never book the same session.
 */
export const bookSession = async (sessionId: string, body: unknown) => {
  const { userId } = parse(bookSessionSchema, body);

  const user = await User.exists({ _id: userId });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const booked = await Session.findOneAndUpdate(
    { _id: new Types.ObjectId(sessionId), status: SessionStatus.AVAILABLE },
    { $set: { status: SessionStatus.BOOKED, userId } },
    { new: true }
  );
  if (booked) return booked;

  const existing = await Session.exists({ _id: sessionId });
  if (!existing) {
    throw new AppError('Session not found', 404);
  }
  throw new AppError('Session is not available for booking', 409);
};

/**
 * API 5 – mark a BOOKED session as COMPLETED (atomic).
 */
export const completeSession = async (sessionId: string) => {
  const completed = await Session.findOneAndUpdate(
    { _id: new Types.ObjectId(sessionId), status: SessionStatus.BOOKED },
    { $set: { status: SessionStatus.COMPLETED, completedAt: new Date() } },
    { new: true }
  );
  if (completed) return completed;

  const existing = await Session.exists({ _id: sessionId });
  if (!existing) {
    throw new AppError('Session not found', 404);
  }
  throw new AppError('Only BOOKED sessions can be marked as completed', 409);
};
