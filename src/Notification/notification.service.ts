import NotificationModel from "./notification.model";

interface GetNotificationsOptions {
  page?: number;
  limit?: number;
  userId?: string;
  isAdmin?: boolean;
  isTrainer?: boolean;
  isHr?: boolean;
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
