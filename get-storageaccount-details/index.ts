import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { generateSasToken } from "../src/admin/admin.service";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    // ✅ Send response with SAS Token
    context.res = {
      status: 200,
      body: {
        message: "Storage SAS Token generated successfully",
        success: true,
        data: {
          storageAccountName: process.env.storageAccountName,
          sasToken: generateSasToken(req.query.container),
        },
      },
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: {
        message: `Error generating SAS Token: ${error.message}`,
        success: false,
      },
    };
  }
};

export default httpTrigger;
