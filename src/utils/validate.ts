import { z, ZodType } from 'zod';
import { AppError } from './AppError';

export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid 24-character ObjectId');

export const parse = <T>(schema: ZodType<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.join('.') || 'value'}: ${i.message}`)
      .join('; ');
    throw new AppError(message, 400);
  }
  return result.data;
};
