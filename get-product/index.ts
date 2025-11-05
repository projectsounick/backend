import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { verifyAndDecodeToken } from "../src/admin/admin.service";
import { getProduct } from "../src/products/product.service";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    await init(context);
    const { isActive, variationsStatus, page, limit } = req.query;

    const parsedIsActive =
      isActive === "true" ? true : isActive === "false" ? false : null;

    const variationsStatusArr = [];
    if (variationsStatus === undefined || variationsStatus === null) {
      variationsStatusArr.push(true);
      variationsStatusArr.push(false);
    } else if (variationsStatus === "false") {
      variationsStatusArr.push(false);
    } else {
      variationsStatusArr.push(true);
    }

    const response: { message: string; success: boolean } = await getProduct(
      parsedIsActive,
      variationsStatusArr,
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
