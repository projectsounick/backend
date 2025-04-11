import mongoose, { Schema, Document, Types } from "mongoose";

export interface BlogContent {
  contentType: string;
  sequence: number;
  contentData: string;
}

export interface Blog extends Document {
  title: string;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  content: BlogContent[];
  createdAt: Date;
  coverImage: string;
  updatedAt: Date;
}

const blogContentSchema = new Schema<BlogContent>(
  {
    contentType: { type: String, required: true },
    sequence: { type: Number, required: true },
    contentData: { type: String, required: true },
  },
  { _id: false }
);

const blogSchema: Schema<Blog> = new Schema<Blog>(
  {
    title: {
      type: String,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coverImage: {
      type: String,
      require: false,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: [blogContentSchema],
      required: true,
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt
);

const BlogModel = mongoose.model<Blog>("Blog", blogSchema);

export default BlogModel;
