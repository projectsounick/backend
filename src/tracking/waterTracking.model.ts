import mongoose, { Schema, Document } from "mongoose";

interface WaterTrackingHistory extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    value: number;
    action: 'Add' | 'Remove';
    actionTime: Date;
}

export interface WaterTracking extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    waterIntake: number;
    createdAt: Date;
    updatedAt: Date;
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
export const WaterTrackingModel = mongoose.model<WaterTracking>("WaterTracking", waterTrackingSchema);