import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import {
  checkIfAdmin,
  getUserRole,
  verifyAndDecodeToken,
} from "../src/admin/admin.service";
import { getAllTrainers, getTrainerById } from "../src/users/users.service";

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

    const { isActive, search, page, limit } = req.query;

    const parsedIsActive =
      isActive === "true" ? true : isActive === "false" ? false : null;
    const parsedPage = page ? parseInt(page, 10) : 1;
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    let response: { message: string; success: boolean };
    if (userRoleResponse.role === "trainer") {
      response = await getTrainerById(userId);
    } else if (userRoleResponse.role === "admin") {
      response = await getAllTrainers(
        parsedIsActive,
        search,
        parsedPage,
        parsedLimit
      );
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
