import {
  BlogContentInput,
  CreateBlogInput,
  UpdateBlogInput,
} from "../interface/BlogsInterface";
import BlogModel, { Blog } from "./blogs.model";
import { Types } from "mongoose";
import { sendBulkPushNotificationsAndSave } from "../Notification/notification.service";
import UserModel from "../users/user.model";

// 1. Get blog by ID or all blogs
export const getBlogs = async (
  id?: string
): Promise<{
  data: Blog[];
  message: string;
  success: boolean;
}> => {
  try {
    if (id) {
      const blog = await BlogModel.findById(id);

      return {
        message: "Blogs has been fetched",
        success: true,
        data: [blog],
      };
    } else {
      const blogs = await BlogModel.find();

      return {
        message: "Blogs has been fetched",
        success: true,
        data: blogs,
      };
    }
  } catch (error) {
    throw new Error("Error fetching blog(s): " + error);
  }
};

/////Funciton for fetching the blog overall data ------------------------------/
export async function fetchBlogOverallData() {
  try {
    const blogs = await BlogModel.find().select("coverImage title");

    return {
      message: "Blogs has been fetched",
      success: true,
      data: blogs,
    };
  } catch (error) {
    throw new Error("Error fetching blog(s): " + error);
  }
}

// 2. Create a new blog
export const createBlog = async (
  data: CreateBlogInput
): Promise<{ message: string; success: boolean; data: Blog }> => {
  try {
    const newBlog = new BlogModel({
      title: data.title,
      createdBy: data.createdBy,
      content: data.content,
      coverImage: data.coverImage ? data.coverImage : null,
    });
    const savedBlog = await newBlog.save();

    // Send notification to all users about new blog
    try {
      // Fetch ALL users (not just those with push tokens)
      // This ensures notifications are saved in DB for all users
      const allUsers = await UserModel.find({}).select("_id expoPushToken").lean();

      if (allUsers.length > 0) {
        const adminId = "6824c9555c0f5d5253ed8d3f";
        const usersWithSenderId = allUsers.map((user) => ({
          ...user,
          senderId: adminId,
        }));

        await sendBulkPushNotificationsAndSave(
          "New Blog Published!",
          `Check out our latest blog: ${data.title}`,
          usersWithSenderId,
          "user",
          {
            type: "blog",
            navigationData: {
              screen: "/dashboard/tabs",
              params: {},
            },
          }
        );
        
        console.log(`Blog notification sent to ${allUsers.length} users`);
      } else {
        console.log("No users found to send blog notification");
      }
    } catch (notificationError) {
      console.error("Error sending blog notification:", notificationError);
      // Don't fail blog creation if notification fails
    }

    return {
      data: savedBlog,
      message: "Blog data has been created",
      success: true,
    };
  } catch (error) {
    throw new Error("Error creating blog: " + error);
  }
};

// 3. Update a blog by ID
export const updateBlog = async (
  id: string,
  data: Partial<UpdateBlogInput>
) => {
  try {
    const updatedBlog = await BlogModel.findByIdAndUpdate(
      id,
      {
        ...data,
        updatedBy: data.updatedBy,
      },
      { new: true } // Return updated doc
    );
    return updatedBlog;
  } catch (error) {
    throw new Error("Error updating blog: " + error);
  }
};

// 4. Delete a blog by ID
export const deleteBlog = async (
  id: string
): Promise<{ message: string; success: boolean }> => {
  try {
    const deleted = await BlogModel.findByIdAndDelete(id);
    console.log(deleted);
    if (deleted) {
      return {
        message: "Blog has been deleted",
        success: true,
      };
    } else {
      return {
        message: "Unable to delete the blog",
        success: false,
      };
    }
  } catch (error) {
    throw new Error("Error deleting blog: " + error);
  }
};
