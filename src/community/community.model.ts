import mongoose, { Schema, Document } from "mongoose";

export interface Community extends Document {
    name: string;
    bannerImage?: string;
    members: mongoose.Types.ObjectId[];
    admins: mongoose.Types.ObjectId[];
    isActive: boolean;
    isCorporate: boolean;
    company: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
const CommunitySchema: Schema<Community> = new Schema<Community>({
    name: { type: String, required: true, unique: true },
    bannerImage: { type: String },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    isActive: { type: Boolean, required: true, default: true },
    isCorporate: { type: Boolean, required: true, default: false },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'companies' },
    createdAt: { type: Date, default: Date.now, immutable: true },
    updatedAt: { type: Date, default: Date.now }
});
const CommunityModel = mongoose.model<Community>("communities", CommunitySchema);


export interface Post extends Document {
    community: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    text?: string;
    media?: string;
    type: 'text' | 'image' | 'video';
    isActive: boolean;
    isApproved: boolean;
    createdAt: Date;
    updatedAt: Date;
}
const PostSchema: Schema<Post> = new Schema<Post>({
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'communities', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    text: { type: String },
    media: { type: String },
    type: { type: String, enum: ['text', 'image', 'video'], default: 'text' },
    isActive: { type: Boolean, required: true, default: true },
    isApproved: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, immutable: true },
    updatedAt: { type: Date, default: Date.now }
});
const PostModel = mongoose.model<Post>("posts", PostSchema);



export interface Comment extends Document {
    post: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
    updatedAt: Date;
}
const CommentSchema: Schema<Comment> = new Schema<Comment>({
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'posts', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, immutable: true },
    updatedAt: { type: Date, default: Date.now }
});

const CommentModel = mongoose.model<Comment>("comments", CommentSchema);



export interface Like extends Document {
    post: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const LikeSchema: Schema<Like> = new Schema<Like>({
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'posts', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    createdAt: { type: Date, default: Date.now, immutable: true },
    updatedAt: { type: Date, default: Date.now }
});

LikeSchema.index({ post: 1, user: 1 }, { unique: true });

const LikeModel = mongoose.model<Like>("likes", LikeSchema);




export default CommunityModel;
export { PostModel, CommentModel, LikeModel };