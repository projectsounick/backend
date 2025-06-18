import mongoose, { Schema, Document } from "mongoose";


export interface VideoCall extends Document {
    creatorId: mongoose.Types.ObjectId;
    participantIds: [mongoose.Types.ObjectId];
    channelName: string;
    duration: string;
    callId:string;
    token: string;
    createdAt: Date;
    endedAt: Date;
    updatedAt: Date;
}
const VideoCallSchema: Schema<VideoCall> = new Schema<VideoCall>({
    creatorId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "users",
        required: true,
    },
    participantIds: {
        type: [mongoose.SchemaTypes.ObjectId],
        ref: "users",
        required: true,
    },
    channelName: {
        type: String,
        required: true,
    },
    duration: {
        type: String,
        required: true,
    },
    callId: {
        type: String,
        required: true,
        unique:true
    },
    token: {
        type: String,
        required: true,
    },
    endedAt: {
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
});
const VideoCallModel = mongoose.model<VideoCall>("videocalls", VideoCallSchema);


export default VideoCallModel;
