import UserQueryModel from "./userquery.model";

//// Function for storing the user query into database -----------------------------------/

export async function storeUserQuery({
  name,
  email,
  phoneNumber,
  message,
}): Promise<{ success: boolean; message: string }> {
  try {
    // Create a new user query document
    const newQuery = new UserQueryModel({
      name,
      email,
      phoneNumber,
      message,
    });

    // Save the query to the database
    await newQuery.save();
    await sendEmail({
      email: email,
      subject: `Query From ${name}`,
      html: userQueryEmailTemplate(name, message),
    });
    return {
      success: true,
      message: "Your query has been submitted successfully",
    };
  } catch (error) {
    throw new Error(`Error saving user query: ${error}`);
  }
}
