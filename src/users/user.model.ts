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
<<<<<<< Updated upstream

// Mongoose schema for User
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream

// Mongoose model
=======
>>>>>>> Stashed changes
const UserModel = mongoose.model<User>("User", userSchema);
export default UserModel;

export interface UserDetails extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  birthYear: number;
  gender: string;
  height: number;
  weight: number;
  targetWeight: number;
  medicalHistory: string;
  goal: string;
  secondaryGoal: string;
  commitment: string;
  workoutTimePreference: string;
  workoutPlacePreference: string;
  workoutPreference: string;
  activityLevel: string;
}
const userDetailsSchema: Schema<UserDetails> = new Schema<UserDetails>({
  userId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
    required: true,
  },
  birthYear: {
    type: Number,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  targetWeight: {
    type: Number,
    required: true,
  },
  medicalHistory: {
    type: String,
    required: true,
  },
  goal: {
    type: String,
    required: true,
  },
  secondaryGoal: {
    type: String,
    required: true,
  },
  commitment: {
    type: String,
    required: true,
  },
  workoutTimePreference: {
    type: String,
    required: true,
  },
  workoutPlacePreference: {
    type: String,
    required: true,
  },
  workoutPreference: {
    type: String,
    required: true,
  },
  activityLevel: {
    type: String,
    required: true,
  },
});
export const UserDetailsModel = mongoose.model<UserDetails>("UserDetails", userDetailsSchema);

export interface TrainerDetails extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  birthYear: number;
  gender: string;
}
const trainerDetailsSchema: Schema<TrainerDetails> = new Schema<TrainerDetails>({
  userId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
    required: true,
  },
  birthYear: {
    type: Number,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
});
export const TrainerDetailsModel = mongoose.model<TrainerDetails>("TrainerDetails", trainerDetailsSchema);