import express from 'express';
import userRoutes from './routes/user.routes';
import sessionRoutes from './routes/session.routes';
import teacherRoutes from './routes/teacher.routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'OK' });
});

app.use('/users', userRoutes);
app.use('/sessions', sessionRoutes);
app.use('/teachers', teacherRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
