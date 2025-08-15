import mongoose, { Schema, Document } from "mongoose";

export interface UserActiveservices extends Document {
  userId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  totalSessions: number;
  remainingSessions: number;
  trainerId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
const UserActiveServicesSchema: Schema<UserActiveservices> =
  new Schema<UserActiveservices>({
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "users",
      required: true,
    },
    serviceId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "services",
      required: false,
    },
    totalSessions: {
      type: Number,
      required: false,
    },
    remainingSessions: {
      type: Number,
      required: false,
    },
    trainerId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "users",
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
const UserActiveServicesModel = mongoose.model<UserActiveservices>(
  "useractiveservices",
  UserActiveServicesSchema
);
export default UserActiveServicesModel;
