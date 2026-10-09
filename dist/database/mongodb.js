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
const logger_js_1 = require("../utils/logger.js");
function getDatabaseStatus() {
    return mongoose_1.default.connection.readyState === 1 ? "connected" : "disconnected";
}
async function connectMongo() {
    try {
        await mongoose_1.default.connect(env_js_1.env.mongodbUri);
        logger_js_1.logger.info({ status: getDatabaseStatus() }, "MongoDB connected successfully");
    }
    catch (error) {
        logger_js_1.logger.error({ err: error }, "MongoDB connection failed");
        throw error;
    }
}
async function disconnectMongo() {
    await mongoose_1.default.disconnect();
    logger_js_1.logger.info("MongoDB disconnected");
}
