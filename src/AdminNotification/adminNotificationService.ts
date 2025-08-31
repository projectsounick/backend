import mongoose from "mongoose";
import AdminNotificationModel, {
  AdminNotification,
  AdminNotificationData,
} from "./AdminNotification.model";

export async function postUserNotifications(
  notifications: AdminNotification[]
): Promise<{
  success: boolean;
  message: string;
  data: any[] | null;
}> {
  console.log(notifications);
  try {
    if (!Array.isArray(notifications) || notifications.length === 0) {
      return {
        success: false,
        message: "No notifications provided.",
        data: null,
      };
    }

    const notificationDocs = notifications.map((input) => ({
      title: input.title,
      body: input.body,
      senderId: input.senderId,
      receiverId: input.receiverId,
      data: input.data,
    }));

    const savedNotifications = await AdminNotificationModel.insertMany(
      notificationDocs
    );

    return {
      success: true,
      message: "Notifications created successfully.",
      data: savedNotifications,
    };
  } catch (error) {
    console.error("postNotifications error:", error);
    return {
      success: false,
      message: "Failed to create notifications.",
      data: null,
    };
  }
}
export async function getNotificationsByUser(receiverId: string): Promise<{
  success: boolean;
  message: string;
  data: any[] | null;
}> {
  try {
    if (!receiverId) {
      return {
        success: false,
        message: "No receiverId provided.",
        data: null,
      };
    }

    // Step 1: Find all notifications for this user, sorted by newest
    const allNotifications = await AdminNotificationModel.find({
      receiverId,
    }).sort({ createdAt: -1 }); // Descending = newest first

    // Step 2: Keep only the latest 10
    const latest10 = allNotifications.slice(0, 10);

    // Step 3: If more than 10, delete the extras
    if (allNotifications.length > 10) {
      const idsToDelete = allNotifications
        .slice(10) // get the extras
        .map((n) => n._id);

      await AdminNotificationModel.deleteMany({ _id: { $in: idsToDelete } });
    }

    return {
      success: true,
      message: "Notifications fetched successfully.",
      data: latest10,
    };
  } catch (error) {
    console.error("getNotificationsByUser error:", error);
    return {
      success: false,
      message: "Failed to fetch notifications.",
      data: null,
    };
  }
}

export async function deleteNotificationById(notificationId: string): Promise<{
  success: boolean;
  message: string;
}> {
  console.log(notificationId);

  try {
    if (!notificationId) {
      return {
        success: false,
        message: "No notification ID provided.",
      };
    }

    const deleted = await AdminNotificationModel.findByIdAndDelete(
      notificationId
    );

    if (!deleted) {
      return {
        success: false,
        message: "Notification not found or already deleted.",
      };
    }

    return {
      success: true,
      message: "Notification deleted successfully.",
    };
  } catch (error) {
    console.error("deleteNotificationById error:", error);
    return {
      success: false,
      message: "Failed to delete notification.",
    };
  }
}
interface CreateAdminNotificationParams {
  title: string;
  body: string;
  senderId: mongoose.Types.ObjectId | string;
  receiverId: mongoose.Types.ObjectId | string;
  data?: AdminNotificationData; // optional
}
export const createUserNotification = async (
  params: CreateAdminNotificationParams
) => {
  try {
    const { title, body, senderId, receiverId, data } = params;

    // Validate required fields
    if (!title || !body || !senderId || !receiverId) {
      throw new Error("title, body, senderId, and receiverId are required.");
    }

    const notification = new AdminNotificationModel({
      title,
      body,
      senderId,
      receiverId,
      data: data || undefined, // optional, can be undefined
    });

    const savedNotification = await notification.save();
    return savedNotification;
  } catch (err) {
    console.error("Failed to create admin notification:", err);
    throw err;
  }
};
