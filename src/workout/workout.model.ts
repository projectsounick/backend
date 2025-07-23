import mongoose, { Schema, Document } from "mongoose";

export interface Exercise extends Document {
  name: string;
  images: [string];
  videos: [string];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
const ExerciseSchema: Schema<Exercise> = new Schema<Exercise>({
  name: {
    type: String,
    required: false,
  },
  images: {
    type: [String],
    required: false,
  },
  videos: {
    type: [String],
    required: false,
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
  },
  createdAt: {
    type: Date,
    default: () => {
      return Date.now();
    },
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: () => {
      return Date.now();
    },
  },
});
const ExerciseModel = mongoose.model<Exercise>("exercises", ExerciseSchema);

export interface EachexerciseItem extends Document {
  sets: Array<{ repRange: number; timer: string }>;
  exercise: mongoose.Types.ObjectId;
}

export interface WorkoutPlan extends Document {
  description: string;
  planName: string;
  sun: Array<EachexerciseItem>;
  mon: Array<EachexerciseItem>;
  tue: Array<EachexerciseItem>;
  wed: Array<EachexerciseItem>;
  thu: Array<EachexerciseItem>;
  fri: Array<EachexerciseItem>;
  sat: Array<EachexerciseItem>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EachexerciseItemSchema = new Schema<EachexerciseItem>(
  {
    sets: [
      {
        repRange: { type: Number, required: false },
        timer: { type: String, required: false },
      },
    ],
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "exercises",
      required: true,
    },
  },
  { _id: false }
);

const WorkoutPlanSchema = new Schema<WorkoutPlan>(
  {
    planName: { type: String, required: true },
    description: { type: String, required: false },
    sun: [EachexerciseItemSchema],
    mon: [EachexerciseItemSchema],
    tue: [EachexerciseItemSchema],
    wed: [EachexerciseItemSchema],
    thu: [EachexerciseItemSchema],
    fri: [EachexerciseItemSchema],
    sat: [EachexerciseItemSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const WorkoutPlanModel = mongoose.model<WorkoutPlan>(
  "WorkoutPlan",
  WorkoutPlanSchema
);

export default ExerciseModel;
