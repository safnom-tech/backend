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
    logger.error({ err: error }, "MongoDB connection failed");
    throw error;
  }
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
}
