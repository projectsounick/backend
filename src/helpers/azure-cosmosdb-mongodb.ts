import { connect } from "mongoose";
import { Context } from "vm";

let db = null;
export const init = async (context: Context) => {
  const connectionString = process.env["CosmosDbConnectionStringForIness"];
  context.log("Connection String:", connectionString ? "***SET***" : "***MISSING***");

  if (!connectionString) {
    const errorMsg = "CosmosDbConnectionStringForIness is not set in environment variables.";
    context.log.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    if (!db) {
      context.log("Attempting to connect to database...");
      db = await connect(connectionString);
      context.log("Database connection successful!"); // Connection success message
    } else {
      context.log("Using existing database connection");
    }
  } catch (error: any) {
    const errorMsg = `Database connection failed: ${error?.message || error}`;
    context.log.error("Error connecting to database:", errorMsg);
    context.log.error("Error details:", JSON.stringify(error, null, 2));
    throw new Error(errorMsg);
  }
};
