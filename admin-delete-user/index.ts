import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { getUserRole, verifyAndDecodeToken } from "../src/admin/admin.service";
import { deleteUser } from "../src/users/users.service";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    let adminUserId: string;
    const authResponse = await verifyAndDecodeToken(req);
    if (authResponse) {
      adminUserId = authResponse;
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

    // Check if the user is an admin
    const userRoleResponse = await getUserRole(adminUserId);
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
    if (userRoleResponse.role !== "admin") {
      context.res = {
        status: 403,
        body: {
          message: "Forbidden: Only admins can delete users",
          success: false,
        },
      };
      return;
    }

    // Get the user ID to delete from route parameters
    const userIdToDelete = req.params.userId;

    if (!userIdToDelete) {
      context.res = {
        status: 400,
        body: {
          message: "User ID is required",
          success: false,
        },
      };
      return;
    }

    // Prevent admin from deleting themselves
    if (adminUserId === userIdToDelete) {
      context.res = {
        status: 400,
        body: {
          message: "You cannot delete your own account",
          success: false,
        },
      };
      return;
    }

    // Call the delete user service
    const response: { message: string; success: boolean } = await deleteUser(userIdToDelete);

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
  } catch (error: any) {
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

