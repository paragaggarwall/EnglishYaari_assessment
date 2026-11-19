import { connectDB, disconnectDB } from '../config/db';
import { Teacher } from '../models/teacher.model';

const teachers = [
  { fullName: 'Anita Sharma', email: 'anita.sharma@example.com', specialization: 'Mathematics', experience: 8 },
  { fullName: 'Rahul Verma', email: 'rahul.verma@example.com', specialization: 'Physics', experience: 5 },
  { fullName: 'Meera Iyer', email: 'meera.iyer@example.com', specialization: 'English Literature', experience: 12 },
];

const seed = async (): Promise<void> => {
  await connectDB();
  for (const t of teachers) {
    await Teacher.updateOne({ email: t.email }, { $setOnInsert: t }, { upsert: true });
  }
  const all = await Teacher.find().lean();
  console.log('Teachers:');
  all.forEach((t) => console.log(`  ${t._id}  ${t.fullName} (${t.specialization})`));
  await disconnectDB();
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
