import mongoose, { Schema, Document } from "mongoose";

export interface UserActivePlans extends Document {
  userId: mongoose.Types.ObjectId;
  dietPlanId: mongoose.Types.ObjectId;
  plan: {
    planId: mongoose.Types.ObjectId;
    planItemId: mongoose.Types.ObjectId;
  };
  planStartDate: Date;
  planEndDate: Date;
  dietPlanUrl: string;
  dietPlanAssignDate: Date;
  totalSessions: number;
  remainingSessions: number;
  trainerId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
const UserActivePlansSchema: Schema<UserActivePlans> =
  new Schema<UserActivePlans>({
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "users",
      required: true,
    },
    dietPlanId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "dietplans",
      required: false,
    },
    dietPlanUrl: {
      type: String,
      required: false,
    },
    dietPlanAssignDate: {
      type: Date,
      required: false,
    },
    plan: {
      type: {
        planId: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: "plans",
        },
        planItemId: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: "planitems",
        },
      },
      required: false,
      _id: false,
    },
    planStartDate: {
      type: Date,
      required: true,
    },
    planEndDate: {
      type: Date,
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
const UserActivePlansModel = mongoose.model<UserActivePlans>(
  "useractiveplans",
  UserActivePlansSchema
);
export default UserActivePlansModel;
