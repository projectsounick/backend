import { AzureFunction, Context } from "@azure/functions";

import dayjs from "dayjs";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import {
  getFcmTokens,
  getUpcomingUsersWhoHasSession,
} from "../src/utils/mongoqueryUtils";
import { sendBulkPushNotifications } from "../src/Notification/notification.service";

const timerTrigger: AzureFunction = async function (
  context: Context,
  myTimer: any
): Promise<void> {
  const now = dayjs();
  const nextHour = now.add(1, "hour");
  await init(context);

  try {
    // Build today's date boundaries
    const todayStart = now.startOf("day").toDate();
    const todayEnd = now.endOf("day").toDate();

    // Query sessions within next hour

    let usersToNotify = await getUpcomingUsersWhoHasSession(
      now,
      nextHour,
      todayStart,
      todayEnd
    );
    ////function for getting the fcm tokens of the users -----------/
    if (usersToNotify && usersToNotify.length > 0) {
      const fcmTokens = await getFcmTokens(usersToNotify);

      if (fcmTokens.length === 0) {
        return; // No valid tokens
      }

      const title = "📅 Session Upcoming";
      const body = "You have a session coming up soon. Be ready to join!";

      // const result = await sendBulkPushNotifications(title, body, fcmTokens);
    } else {
      return;
    }
  } catch (err) {
    context.log.error("Error in timer trigger:", err);
  }
};

export default timerTrigger;
