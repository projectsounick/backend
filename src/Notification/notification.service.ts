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
  trainerId?: string;
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

  if (validTokens.length === 0) {
    return { success: false, message: "No valid tokens found" };
  }

  // Break into batches of 100
  const batches = [];
  for (let i = 0; i < validTokens.length; i += 100) {
    batches.push(validTokens.slice(i, i + 100));
  }

  let successCount = 0;
  let failCount = 0;
  const errors: any[] = [];

  for (const batch of batches) {
    try {
      const messages = batch.map((token) => ({
        to: token,
        sound: "default",
        title,
        body,
      }));

      console.log(`[sendBulkPushNotifications] Attempting to send batch of ${batch.length} tokens`);
      
      const tickets = await expo.sendPushNotificationsAsync(messages);
      
      // Check tickets for errors
      tickets.forEach((ticket, index) => {
        if (ticket.status === "error") {
          failCount++;
          errors.push({
            token: batch[index],
            error: ticket.message || "Unknown error",
            details: ticket.details,
          });
          
          // If it's a project mismatch error, try sending individually
          if (ticket.message && ticket.message.includes("same project")) {
            console.log(`[sendBulkPushNotifications] Project mismatch for token, will retry individually: ${batch[index]}`);
          }
        } else {
          successCount++;
        }
      });
    } catch (batchError: any) {
      console.log(`[sendBulkPushNotifications] Batch error caught:`, batchError.message);
      console.log(`[sendBulkPushNotifications] Error details:`, JSON.stringify(batchError, null, 2));
      
      // Check if error is about project mismatch (check both message and error string)
      const errorMessage = batchError.message || batchError.toString() || "";
      const isProjectMismatch = errorMessage.includes("same project") || 
                                errorMessage.includes("conflicting tokens") ||
                                (batchError.error && batchError.error.includes("same project"));
      
      if (isProjectMismatch) {
        console.log(`[sendBulkPushNotifications] Detected project mismatch error, sending ${batch.length} tokens individually...`);
        
        for (const token of batch) {
          try {
            const ticket = await expo.sendPushNotificationsAsync([{
              to: token,
              sound: "default",
              title,
              body,
            }]);
            
            if (ticket[0]?.status === "error") {
              failCount++;
              errors.push({
                token,
                error: ticket[0].message || "Unknown error",
              });
              console.log(`[sendBulkPushNotifications] Failed to send to individual token: ${token.substring(0, 20)}...`);
            } else {
              successCount++;
              console.log(`[sendBulkPushNotifications] Successfully sent to individual token: ${token.substring(0, 20)}...`);
            }
          } catch (individualError: any) {
            failCount++;
            errors.push({
              token,
              error: individualError.message || "Failed to send",
            });
            console.log(`[sendBulkPushNotifications] Individual send error for token ${token.substring(0, 20)}...:`, individualError.message);
          }
        }
      } else {
        // Other errors - fail the whole batch
        console.log(`[sendBulkPushNotifications] Non-project-mismatch error, failing entire batch`);
        failCount += batch.length;
        errors.push({
          batchError: batchError.message || batchError.toString(),
          tokensInBatch: batch.length,
        });
      }
    }
  }

  if (successCount > 0) {
    console.log(`[sendBulkPushNotifications] Completed: ${successCount} succeeded, ${failCount} failed`);
    return { 
      success: true, 
      message: `Notifications sent successfully to ${successCount} users`,
      successCount,
      failCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  } else {
    console.log(`[sendBulkPushNotifications] All notifications failed: ${failCount} total failures`);
    return {
      success: false,
      message: "Failed to send notifications",
      successCount: 0,
      failCount,
      errors,
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
    if (options.trainerId) filter.trainerId = options.trainerId;
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
/// Function to get unique Expo push tokens from an array -----------------------------/
function getUniqueExpoPushTokens(tokens: string[]): string[] {
  // Filter out null/undefined/empty tokens and get unique values
  const validTokens = tokens.filter((token) => token && typeof token === "string" && token.trim() !== "");
  
  // Use Set to get unique tokens (case-sensitive)
  const uniqueTokens = Array.from(new Set(validTokens));
  
  console.log(`[getUniqueExpoPushTokens] Input: ${validTokens.length} valid tokens, Output: ${uniqueTokens.length} unique tokens`);
  
  if (validTokens.length !== uniqueTokens.length) {
    console.log(`[getUniqueExpoPushTokens] Removed ${validTokens.length - uniqueTokens.length} duplicate tokens`);
  }
  
  return uniqueTokens;
}

export async function sendNotificationToALLUser(title: string, body: string) {
  try {
    console.log("[sendNotificationToALLUser] Starting notification send process");
    console.log("[sendNotificationToALLUser] Title:", title);
    console.log("[sendNotificationToALLUser] Body:", body);

    // 1. Fetch all users with a valid expoPushToken
    const usersWithTokens = await UserModel.find({
      expoPushToken: { $exists: true, $ne: null, $nin: [null, ""] }, // token exists and is not empty
      role: "user", // Only send to regular users, not admins/trainers
    }).select("expoPushToken _id");

    console.log(`[sendNotificationToALLUser] Found ${usersWithTokens.length} users with tokens`);

    // 2. Extract all tokens into an array, filtering out null/undefined/empty
    const allTokens = usersWithTokens
      .map((user) => user.expoPushToken)
      .filter((token) => token && token.trim() !== "");

    console.log(`[sendNotificationToALLUser] Valid tokens count (before deduplication): ${allTokens.length}`);

    // 3. Get unique tokens only
    const tokens = getUniqueExpoPushTokens(allTokens);

    console.log(`[sendNotificationToALLUser] Unique tokens count: ${tokens.length}`);
    console.log("[sendNotificationToALLUser] Sample tokens (first 3):", tokens.slice(0, 3));

    if (tokens.length === 0) {
      console.log("[sendNotificationToALLUser] No valid expo push tokens found.");
      return { success: false, message: "No valid tokens found", sentCount: 0 };
    }

    // 4. Send bulk notification
    const result = await sendBulkPushNotifications(title, body, tokens);

    console.log(`[sendNotificationToALLUser] Notification sending result:`, JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log(`[sendNotificationToALLUser] Successfully sent to ${result.successCount || 0} users. Failed: ${result.failCount || 0}`);
      return { 
        success: true, 
        message: "Notifications sent", 
        sentCount: result.successCount || 0,
        failCount: result.failCount || 0,
      };
    } else {
      console.log(`[sendNotificationToALLUser] Failed to send notifications. Error: ${result.message}`);
      return { 
        success: false, 
        message: result.message || "Failed to send notifications",
        sentCount: result.successCount || 0,
        failCount: result.failCount || tokens.length,
        errors: result.errors,
      };
    }
  } catch (error) {
    console.error("[sendNotificationToALLUser] Error sending notification:", error);
    console.error("[sendNotificationToALLUser] Error stack:", error.stack);
    return { success: false, message: error.message, error };
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
  trainerId?: string;
  userName?: string; // Sender's name
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
      trainerId,
      userName: providedUserName,
      isAdmin = false,
      isTrainer = false,
      isHr = false,
    } = params;
    
    let userName = providedUserName;
    
    // If userName is not provided, try to get it from userId or trainerId
    if (!userName) {
      try {
        const data = await UserModel.findById(userId || trainerId).select("name");
        userName = data?.name || null;
      } catch (error) {
        console.error("Error fetching user name:", error);
      }
    }
    
    // Validate at least one target (user or role) is set
    if (!userId && !trainerId && !isAdmin && !isTrainer && !isHr) {
      throw new Error(
        "Notification must have at least one target: userId, trainerId or a role flag."
      );
    }

    const notification = new NotificationModel({
      title,
      body,
      userId,
      trainerId,
      isAdmin,
      isTrainer,
      isHr,
      userName: userName || null,
    });

    const savedNotification = await notification.save();
    return savedNotification;
  } catch (err) {
    console.error("Failed to create notification:", err);
    throw err;
  }
};
