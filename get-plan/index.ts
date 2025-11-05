import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { verifyAndDecodeToken } from "../src/admin/admin.service";
import { getPlan } from "../src/Plans/plan.service";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    await init(context);
    const { isActive, planItemStatus, page, limit } = req.query;

    const parsedIsActive =
      isActive === "true" ? true : isActive === "false" ? false : null;

    const planItemStatusArr = [];
    if (planItemStatus === undefined || planItemStatus === null) {
      planItemStatusArr.push(true);
      planItemStatusArr.push(false);
    } else if (planItemStatus === "false") {
      planItemStatusArr.push(false);
    } else {
      planItemStatusArr.push(true);
    }

    const response: { message: string; success: boolean } = await getPlan(
      parsedIsActive,
      planItemStatusArr,
      page,
      limit
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
