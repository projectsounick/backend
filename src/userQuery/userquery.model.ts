import mongoose, { Schema, Document } from "mongoose";

// Define the UserQuery interface
interface IUserQuery extends Document {
  name: string;
  email: string;
  contactNo: string;
  message: string;
  goal: string;
  category: string;
  createdAt: Date;
}

// Define the UserQuery schema
const UserQuerySchema = new Schema<IUserQuery>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  contactNo: { type: String, required: true },
  message: { type: String, required: true },
  goal: { type: String, required: true },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// This method dynamically returns the correct model based on the active DB connection
export const UserQueryModel = mongoose.model<IUserQuery>(
  "UserQuery",
  UserQuerySchema
);
