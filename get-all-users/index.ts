import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import {
  getAllUsers,
  getTrainerAssignedUsers,
  loginUser,
  updateUserData,
  userOtpVerify,
} from "../src/users/users.service";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { getUserRole, verifyAndDecodeToken } from "../src/admin/admin.service";

//// Main login function ------------------------------------------------------------------------------/
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

    let response: { message: string; success: boolean };
    if (userRoleResponse.role == "admin") {
      response = await getAllUsers(req.query);
    } else if (userRoleResponse.role == "trainer") {
      console.log("went inside this");
      response = await getTrainerAssignedUsers(userId, req.query);
    } else if (userRoleResponse.role == "hr") {
      response = await getAllUsers(req.query);
    } else {
      context.res = {
        status: 403,
        body: {
          message: "Forbidden",
          success: false,
        },
      };
      return;
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
