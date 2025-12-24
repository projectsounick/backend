import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { loginUser, loginUserApp, loginUserAppNew } from "../src/users/users.service";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { User } from "../src/users/user.model";

//// Main login function ------------------------------------------------------------------------------/
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    /// Building connection with the cosmos database -----------------/
    try {
      await init(context);
    } catch (dbError: any) {
      // Database connection error - return it in response
      context.log.error("Database connection error:", dbError);
      context.res = {
        status: 500,
        body: {
          message: `Database connection failed: ${dbError?.message || dbError}`,
          success: false,
          error: "DATABASE_CONNECTION_ERROR",
          details: dbError?.message || "Unable to connect to database",
        },
      };
      return;
    }

    /// replace this query _id with jsonwebtoken _id later on
    context.log("Request body:", req.body);
    
    // Validate request body
    if (!req.body || !req.body.email) {
      context.res = {
        status: 400,
        body: {
          message: "Email is required",
          success: false,
          error: "VALIDATION_ERROR",
        },
      };
      return;
    }

    /// Calling the service function ----------------------/
    const response: {
      message: string;
      success: boolean;
      data: User;
    } = await loginUserAppNew(req.body.email);
    
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
    // Catch any other errors
    context.log.error("Error in user-app-login:", error);
    context.log.error("Error stack:", error?.stack);
    
    context.res = {
      status: 500,
      body: {
        message: error?.message || "Internal server error",
        success: false,
        error: "INTERNAL_ERROR",
        details: error?.message || "An unexpected error occurred",
      },
    };
  }
};

export default httpTrigger;
