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
export async function sendPushNotifications(title, body, expoPushTokens) {
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
        return {
          to: token,
          sound: "default",
          title,
          body,
          data: { withSome: "data" },
        };
      })
      .filter(Boolean);

    if (messages.length === 0) continue;

    try {
      const tickets = await expo.sendPushNotificationsAsync(messages);
      // Check tickets for errors (optional)
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
    return { success: true, message: "All notifications sent successfully" };
  } else {
    return { success: false, message: "Some notifications failed", errors };
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
