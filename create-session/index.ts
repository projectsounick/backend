import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { checkIfAdmin, getUserRole, verifyAndDecodeToken } from "../src/admin/admin.service";
import { createNewSession } from "../src/sessions/sessions.service";

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

    const userRoleResponse = await getUserRole(userId);
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
    if (userRoleResponse.role != "admin" && userRoleResponse.role != "trainer") {
     context.res = {
        status: 401,
        body: {
          message: "Unauthorized",
          success: false,
        },
      };
      return;
    }

    const toBeassignedUserId = req.params.userId;

    const response: { message: string; success: boolean } = await createNewSession(toBeassignedUserId,req.body,userId);
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
