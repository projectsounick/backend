import mongoose from "mongoose";
import TestimonialModel from "./testimonials.model";

export async function createOrUpdateTestimonial(
  userId: string,
  imageUrl: string
) {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const imageData = {
      imageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedTestimonial = await TestimonialModel.findOneAndUpdate(
      { userId: userObjectId },
      { $push: { images: imageData } },
      { new: true, upsert: true }
    );

    return {
      success: true,
      message: "Testimonial updated successfully",
      testimonial: updatedTestimonial,
    };
  } catch (error) {
    console.error("Error in createOrUpdateTestimonial:", error);
    return {
      success: false,
      message: "Failed to create or update testimonial",
      error,
    };
  }
}
