import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async (): Promise<void> => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  console.log('MongoDB connected');
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};
