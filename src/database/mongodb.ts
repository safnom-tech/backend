import mongoose from "mongoose";
import { env } from "../config/env.js";
import { reconcileFirebaseUidIndex } from "../modules/users/users.model.js";
import { logger } from "../utils/logger.js";

export type DatabaseStatus = "connected" | "disconnected";

export function getDatabaseStatus(): DatabaseStatus {
  return mongoose.connection.readyState === 1 ? "connected" : "disconnected";
}

export async function connectMongo(): Promise<void> {
  try {
    await mongoose.connect(env.mongodbUri);
    await reconcileFirebaseUidIndex();
    logger.info(
      { status: getDatabaseStatus() },
      "MongoDB connected successfully"
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const atlasBlocked =
      message.includes("MongoDB Atlas") ||
      message.includes("whitelist") ||
      message.includes("ReplicaSetNoPrimary");

    logger.error(
      {
        err: error,
        ...(atlasBlocked
          ? {
              hint:
                "MongoDB Atlas blocked this host. In Atlas → Network Access, allow Render (Add IP → Allow access from anywhere 0.0.0.0/0 for web services). Confirm MONGODB_URI on Render matches Atlas → Connect.",
            }
          : {}),
      },
      "MongoDB connection failed"
    );
    throw error;
  }
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
}
