import mongoose, { connect, Connection, createConnection } from "mongoose";

let connections: { [key: string]: Connection | null } = {
  iness: null,
};

export const init = async () => {
  console.log("called");

  try {
    // Connect to iness database if not already connected
    if (!connections.iness) {
      console.log("Connecting to iness database...");
      connections.iness = createConnection(
        process.env["CosmosDbConnectionStringForiness"]!,
        {
          dbName: "iness",
        }
      );
      connections.iness.on("connected", () =>
        console.log("iness database connected")
      );
      connections.iness.on("error", (err) =>
        console.error("iness database connection error:", err)
      );
    } else {
      console.log("Already connected to iness database");
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
