import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";

import {
  notificationContentForImageProgress,
  notificationContentForSteps,
  notificationContentForWaterLog,
} from "../src/utils/staticNotificaitonContent";

import { sendBulkPushNotificationsAndSave } from "../src/Notification/notification.service";
import UserModel from "../src/users/user.model";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  await init(context);

  let notificationContent = null;

  if (hours === 17 && minutes === 0) {
    notificationContent = notificationContentForImageProgress; // 5:00 PM
  } else if (hours === 17 && minutes === 30) {
    notificationContent = notificationContentForWaterLog; // 5:30 PM
  } else if (hours === 18 && minutes === 0) {
    notificationContent = notificationContentForSteps; // 6:00 PM
  } else if (hours === 18 && minutes === 30) {
    notificationContent = notificationContentForSteps; // 6:30 PM
  }else{
    notificationContent = notificationContentForSteps;
  }

  if (!notificationContent) {
    context.log("No matching notification schedule for this run.");
    return;
  }

  // Fetch all users
  const users = await UserModel.find({"email" : "mannada.sayan@gmail.com"}).select("expoPushToken").lean();
  

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

export default httpTrigger;
