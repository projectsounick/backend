import mongoose, { Schema, Document } from "mongoose";


interface WalkTrackingHistory extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    value: number;
    action: 'Add' | 'Remove';
    actionTime: Date;
}

export interface WalkTracking extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    steps: number;
    createdAt: Date;
    updatedAt: Date;
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
export const WalkTrackingModel = mongoose.model<WalkTracking>("WalkTracking", walkTrackingSchema);