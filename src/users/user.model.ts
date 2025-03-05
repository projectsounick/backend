import mongoose, { Schema, Document } from "mongoose";

export interface User extends Document {
  name: string;
  phoneNumber: string;
  otp: number;
  onboarding: boolean;
  email: string;
  role: string;
}

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
  },
  role: {
    type: String,
    required: true,
    default: "user",
  },
});

// This method dynamically returns the correct model based on the active DB connection

const UserModel = mongoose.model<User>("User", userSchema);

export default UserModel;
