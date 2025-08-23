import { AzureFunction, Context } from "@azure/functions";
import UserModel from "../src/users/user.model";
import { sendBulkPushNotificationsAndSave } from "../src/Notification/notification.service";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";

import {
  notificationContentForImageProgress,
  notificationContentForSteps,
  notificationContentForWaterLog,
} from "../src/utils/staticNotificaitonContent";

// "schedule": "0 0 9,12,16,20 * * *"
// Old
const timerTrigger: AzureFunction = async function (
  context: Context,
  myTimer: any
): Promise<void> {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  await init(context);

  let notificationContent = null;

  if (hours === 11 && minutes === 0) {
    notificationContent = notificationContentForImageProgress; // 11:00 AM
  } else if (hours === 16 && minutes === 0) {
    notificationContent = notificationContentForWaterLog; // 4:00 PM
  } else if (hours === 20 && minutes === 0) {
    notificationContent = notificationContentForSteps; // 8:00 PM
  }

  if (!notificationContent) {
    context.log("No matching notification schedule for this run.");
    return;
  }

  // Fetch all users
  const users = await UserModel.find({}).select("expoPushToken").lean();


  if (users.length > 0) {
    await sendBulkPushNotificationsAndSave(
      notificationContent.title,
      notificationContent.body,
      users,
      'user'
    );
    context.log(`Notification sent to ${users.length} unique users`);
  } else {
    context.log("No valid push tokens found.");
  }
};

export default timerTrigger;
