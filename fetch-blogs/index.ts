import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import {
  loginUser,
  updateUserData,
  userOtpVerify,
} from "../src/users/users.service";
import { init } from "../src/helpers/azure-cosmosdb-mongodb";
import { createBlog, getBlogs } from "../src/Blogs/blogs.service";
import { Blog } from "../src/Blogs/blogs.model";

//// Main login function ------------------------------------------------------------------------------/
const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  try {
    /// Building connection with the cosmos database -----------------/
    await init(context);

    /// replace this query _id with jsonwebtoken _id later on

    /// Calling the service function ----------------------/
    const response: { message: string; success: boolean; data: Blog[] } =
      await getBlogs(req.query.id);
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
