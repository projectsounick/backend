import { AzureFunction, Context } from "@azure/functions";
import UserModel from "../src/users/user.model";
import { sendBulkPushNotificationsAndSave } from "../src/Notification/notification.service";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { notificationContentForPlanExpire } from "../src/utils/staticNotificaitonContent";
import UserActivePlansModel from "../src/userActivePlans/activePlans.model";

// "schedule": "0 0 9,12,16,20 * * *"
// Old
const timerTrigger: AzureFunction = async function (
  context: Context,
  myTimer: any
): Promise<void> {
  const now = new Date();
  const fiveDaysLater = new Date();
  fiveDaysLater.setDate(now.getDate() + 5);


  await init(context);

  // Get all active plans that expire within next 5 days
  const expiringPlans = await UserActivePlansModel.find({
    isActive: true,
    planEndDate: {
      $lte: fiveDaysLater, // expires in <=5 days
      $gte: now            // and not already expired
    }
  }).select("userId planEndDate");

  const userIds = expiringPlans.map((plan) => plan.userId);

  if (userIds.length === 0) {
    context.log("No users with plans expiring within 5 days.");
    return;
  }



  /// Fetch users with valid expoPushTokens
  const users = await UserModel.find({
    _id: { $in: userIds },
    expoPushToken: { $exists: true, $ne: null }
  }).select("expoPushToken").lean();

  if (users.length > 0) {
    await sendBulkPushNotificationsAndSave(
      notificationContentForPlanExpire.title,
      notificationContentForPlanExpire.body,
      users,
      'user'
    );
    context.log(`Notification sent to ${users.length} users with expiring plans`);
  } else {
    context.log("No valid push tokens found.");
  }
};

export default timerTrigger;
