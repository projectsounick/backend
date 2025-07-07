import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import {
  generateSasToken,
  generateSasTokenForAnyContainer,
  verifyAndDecodeToken,
} from "../src/admin/admin.service";
import { generateAccountSASQueryParameters } from "@azure/storage-blob";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    // ✅ Send response with SAS Token
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
    console.log(req.query);

    let contName = req.query.contName;
    context.res = {
      status: 200,
      body: {
        message: "Storage SAS Token generated successfully",
        success: true,
        data: {
          storageAccountName: process.env.storageAccountName,
          sasToken: generateSasToken(req.query.container, req.query.contName),
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
