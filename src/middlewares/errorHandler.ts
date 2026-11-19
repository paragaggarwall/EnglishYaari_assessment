import { ErrorRequestHandler, RequestHandler } from 'express';
import { Error as MongooseError } from 'mongoose';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  console.log(req.originalUrl);
  
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof MongooseError.ValidationError) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join('; ');
  } else if (err instanceof MongooseError.CastError) {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err?.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern ?? {})[0] ?? 'field';
    message = `Duplicate value for ${field}`;
  } else if (err?.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON body';
  }

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.nodeEnv === 'development' && statusCode >= 500 ? { stack: err?.stack } : {}),
  });
};
