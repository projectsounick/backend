import mongoose, { Schema, Document } from "mongoose";

export interface WebsiteContent extends Document {
  topContent: string;
  topGreenContent: string;
  aboutUs: {
    corporate: string[];
    lifestyle: string[];
  };
  services: { title: string; description: string }[];
  features: { title: string; description: string }[];
  progress: { title: string; description: string };
  mission: { firstDescription: string; secondDescription: string };
}

const websiteContentSchema: Schema<WebsiteContent> = new Schema<WebsiteContent>(
  {
    topContent: {
      type: String,
      required: true,
    },
    topGreenContent: {
      type: String,
      required: true,
    },
    aboutUs: {
      corporate: { type: [String], required: true },
      lifestyle: { type: [String], required: true },
    },
    services: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
      },
    ],
    features: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
      },
    ],
    progress: {
      title: { type: String, required: true },
      description: { type: String, required: true },
    },
    mission: {
      firstDescription: { type: String, required: true },
      secondDescription: { type: String, required: true },
    },
  },
  { timestamps: true }
);

const WebsiteContentModel = mongoose.model<WebsiteContent>(
  "WebsiteContent",
  websiteContentSchema
);

export default WebsiteContentModel;
