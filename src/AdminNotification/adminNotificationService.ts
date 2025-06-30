import AdminNotificationModel, {
  AdminNotification,
} from "./AdminNotification.model";

export async function postNotifications(
  notifications: AdminNotification[]
): Promise<{
  success: boolean;
  message: string;
  data: any[] | null;
}> {
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
