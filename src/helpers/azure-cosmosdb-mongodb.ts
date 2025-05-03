import { connect } from "mongoose";
import { Context } from "vm";

let db = null;
export const init = async (context: Context) => {
  // const connectionString = process.env["CosmosDbConnectionStringForiness"];
  const connectionString = 'mongodb://localhost:27017/iness';
  context.log("Connection String:", connectionString);

  if (!connectionString) {
    console.error(
      "CosmosDbConnectionStringForiness is not set in environment variables."
    );
    return;
  }

  try {
    if (!db) {
      db = await connect(connectionString);
      context.log("Database connection successful!"); // Connection success message
    }
  } catch (error) {
    context.log("Error connecting to database:", error);
  }
};
