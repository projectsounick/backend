import mongoose, { Schema, Document } from "mongoose";

export interface Streak extends Document {
  userId: mongoose.Types.ObjectId;
  streaks: Date[];
  totalStreak: number;
  updatedAt: Date;
}

const StreakSchema: Schema<Streak> = new Schema<Streak>({
  userId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "users",
    required: true,
    unique: true, // one streak record per user
  },
  streaks: {
    type: [Date],
    default: [],
  },
  totalStreak: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: () => Date.now(),
  },
});

const StreakModel = mongoose.model<Streak>("streaks", StreakSchema);
export default StreakModel;
