import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import {
  checkIfNormalUser,
  verifyAndDecodeToken,
} from "../src/admin/admin.service";
import { addCart } from "../src/cart/cart.service";
import { getNotifications } from "../src/Notification/notification.service";
function parseBoolean(value: any): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
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
    await init(context);

    if (!checkIfNormalUser(userId)) {
      context.res = {
        status: 401,
        body: {
          message: "Unauthorized",
          success: false,
        },
      };
      return;
    }

    const response = await getNotifications({
      isAdmin: parseBoolean(req.query.isAdmin),
      isTrainer: parseBoolean(req.query.isTrainer),
      isHr: parseBoolean(req.query.isHr),
      userId: req.query.userId as string,
      trainerId: req.query.trainerId as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
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
