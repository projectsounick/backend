import mongoose, { Schema, Document } from "mongoose";

export interface Company extends Document {
    name:string;
    email?:string;
    phone?:string;
    address:string;
    contactPerson:string;
    contactPersonEmail?:string;
    contactPersonPhone?:string;
    allowedEmployees: number;
    allowedDomains: string[];
    isActive:boolean;
    createdAt: Date;
    updatedAt: Date;
}
const CompanySchema: Schema<Company> = new Schema<Company>({
    name: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: false,
        unique: true,
    },
    isActive:{
        type:Boolean,
        required:true,
        default:true
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
const CompanyModel = mongoose.model<Company>("companies", CompanySchema);
export default CompanyModel;

