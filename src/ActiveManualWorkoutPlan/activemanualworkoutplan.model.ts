import mongoose, { Schema, Document, Types } from "mongoose";

export interface ActiveManualWorkoutPlan extends Document {
  userId: Types.ObjectId;
  workoutPlanId: Types.ObjectId;
  assignerId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ActiveManualWorkoutPlanSchema: Schema<ActiveManualWorkoutPlan> =
  new Schema<ActiveManualWorkoutPlan>(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
      },
      workoutPlanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WorkoutPlan",
        required: true,
      },
      assignerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
      },
      startDate: {
        type: Date,
        default: () => new Date(),
      },
      endDate: {
        type: Date,
        required: true,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
    },
    { timestamps: true }
  );

export const ActiveManualWorkoutPlanModel =
  mongoose.model<ActiveManualWorkoutPlan>(
    "ActiveManualWorkoutPlan",
    ActiveManualWorkoutPlanSchema
  );
