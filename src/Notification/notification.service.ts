import { log } from "node:console";
import UserModel from "../users/user.model";
import {
  notificationContentForNewMessage,
  notificationContentForNewVideo,
} from "../utils/staticNotificaitonContent";
import NotificationModel from "./notification.model";
import { createUserNotification } from "../AdminNotification/adminNotificationService";
import AdminNotificationModel from "../AdminNotification/AdminNotification.model";
const { Expo } = require("expo-server-sdk");
interface GetNotificationsOptions {
  page?: number;
  limit?: number;
  userId?: string;
  isAdmin?: boolean;
  isTrainer?: boolean;
  isHr?: boolean;
}
export async function sendBulkPushNotifications(
  title: string,
  body: string,
  expoPushTokens: string[]
) {
  const expo = new Expo();

  // Keep only valid tokens
  const validTokens = expoPushTokens.filter(Expo.isExpoPushToken);

  // Break into batches of 100
  const batches = [];
  for (let i = 0; i < validTokens.length; i += 100) {
    batches.push(validTokens.slice(i, i + 100));
  }

  try {
    for (const batch of batches) {
      const messages = batch.map((token) => ({
        to: token,
        sound: "default",
        title,
        body,
      }));

      await expo.sendPushNotificationsAsync(messages);
    }

    return { success: true, message: "Notifications sent successfully" };
  } catch (err) {
    return {
      success: false,
      message: "Failed to send notifications",
      error: err.message,
    };
  }
}
export async function sendPushNotifications(title, body, expoPushTokens, data) {
  try {
    const expo = new Expo();

    function chunkArray(arr, size) {
      const chunks = [];
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      return chunks;
    }

    const batches = chunkArray(expoPushTokens, 100);

    let allSuccess = true;
    const errors = [];

    for (const [index, batch] of batches.entries()) {
      const messages = batch
        .map((token) => {
          if (!Expo.isExpoPushToken(token)) {
            errors.push({
              batch: index + 1,
              token,
              error: "Invalid Expo push token",
            });
            allSuccess = false;
            return null;
          }

          const message: any = {
            to: token,
            sound: "default",
            title,
            body,
          };

          if (data) {
            message.data = data;
          }

          return message;
        })
        .filter(Boolean);
      console.log("this is message");
      console.log(messages);

      if (messages.length === 0) continue;

      try {
        const tickets = await expo.sendPushNotificationsAsync(messages);
        console.log(tickets);

        tickets.forEach((ticket, i) => {
          if (ticket.status === "error") {
            errors.push({
              batch: index + 1,
              token: messages[i].to,
              error: ticket.message,
            });
            allSuccess = false;
          }
        });
      } catch (error) {
        errors.push({
          batch: index + 1,
          error: error.message || error.toString(),
        });
        allSuccess = false;
      }
    }

    if (allSuccess) {
      console.log("went for all success");

      return { success: true, message: "All notifications sent successfully" };
    } else {
      console.log("went for failed");

      return { success: false, message: "Some notifications failed", errors };
    }
  } catch (error) {
    console.log(error.message);

    return { success: false, message: "Some notifications failed", error };
  }
}

export async function getNotifications(options: GetNotificationsOptions = {}) {
  try {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const roleFilters = [];
    if (options.isAdmin) roleFilters.push({ isAdmin: true });
    if (options.isTrainer) roleFilters.push({ isTrainer: true });
    if (options.isHr) roleFilters.push({ isHr: true });

    const filter: any = {};
    if (options.userId) filter.userId = options.userId;
    if (roleFilters.length > 0) filter.$or = roleFilters;

    const [notifications, total] = await Promise.all([
      NotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      NotificationModel.countDocuments(filter),
    ]);

    return {
      success: true,
      message: "Notifications fetched successfully.",
      data: notifications,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
    };
  } catch (error) {
    console.error("getNotifications error:", error);
    return {
      success: false,
      message: "Failed to fetch notifications.",
      data: [],
    };
  }
}

/// Funciton for adding new notification -------------------------------------------------/
export async function postNotification(input: any, userId: string) {
  try {
    console.log("this is input");

    console.log(input);

    const newNotification = new NotificationModel({
      title: input.title,
      body: input.body,
      userId: userId,
      isAdmin: input.isAdmin || false,
      isTrainer: input.isTrainer || false,
      isHr: input.isHr || false,
    });

    const savedNotification = await newNotification.save();

    return {
      success: true,
      message: "Notification created successfully.",
      data: savedNotification,
    };
  } catch (error) {
    console.error("postNotification error:", error);
    return {
      success: false,
      message: "Failed to create notification.",
      data: null,
    };
  }
}

///// Functionf or sending support message ntoficaiton -----------------------------/
export async function sendSupportMessageNotification(
  userId: string,
  conversation: any
) {
  try {
    if (conversation.role !== "user") {
      // Get only the expoPushToken field from the DB
      const userDetails = await UserModel.findById(userId).select(
        "expoPushToken"
      );

      const tokens = [];
      if (userDetails && userDetails.expoPushToken) {
        tokens.push(userDetails.expoPushToken);
      }

      // Prepare navigation data for support message
      const navigationData = {
        screen: "dashboard/supportchat",
        params: {},
      };

      // Send notifications if we have at least one token
      if (tokens.length > 0) {
        await sendPushNotifications(
          notificationContentForNewMessage.title,
          notificationContentForNewMessage.body,
          tokens,
          { navigationData }
        );
      }

      // Also create user notification with navigation data
      try {
        const AdminId = '6824c9555c0f5d5253ed8d3f';
        await createUserNotification({
          title: notificationContentForNewMessage.title,
          body: notificationContentForNewMessage.body,
          senderId: AdminId,
          receiverId: userId,
          data: {
            type: "support_message",
            navigationData: navigationData,
          },
        });
      } catch (error) {
        console.error("Error creating user notification:", error);
      }

      return;
    } else {
      return;
    }
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}
export async function sendNotificationToALLUser(title: string, body: string) {
  try {
    // 1. Fetch all users with a valid fcmToken
    const usersWithTokens = await UserModel.find({
      expoPushToken: { $exists: true, $ne: "" }, // token exists and is not empty
    }).select("expoPushToken");

    // 2. Extract all tokens into an array
    const tokens = usersWithTokens.map((user) => user.expoPushToken);

    if (tokens.length === 0) {
      console.log("No valid FCM tokens found.");
      return;
    }
    console.log("this are tokens");

    console.log(tokens);

    // 3. Send bulk notification
    await sendBulkPushNotifications(title, body, tokens);

    console.log(`New video notification sent to ${tokens.length} users.`);
  } catch (error) {
    console.error("Error sending new video notification:", error);
  }
}

export async function sendingNotificationByTakingTwoUserId(
  senderId: any,
  reciverId: any,
  notificationType: string
) {
  try {
    const userIds = [reciverId, senderId];
    const userDetails = await UserModel.find({ _id: { $in: userIds } })
      .select("name expoPushToken")
      .lean();

    // find receiver & sender
    const receiverDetails: any = userDetails.find(
      (item: any) => item._id.toString() === reciverId.toString()
    );
    const senderDetails: any = userDetails.find(
      (item: any) => item._id.toString() === senderId.toString()
    );

    if (!receiverDetails) {
      return; // no receiver found
    }

    const reciverName = receiverDetails.name;
    let reciverToken = receiverDetails.expoPushToken;
    const senderName = senderDetails?.name; // may not exist

    let title = "";
    let body = "";
    if (reciverToken) {
      if (notificationType === "like") {
        if (senderName) {
          title = `Hey ${reciverName},`;
          body = `${senderName} liked your post.`;
        } else {
          title = `Hey ${reciverName},`;
          body = `Someone liked your post.`;
        }
      } else if (notificationType === "comment") {
        if (senderName) {
          title = `Hey ${reciverName},`;
          body = `${senderName} commented on your post.`;
        } else {
          title = `Hey ${reciverName},`;
          body = `Someone commented on your post.`;
        }
      } else if (notificationType === "post_deleted") {
        title = `Hey ${reciverName},`;
        body = `Your post has been removed. If you have any concerns, please contact us.`;
      }

      // Prepare navigation data based on notification type
      let navigationData = null;
      if (notificationType === "like" || notificationType === "comment") {
        navigationData = {
          screen: "dashboard/tabs/feed",
          params: {},
        };
      } else if (notificationType === "post_deleted") {
        navigationData = {
          screen: "dashboard/tabs/feed",
          params: {},
        };
      }

      sendPushNotifications(
        title,
        body,
        [reciverToken],
        navigationData ? { navigationData } : {}
      );
      try {
        createUserNotification({
          title: title,
          body: body,
          senderId: senderId,
          receiverId: reciverId,
          data: {
            type: notificationType === "like" ? "post_like" : notificationType === "comment" ? "comment" : "post_deleted",
            navigationData: navigationData,
          },
        });
      } catch (error) {}
    }

    // 🚀 send push notification here using expoPushToken
  } catch (error) {
    console.error(error);
  }
}

export async function postBatchNotification(inputs: any[]) {
  try {
    const savedNotification = await AdminNotificationModel.insertMany(inputs);

    return {
      success: true,
      message: "Notifications created successfully.",
      data: savedNotification,
    };
  } catch (error) {
    console.error("postNotification error:", error);
    return {
      success: false,
      message: "Failed to create notification.",
      data: null,
    };
  }
}

export async function sendBulkPushNotificationsAndSave(
  title: string,
  body: string,
  users: any[],
  notificationFor: "admin" | "hr" | "trainer" | "user",
  notificationData?: { type: string; navigationData?: any }
) {
  const tokens = [
    ...new Set(
      users.map((user) => user.expoPushToken).filter((token) => !!token)
    ),
  ]; // Removes duplicates

  const expo = new Expo();

  // Keep only valid tokens
  const validTokens = tokens.filter(Expo.isExpoPushToken);

  // Break into batches of 100
  const batches = [];
  for (let i = 0; i < validTokens.length; i += 100) {
    batches.push(validTokens.slice(i, i + 100));
  }

  try {
    for (const batch of batches) {
      const messages = batch.map((token) => {
        const message: any = {
          to: token,
          sound: "default",
          title,
          body,
        };
        // Include navigation data and type in push notification if provided
        if (notificationData) {
          message.data = {
            type: notificationData.type,
            ...(notificationData.navigationData && { navigationData: notificationData.navigationData }),
          };
        }
        return message;
      });

      await expo.sendPushNotificationsAsync(messages);
    }

    const AdminId = '6824c9555c0f5d5253ed8d3f'
    postBatchNotification(
      users.map((user) => {
        return {
          title: title,
          body: body,
          receiverId: user._id,
          senderId: user.senderId ?  user.senderId : "6824c9555c0f5d5253ed8d3f",
          data: notificationData || undefined,
        };
      })
    )
      .then(() => console.log("Background notifications generated."))
      .catch((err) =>
        console.error("Error generating notifications in background:", err)
      );

    return { success: true, message: "Notifications sent successfully" };
  } catch (err) {
    return {
      success: false,
      message: "Failed to send notifications",
      error: err.message,
    };
  }
}
interface CreateNotificationParams {
  title: string;
  body: string;
  userId?: string;
  isAdmin?: boolean;
  isTrainer?: boolean;
  isHr?: boolean;
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    const {
      title,
      body,
      userId,
      isAdmin = false,
      isTrainer = false,
      isHr = false,
    } = params;
    let userName;
    try {
      const data = await UserModel.findById(userId).select("name");
      userName = data.name || null;
    } catch (error) {}
    // Validate at least one target (user or role) is set
    if (!userId && !isAdmin && !isTrainer && !isHr) {
      throw new Error(
        "Notification must have at least one target: userId or a role flag."
      );
    }

    const notification = new NotificationModel({
      title,
      body,
      userId,
      isAdmin,
      isTrainer,
      isHr,
      userName: userName,
    });

    const savedNotification = await notification.save();
    return savedNotification;
  } catch (err) {
    console.error("Failed to create notification:", err);
    throw err;
  }
};
