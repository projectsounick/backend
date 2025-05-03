import mongoose, { Schema, Document } from "mongoose";


interface SleepTrackingHistory extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    value: number;
    action: 'Add' | 'Remove';
    actionTime: Date;
}

export interface SleepTracking extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    sleepDuration: number;
    createdAt: Date;
    updatedAt: Date;
}
const sleepTrackingSchema: Schema<SleepTracking> = new Schema<SleepTracking>({
    userId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
        required: true,
    },
    sleepDuration: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Date,
        default: () => {
            return Date.now()
        },
        immutable: true
    },
    updatedAt: {
        type: Date,
        default: () => {
            return Date.now()
        }
    }
});
export const SleepTrackingModel = mongoose.model<SleepTracking>("SleepTracking", sleepTrackingSchema);