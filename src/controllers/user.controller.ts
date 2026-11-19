import { RequestHandler } from 'express';
import * as userService from '../services/user.service';
import { objectId, parse } from '../utils/validate';

export const createUser: RequestHandler = async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json({ success: true, data: user });
};

export const getUserSessions: RequestHandler = async (req, res) => {
  const id = parse(objectId, req.params.id);
  const data = await userService.getUserSessions(id);
  res.status(200).json({ success: true, data });
};

export const createTeacher: RequestHandler = async (req, res) => {
  const teacher = await userService.createTeacher(req.body);
  res.status(201).json({ success: true, data: teacher });
};
