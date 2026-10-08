"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = require("./app.js");
const env_js_1 = require("./config/env.js");
const mongodb_js_1 = require("./database/mongodb.js");
const logger_js_1 = require("./utils/logger.js");
async function startServer() {
    logger_js_1.logger.info({ nodeEnv: env_js_1.env.nodeEnv }, "Starting Safnom API");
    await (0, mongodb_js_1.connectMongo)();
    const app = (0, app_js_1.createApp)();
    const server = app.listen(env_js_1.env.port, () => {
        logger_js_1.logger.info({ port: env_js_1.env.port, apiPrefix: env_js_1.env.apiPrefix }, "HTTP server listening");
    });
    server.on("error", (error) => {
        if (error.code === "EADDRINUSE") {
            logger_js_1.logger.error({
                port: env_js_1.env.port,
                hint: "On macOS, port 5000 is often used by AirPlay. Set PORT=8080 in backend/.env",
            }, "Port already in use");
            process.exit(1);
        }
        throw error;
    });
    const shutdown = async (signal) => {
        logger_js_1.logger.info({ signal }, "Shutting down gracefully");
        server.close(async () => {
            try {
                await (0, mongodb_js_1.disconnectMongo)();
                process.exit(0);
            }
            catch (error) {
                logger_js_1.logger.error({ err: error }, "Error during shutdown");
                process.exit(1);
            }
        });
    };
    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
}
startServer().catch((error) => {
    logger_js_1.logger.error({ err: error }, "Failed to start server");
    process.exit(1);
});
