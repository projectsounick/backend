import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { getUserRole, verifyAndDecodeToken } from "../src/admin/admin.service";
import { getUserServiceHistory, getUserServiceHistoryNew } from "../src/userActivePlans/activePlans.service";

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

    const { isActive, userId } = req.query;

    const parsedIsActive =
      isActive === "true" ? true : isActive === "false" ? false : null;
    const parsedUserId =
      userRoleResponse.role === "user" ? callingUserId : userId;
    console.log("Parsed User ID:", parsedUserId);
    // const response: { message: string; success: boolean } =
    //   await getUserServiceHistory(parsedUserId, parsedIsActive);
    let response: { message: string; success: boolean };
    if (userRoleResponse.role === "user") {
      response = await getUserServiceHistoryNew(parsedUserId, parsedIsActive);
    } else {
      response = await getUserServiceHistory(parsedUserId, parsedIsActive);
    }
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
