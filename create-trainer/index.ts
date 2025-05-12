import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { addTrainer } from "../src/users/users.service";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { checkIfAdmin, verifyAndDecodeToken } from "../src/admin/admin.service";
import { isUserPresent } from "../src/utils/usersUtils";

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
    if(!checkIfAdmin(userId)) {
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
    const { userPresent, message } = await isUserPresent(req.body);
    if (userPresent) {
      context.res = {
        status: 400,
        body: {
          message: message,
          success: false,
        },
      };
      return;
    }
    const response: { message: string; success: boolean } = await addTrainer(req.body);
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
