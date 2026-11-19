import { Schema, model, InferSchemaType } from 'mongoose';

export enum SessionStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  COMPLETED = 'COMPLETED',
}

const sessionSchema = new Schema(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(SessionStatus),
      default: SessionStatus.AVAILABLE,
      required: true,
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// API 3: available sessions on a given day
sessionSchema.index({ status: 1, startTime: 1 });
// API 6: sessions of a user
sessionSchema.index({ userId: 1, status: 1 });

export type ISession = InferSchemaType<typeof sessionSchema>;
export const Session = model('Session', sessionSchema);
