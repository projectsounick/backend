import mongoose, { Schema, Document } from "mongoose";

export interface DownloadPageContent extends Document {
  title: string;
  description: string;
  content: {
    title: string;
    description: string;
    tags: string[];
  }[];
}

const downloadPageContentSchema: Schema<DownloadPageContent> =
  new Schema<DownloadPageContent>(
    {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      content: [
        {
          title: {
            type: String,
            required: true,
          },
          description: {
            type: String,
            required: true,
          },
          tags: {
            type: [String],
            required: true,
          },
        },
      ],
    },
    { timestamps: true }
  );

const DownloadPageContentModel = mongoose.model<DownloadPageContent>(
  "DownloadPageContent",
  downloadPageContentSchema
);

export default DownloadPageContentModel;
