import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { checkIfAdmin, verifyAndDecodeToken } from "../src/admin/admin.service";
import { assignDietPlanToUser, assignPlanToUser } from "../src/userActivePlans/activePlans.service";

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

    if (!checkIfAdmin(userId)) {
      context.res = {
        status: 401,
        body: {
          message: "Unauthorized",
          success: false,
        },
      };
      return;
    }
    const userToGetAssigendId = req.params.userId;
    const planType = req.body.type;
    console.log(planType)
    let response: { message: string; success: boolean };
    if(planType === 'plan'){
      response = await assignPlanToUser(userToGetAssigendId, req.body.planId, req.body.planItemId,userId);
    }else{
      response = await assignDietPlanToUser(userToGetAssigendId, req.body.dietPlanId,userId)
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
