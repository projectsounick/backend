import mongoose, { Schema, Document } from "mongoose";


interface SleepTrackingHistory extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    value: number;
    action: 'Add' | 'Remove';
    actionTime: Date;
}

interface SleepTracking extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    sleepDuration: number;
    healthKitValue?: number; // Tracks HealthKit value separately for deduplication
    date: Date;
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
    healthKitValue: {
        type: Number,
        required: false,
        default: 0,
    },
    date: {
        type: Date,
        default: () => {
            return Date.now()
        },
        immutable: true
    }
});
const SleepTrackingModel = mongoose.model<SleepTracking>("sleeptracking", sleepTrackingSchema);
export default SleepTrackingModel;
export { SleepTracking };
