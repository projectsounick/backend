import mongoose, { Schema, Document } from "mongoose";

// Updated User interface
export interface User extends Document {
  name: string;
  phoneNumber: string;
  otp: number;
  onboarding: boolean;
  email: string;
  role: string;
  sex: string;
  timeCommitment: string;
  goal: string;
  preferredWorkoutTime: string;
  workoutPreferences: string[];
  activityLevel: string[];
}

// Mongoose schema for User
const userSchema: Schema<User> = new Schema<User>({
  name: {
    type: String,
    required: false,
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  otp: {
    type: Number,
    required: false,
  },
  email: {
    type: String,
    required: false,
  },
  onboarding: {
    type: Boolean,
    required: false,
    default: false,
  },
  role: {
    type: String,
    required: true,
    default: "user",
  },
  sex: {
    type: String,
    required: false,
  },
  timeCommitment: {
    type: String,
    required: false,
  },
  goal: {
    type: String,
    required: false,
  },
  preferredWorkoutTime: {
    type: String,
    required: false,
  },
  workoutPreferences: {
    type: [String],
    required: false,
    default: [],
  },
  activityLevel: {
    type: [String],
    required: false,
    default: [],
  },
});

// Mongoose model
const UserModel = mongoose.model<User>("User", userSchema);

export default UserModel;
