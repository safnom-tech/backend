"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseStatus = getDatabaseStatus;
exports.connectMongo = connectMongo;
exports.disconnectMongo = disconnectMongo;
const mongoose_1 = __importDefault(require("mongoose"));
const env_js_1 = require("../config/env.js");
const users_model_js_1 = require("../modules/users/users.model.js");
const logger_js_1 = require("../utils/logger.js");
function getDatabaseStatus() {
    return mongoose_1.default.connection.readyState === 1 ? "connected" : "disconnected";
}
async function connectMongo() {
    try {
        await mongoose_1.default.connect(env_js_1.env.mongodbUri);
        await (0, users_model_js_1.reconcileFirebaseUidIndex)();
        logger_js_1.logger.info({ status: getDatabaseStatus() }, "MongoDB connected successfully");
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const atlasBlocked = message.includes("MongoDB Atlas") ||
            message.includes("whitelist") ||
            message.includes("ReplicaSetNoPrimary");
        logger_js_1.logger.error({
            err: error,
            ...(atlasBlocked
                ? {
                    hint: "MongoDB Atlas blocked this host. In Atlas → Network Access, allow Render (Add IP → Allow access from anywhere 0.0.0.0/0 for web services). Confirm MONGODB_URI on Render matches Atlas → Connect.",
                }
                : {}),
        }, "MongoDB connection failed");
        throw error;
    }
}
async function disconnectMongo() {
    await mongoose_1.default.disconnect();
    logger_js_1.logger.info("MongoDB disconnected");
}
