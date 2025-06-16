import mongoose, { Schema, Document } from "mongoose";

export interface Payment extends Document {
    orderId: string;
    userId: mongoose.Types.ObjectId;
    amount: number;
    status: 'pending' | 'success' | 'failed' | 'fullRefunded' | 'partialRefunded';
    items: Array<mongoose.Types.ObjectId>;
    // Optional field for refunds
    refundAmount?: number;
    refundReason?: string;
    refundedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    paymentUrl:string;
}
const PaymentSchema: Schema<Payment> = new Schema<Payment>({
    orderId: {
        type: String,
        required: true,
        unique:true
    },
    userId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "users",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        required: true,
        default: 'pending'
    },
    items: {
        type: [mongoose.SchemaTypes.ObjectId],
        ref: "carts",
        required: false,
    },
    // Optional field for refunds
    refundAmount: {
        type: Number,
        required: false,
    },
    refundReason: {
        type: String,
        required: false,
    },
    refundedAt: {
        type: Date,
        required: false,
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
    paymentUrl:{
        type: String,
        required: false,
    }
});
const PaymentModel = mongoose.model<Payment>("payments", PaymentSchema);
export default PaymentModel;

