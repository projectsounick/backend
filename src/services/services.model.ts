import mongoose, { Schema, Document } from "mongoose";

export interface Service extends Document {
    title: string;
    descItems: Array<string>;
    imgUrl: string;
    otherImages: Array<string>;
    price: number;
    isOnline: boolean;
    isCorporate: boolean;
    duration: number;
    durationType: "day" | "week" | "month" | "year";
    sessionCount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
const serviceSchema: Schema<Service> = new Schema<Service>({
    title: {
        type: String,
        required: true,
        unique: true,
    },
    descItems: {
        type: [String],
        required: true,
    },
    imgUrl: {
        type: String,
        required: true,
    },
    otherImages: {
        type: [String],
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    isOnline: {
        type: Boolean,
        required: true,
        default: false,
    },
    isCorporate: {
        type: Boolean,
        required: true,
        default: false,
    },
    duration: {
        type: Number,
        required: true,
    },
    durationType: {
        type: String,
        enum: ["day", "week", "month", "year"],
        required: true,
    },
    sessionCount: {
        type: Number,
        required: true,
    },
    isActive: {
        type: Boolean,
        required: false,
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
const ServiceModel = mongoose.model<Service>("services", serviceSchema);
export default ServiceModel;
