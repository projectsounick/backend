import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { getUserRole, verifyAndDecodeToken } from "../src/admin/admin.service";
import { getPaymentItems } from "../src/payment/payment.service";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    let callingUserId: string;
    const authResponse = await verifyAndDecodeToken(req);
    if (authResponse) {
      callingUserId = authResponse;
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

    const userRoleResponse = await getUserRole(callingUserId);
    if (!userRoleResponse.status) {
      context.res = {
        status: 401,
        body: {
          message: "Unauthorized",
          success: false,
        },
      };
      return;
    }

    context.res = {
      status: 200,
      body: {
        message: "Merchent key fetched successfully",
        success: true,
        clientId: process.env.CLIENT_ID,
        merchentId: process.env.MERCHENT_ID,
      },
    };
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
