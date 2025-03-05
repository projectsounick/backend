import { getInessDb } from "../helpers/azure-cosmosdb-mongodb";
import { UserQueryModel } from "./userquery.model";

//// Function for storing the user query into database -----------------------------------/

export async function storeUserQuery(
  {
    name,
    email,

    message,
    contactNo,
    category,
    goal,
  },
  context
): Promise<{ success: boolean; message: string }> {
  try {
    const dbConnection = getInessDb();
    context.log(dbConnection);
    const UserQuery = UserQueryModel(dbConnection);

    // Create a new user query document
    const newQuery = new UserQuery({
      name: name,
      email: email,
      contactNo: contactNo,
      message: message,
      category: category,
      goal: goal,
    });

    // Save the query to the database
    await newQuery.save();
    // await sendEmail({
    //   email: email,
    //   subject: `Query From ${name}`,
    //   html: userQueryEmailTemplate(name, message),
    // });
    return {
      success: true,
      message: "Your query has been submitted successfully",
    };
  } catch (error) {
    context.log(error.message);

    throw new Error(`Error saving user query: ${error}`);
  }
}
