import { connect } from "mongoose";
import { Context } from "vm";

let db = null;
export const init = async (context: Context) => {
  const connectionString = process.env["CosmosDbConnectionStringForiness"];
  context.log("Connection String:", connectionString);

  if (!connectionString) {
    console.error(
      "CosmosDbConnectionStringForiness is not set in environment variables."
    );
    return;
  }

  try {
    if (!db) {
      db = await connect(connectionString, {
        dbName: "iness", // Explicitly mention the database name
      });
      context.log("Database connection successful!"); // Connection success message
    }
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
};
