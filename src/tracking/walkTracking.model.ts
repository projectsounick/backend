import mongoose, { Schema, Document } from "mongoose";


interface WalkTrackingHistory extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    value: number;
    action: 'Add' | 'Remove';
    actionTime: Date;
}

interface WalkTracking extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    steps: number;
    healthKitValue?: number; // Tracks HealthKit value separately for deduplication
    date: Date;
}
const walkTrackingSchema: Schema<WalkTracking> = new Schema<WalkTracking>({
    userId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
        required: true,
    },
    steps: {
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
const WalkTrackingModel = mongoose.model<WalkTracking>("WalkTracking", walkTrackingSchema);
export default WalkTrackingModel;
export { WalkTracking };
