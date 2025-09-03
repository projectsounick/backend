import { AzureFunction, Context } from "@azure/functions";
import mongoose from "mongoose";
import UserModel from "../src/users/user.model";
import UserActivePlansModel from "../src/userActivePlans/activePlans.model";

import { sendBulkPushNotificationsAndSave } from "../src/Notification/notification.service";
import { notificationContentForPlanEnd } from "../src/utils/staticNotificaitonContent";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";

// Timer schedule example: every day at 00:00 UTC
// "schedule": "0 0 * * * *"

const timerTrigger: AzureFunction = async function (
  context: Context,
  myTimer: any
): Promise<void> {
  try {
    await init(context);

    const now = new Date(); // current UTC time

    // 1️⃣ Fetch expired active plans and services in parallel
    const [expiredPlans] = await Promise.all([
      UserActivePlansModel.find({
        isActive: true,
        planEndDate: { $lte: now },
      }).select("userId"),
    ]);

    const expiredUserIds = Array.from(
      new Set([...expiredPlans.map((p) => p.userId.toString())])
    );

    if (!expiredUserIds.length) {
      context.log("No expired plans or services found.");
      return;
    }

    // 2️⃣ Mark expired plans/services as inactive
    await Promise.all([
      UserActivePlansModel.updateMany(
        { userId: { $in: expiredUserIds }, isActive: true },
        { $set: { isActive: false } }
      ),
    ]);

    context.log(
      `Marked ${expiredUserIds.length} users' plans/services as inactive.`
    );

    // 3️⃣ Fetch users with valid expoPushToken
    const usersToNotify = await UserModel.find({
      _id: { $in: expiredUserIds },
      expoPushToken: { $exists: true, $ne: null },
    })
      .select("expoPushToken")
      .lean();

    if (usersToNotify.length) {
      await sendBulkPushNotificationsAndSave(
        notificationContentForPlanEnd.title,
        notificationContentForPlanEnd.body,
        usersToNotify,
        "user"
      );
      context.log(`Notifications sent to ${usersToNotify.length} users.`);
    } else {
      context.log("No valid push tokens found for expired users.");
    }
  } catch (error) {
    context.log("Error in expired plan/service check:", error);
  }
};

export default timerTrigger;
