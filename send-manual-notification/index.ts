import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { adminPanelOtpVerification } from "../src/users/users.service";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { User } from "../src/users/user.model";
import {
  postNotification,
  sendPushNotifications,
} from "../src/Notification/notification.service";
import { verifyAndDecodeToken } from "../src/admin/admin.service";

//// Main login function ------------------------------------------------------------------------------/
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    /// Building connection with the cosmos database -----------------/
    await init(context);
    let userId: string;
    const authResponse = await verifyAndDecodeToken(req);
    if (authResponse) {
      userId = authResponse;
    } else {
      context.res = {
        status: 401,
        body: {
          message: "Unauthorized",
          success: false,
        },
      };
      return;
    }
    let { title, body, expoPushTokens } = req.body;
    /// Calling the service function ----------------------/
    const response: { message: string; success: boolean } =
      await sendPushNotifications(title, body, expoPushTokens);
    if (response.success) {
      context.res = {
        status: 200,
        body: response,
      };
    } else {
      context.res = {
        status: 500,
        body: response,
      };
    }
  } catch (error) {
    context.res = {
      status: 500,
      body: {
        message: `${error.message}`,
        success: false,
      },
    };
  }
};

export default httpTrigger;
