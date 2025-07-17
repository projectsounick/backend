import mongoose, { Schema, Document } from "mongoose";

export interface Sessions extends Document {
  userId: mongoose.Types.ObjectId;
  trainerId: mongoose.Types.ObjectId;
  sessionDate: Date;
  sessionTime: string;
  sessionType: "online" | "offline";
  sessionDuration: string;
  sessionAddress: string; // Address for offline sessions
  sessionStatus: "scheduled" | "completed" | "cancelled";
  sessionNotes: string;
  sessionAgainstPlan: boolean; // Whether the session is against the user's active plan
  activePlanId: mongoose.Types.ObjectId; // Reference to the active plan if session is against a plan
  activeServiceId: mongoose.Types.ObjectId; // Reference to the active service if session is against a service
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  sessionFeedback: string;
}
const SessionSchema: Schema<Sessions> = new Schema<Sessions>({
  userId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "users",
    required: true,
  },
  trainerId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "users",
    required: true,
  },
  sessionDate: {
    type: Date,
    default: () => {
      return Date.now();
    },
  },
  sessionTime: {
    type: String,
    required: true,
  },
  sessionType: {
    type: String,
    enum: ["online", "offline"],
    required: true,
  },
  sessionDuration: {
    type: String,
    required: true,
  },
  sessionFeedback: {
    type: String,
    required: false,
  },
  sessionAddress: {
    type: String,
    required: function () {
      return this.sessionType === "offline";
    },
  },
  sessionStatus: {
    type: String,
    enum: ["scheduled", "completed", "cancelled"],
    default: "scheduled",
    required: true,
  },
  sessionNotes: {
    type: String,
    required: false,
  },
  sessionAgainstPlan: {
    type: Boolean,
    default: true,
    required: true,
  },
  activePlanId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "useractiveplans",
    required: false,
  },
  activeServiceId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "useractiveservices",
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
const SessionModel = mongoose.model<Sessions>("sessions", SessionSchema);
export default SessionModel;
