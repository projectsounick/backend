import mongoose, { Schema, Document } from "mongoose";

interface WaterTrackingHistory extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    value: number;
    action: 'Add' | 'Remove';
    actionTime: Date;
}

interface WaterTracking extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    waterIntake: number;
    date: Date;
}
const waterTrackingSchema: Schema<WaterTracking> = new Schema<WaterTracking>({
    userId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
        required: true,
    },
    waterIntake: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: () => {
            return Date.now()
        },
        immutable: true
    }
}); const WaterTrackingModel = mongoose.model<WaterTracking>("WaterTracking", waterTrackingSchema);
export default WaterTrackingModel;
export { WaterTracking }