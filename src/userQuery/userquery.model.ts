import mongoose, { Schema, Document } from "mongoose";

// Define the UserQuery interface
interface IUserQuery extends Document {
  name: string;
  email: string;
  phoneNumber: string;
  message: string;
  createdAt: Date;
}

// Define the UserQuery schema
const UserQuerySchema = new Schema<IUserQuery>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Create the UserQuery model
const UserQueryModel = mongoose.model<IUserQuery>("UserQuery", UserQuerySchema);

export default UserQueryModel;
