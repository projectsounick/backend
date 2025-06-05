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
    if( (userRoleResponse.role == "admin" || userRoleResponse.role == "trainer" || userRoleResponse.role == "hr") && !req.query.userId) {
      context.res = {
        status: 403,
        body: {
          message: "User ID is required",
          success: false,
        },
      };
      return;
    }
    const { userId, status, page, limit } = req.query;
    const parsedUserId = userRoleResponse.role === "user" ? callingUserId : userId;
    console.log("Parsed User ID:", parsedUserId);
    const response: { message: string; success: boolean } = await getPaymentItems(parsedUserId, status, page, limit);
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
