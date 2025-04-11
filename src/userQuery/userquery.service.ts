import { UserQueryModel } from "./userquery.model";
const { sendEmail } = require("../helpers/send-email");
const { userQueryEmailTemplate } = require("../template/userQueryEmail");
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
    // Create a new user query document
    const newQuery = new UserQueryModel({
      name: name,
      email: email,
      contactNo: contactNo,
      message: message,
      category: category,
      goal: goal,
    });

    // Save the query to the database
    await newQuery.save();
    await sendEmail({
      email: email,
      subject: `Query From ${name}`,
      to: "founder@iness.fitness",
      html: userQueryEmailTemplate(name, message, contactNo, category, goal),
    });
    return {
      success: true,
      message: "Your query has been submitted successfully",
    };
  } catch (error) {
    context.log(error.message);

    throw new Error(`Error saving user query: ${error}`);
  }
}
