import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { getProductCategory } from "../src/products/category.service";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    // let userId: string;
    // const authResponse = await verifyAndDecodeToken(req);
    // if (authResponse) {
    //   userId = authResponse;
    // } else {
    //   context.res = {
    //     status: 401,
    //     body: {
    //       message: "Unauthorized",
    //       success: false,
    //     },
    //   };
    //   return;
    // }

    await init(context);
    const { isActive, page, limit } = req.query;

    const parsedIsActive =
      isActive === "true" ? true : isActive === "false" ? false : null;

    const response: { message: string; success: boolean } = await getProductCategory(
      parsedIsActive,
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
