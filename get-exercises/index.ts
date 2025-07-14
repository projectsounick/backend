import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { checkIfAdmin, verifyAndDecodeToken } from "../src/admin/admin.service";
import { updatePlan } from "../src/Plans/plan.service";
import { getUpdatePaymentStatus } from "../src/payment/payment.service";
import { getExercise } from "../src/workout/workout.service";

//// Main login function ------------------------------------------------------------------------------/
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    let userId: string;
    const authResponse = verifyAndDecodeToken(req);
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
    let status;
    if (req.query.status === "true") {
      status = true;
    } else if (req.query.status === "false") {
      status = false;
    } else {
      status = null;
    }

    const response: { message: string; success: boolean } = await getExercise(
      status,
      req.query.page,
      req.query.limit
    );
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
