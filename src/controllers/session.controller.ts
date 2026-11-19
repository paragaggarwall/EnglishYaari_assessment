import { RequestHandler } from 'express';
import * as sessionService from '../services/session.service';
import { objectId, parse } from '../utils/validate';

export const createSession: RequestHandler = async (req, res) => {
  const session = await sessionService.createSession(req.body);
  res.status(201).json({ success: true, data: session });
};

export const getAvailableSessions: RequestHandler = async (req, res) => {
  const sessions = await sessionService.getAvailableSessions(req.query.dateTimestamp);
  res.status(200).json({ success: true, count: sessions.length, data: sessions });
};

export const bookSession: RequestHandler = async (req, res) => {
  const id = parse(objectId, req.params.id);
  const session = await sessionService.bookSession(id, req.body);
  res.status(200).json({ success: true, data: session });
};

export const completeSession: RequestHandler = async (req, res) => {
  const id = parse(objectId, req.params.id);
  const session = await sessionService.completeSession(id);
  res.status(200).json({ success: true, data: session });
};
