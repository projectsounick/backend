import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { adminPanelOtpVerification } from "../src/users/users.service";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { User } from "../src/users/user.model";
import { postNotification } from "../src/Notification/notification.service";

//// Main login function ------------------------------------------------------------------------------/
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    /// Building connection with the cosmos database -----------------/
    await init(context);

    /// Calling the service function ----------------------/
    const response: { message: string; success: boolean; data: any } =
      await postNotification(req.body);
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
