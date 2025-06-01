import mongoose, { Schema, Document } from "mongoose";

export interface Sessions extends Document {
    userId: mongoose.Types.ObjectId;
    trainerId: mongoose.Types.ObjectId;
    sessionDate: Date;
    sessionTime: string;
    sessionType: "online" | "offline";
    sessionAddress: string; // Address for offline sessions
    sessionStatus: "scheduled" | "completed" | "cancelled";
    sessionNotes: string;
    workoutPlan: Array<{
        exercise: string;
        sets: number;
        reps: number;
        timer: string;
    }>;
    sessionAgainstPlan: boolean; // Whether the session is against the user's active plan
    activePlanId: mongoose.Types.ObjectId; // Reference to the active plan if session is against a plan
    paymentItemId: mongoose.Types.ObjectId; // Reference to the payment item if session is independent
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
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
        immutable: true,
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
    workoutPlan: {
        type: [{
            exercise: {
                type: String,
                required: true,
            },
            sets: {
                type: Number,
                required: true,
            },
            reps: {
                type: Number,
                required: true,
            },
            timer: {
                type: String,
                required: false,
            },
        }],
        required: false,
        _id: false
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
    paymentItemId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "payments",
        required: false,
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true
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

