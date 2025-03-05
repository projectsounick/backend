import mongoose, { connect, Connection, createConnection } from "mongoose";
import { Context } from "vm";

let connections: { [key: string]: Connection | null } = {
  iness: null,
};

export const init = async (context: Context) => {
  context.log("called");
  context.log(process.env["CosmosDbConnectionStringForiness"]);
  try {
    // Connect to iness database if not already connected
    if (!connections.iness) {
      context.log("Connecting to iness database...");
      connections.iness = createConnection(
        process.env["CosmosDbConnectionStringForiness"]!,
        {
          dbName: "iness",
        }
      );
      connections.iness.on("connected", () =>
        context.log("iness database connected")
      );
      connections.iness.on("error", (err) =>
        console.error("iness database connection error:", err)
      );
    } else {
      context.log("Already connected to iness database");
    }
  } catch (error) {
    console.error("Error connecting to databases:", error);
    throw error;
  }
};

export const getInessDb = (): Connection => {
  if (!connections.iness) {
    throw new Error("iness database connection is not initialized.");
  }
  return connections.iness;
};
