import mongoose, { Schema, Document } from "mongoose";

interface TestimonialImage {
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Testimonial extends Document {
  userId: mongoose.Types.ObjectId;
  images: TestimonialImage[];
}

const testimonialImageSchema = new Schema<TestimonialImage>({
  imageUrl: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
});

const testimonialSchema = new Schema<Testimonial>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    images: [testimonialImageSchema],
  },
  { timestamps: true }
);

const TestimonialModel = mongoose.model<Testimonial>(
  "Testimonial",
  testimonialSchema
);

export default TestimonialModel;
