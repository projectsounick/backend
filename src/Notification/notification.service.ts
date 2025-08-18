import { log } from "node:console";
import UserModel from "../users/user.model";
import {
  notificationContentForNewMessage,
  notificationContentForNewVideo,
} from "../utils/staticNotificaitonContent";
import NotificationModel from "./notification.model";
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

      // Send notifications if we have at least one token
      if (tokens.length > 0) {
        await sendBulkPushNotifications(
          notificationContentForNewMessage.title,
          notificationContentForNewMessage.body,
          tokens
        );
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
      }

      sendPushNotifications(title, body, [reciverToken], {});
    }

    // 🚀 send push notification here using expoPushToken
  } catch (error) {
    console.error(error);
  }
}


export async function postBatchNotification(inputs: any[]) {
  try {
    const savedNotification = await NotificationModel.insertMany(inputs);

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
  notificationFor : 'admin' | 'hr' | 'trainer' | 'user'
) {
  const tokens = [...new Set(users.map((user) => user.expoPushToken).filter((token) => !!token)),]; // Removes duplicates

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
      const messages = batch.map((token) => ({
        to: token,
        sound: "default",
        title,
        body,
      }));

      await expo.sendPushNotificationsAsync(messages);
    }

    postBatchNotification(users.map((user)=>{
      return {
        title: title,
        body: body,
        isAdmin: notificationFor === 'admin',
        isTrainer: notificationFor === 'trainer',
        isHr: notificationFor === 'hr',
        userId: user._id
      }
    }))
      .then(() => console.log("Background notifications generated."))
      .catch(err => console.error("Error generating notifications in background:", err));

    return { success: true, message: "Notifications sent successfully" };
  } catch (err) {
    return {
      success: false,
      message: "Failed to send notifications",
      error: err.message,
    };
  }
}