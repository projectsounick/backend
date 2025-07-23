import mongoose, { Schema, Document } from "mongoose";

export interface UserMeasurement extends Document {
  userId: mongoose.Types.ObjectId;
  measurementUnits: {
    date: Date;
    chest?: number;
    waist?: number;
    thigh?: number;
    armSizeLeft?: number;
    armSizeRight?: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const userMeasurementSchema = new Schema<UserMeasurement>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  measurementUnits: [
    {
      date: {
        type: Date,
        required: true,
      },
      chest: Number,
      waist: Number,
      thigh: Number,
      armSizeLeft: Number,
      armSizeRight: Number,
    },
  ],
  createdAt: {
    type: Date,
    default: () => new Date(),
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: () => new Date(),
  },
});

userMeasurementSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const UserMeasurementModel = mongoose.model<UserMeasurement>(
  "usermeasurements",
  userMeasurementSchema
);

export default UserMeasurementModel;
