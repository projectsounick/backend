import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { verifyAndDecodeToken } from "../src/admin/admin.service";

import { getNotificationsByUser } from "../src/AdminNotification/adminNotificationService";
import { getActiveManualWorkoutPlans } from "../src/ActiveManualWorkoutPlan/activemanualworkoutplan.service";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    let userId: string;
    const authResponse = await verifyAndDecodeToken(req);
    console.log("this is authreposne");
    console.log(authResponse);

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

    const query: Record<string, any> = {
      userId: req.query.userId,
    };

    // ✅ If "isActive" is passed in query string, include it
    if (req.query?.isActive !== undefined) {
      query.isActive = req.query.isActive === "true";
    }
    console.log("this is query");
    console.log(query);

    // 📦 Fetch active manual workout plans
    const response = await getActiveManualWorkoutPlans(query);

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
