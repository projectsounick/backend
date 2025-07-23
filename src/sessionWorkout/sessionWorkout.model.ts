import mongoose, { Schema, Document } from "mongoose";

export interface SessionWorkout extends Document {
    sessionId: mongoose.Types.ObjectId;
    exercise: string;
    sets: number;
    reps: number;
    timer: string;
    isComplete: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
const SessionWorkoutSchema: Schema<SessionWorkout> = new Schema<SessionWorkout>({
    sessionId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "sessions",
        required: true,
    },
    exercise: {
        type: String,
        required: true,
    },
    sets: {
        type: Number,
        required: false,
    },
    reps: {
        type: Number,
        required: false,
    },
    timer: {
        type: String,
        required: false,
    },
    isComplete: {
        type: Boolean,
        required: true,
        default: false
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
const SessionWorkoutModel = mongoose.model<SessionWorkout>("sessionworkouts", SessionWorkoutSchema);
export default SessionWorkoutModel;

