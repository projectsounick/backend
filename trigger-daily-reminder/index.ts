import { AzureFunction, Context } from "@azure/functions";
import UserModel from "../src/users/user.model";
import { sendBulkPushNotifications } from "../src/Notification/notification.service";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";

import {
  notificationContentForImageProgress,
  notificationContentForSteps,
  notificationContentForWaterLog,
} from "../src/utils/staticNotificaitonContent";

const timerTrigger: AzureFunction = async function (
  context: Context,
  myTimer: any
): Promise<void> {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  await init(context);

  let notificationContent = null;

  if (hours === 9 && minutes === 0) {
    notificationContent = notificationContentForImageProgress;
  } else if (hours === 12 && minutes === 0) {
    notificationContent = notificationContentForWaterLog;
  }  else if (hours === 16 && minutes === 0) {
    notificationContent = notificationContentForSteps;
  }
  else if (hours === 20 && minutes === 0) {
    notificationContent = notificationContentForSteps;
  }

  if (!notificationContent) {
    context.log("No matching notification schedule for this run.");
    return;
  }

  // Fetch all users
  const users = await UserModel.find({}).select("expoPushToken").lean();
  const tokens = [
    ...new Set(
      users.map((user) => user.expoPushToken).filter((token) => !!token)
    ),
  ]; // Removes duplicates

  if (tokens.length > 0) {
    await sendBulkPushNotifications(
      notificationContent.title,
      notificationContent.body,
      tokens
    );
    context.log(`Notification sent to ${tokens.length} unique users`);
  } else {
    context.log("No valid push tokens found.");
  }
};

export default timerTrigger;
