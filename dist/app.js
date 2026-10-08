"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const pino_http_1 = __importDefault(require("pino-http"));
const env_js_1 = require("./config/env.js");
const error_middleware_js_1 = require("./middleware/error.middleware.js");
const notFound_middleware_js_1 = require("./middleware/notFound.middleware.js");
const index_js_1 = require("./routes/v1/index.js");
const logger_js_1 = require("./utils/logger.js");
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, pino_http_1.default)({
        logger: logger_js_1.logger,
        autoLogging: {
            ignore: (req) => req.url === `${env_js_1.env.apiPrefix}/health`,
        },
    }));
    app.use((0, cors_1.default)({
        origin: env_js_1.env.frontendUrl,
        credentials: true,
    }));
    app.use((0, cookie_parser_1.default)());
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use(env_js_1.env.apiPrefix, index_js_1.v1Router);
    app.use(notFound_middleware_js_1.notFoundMiddleware);
    app.use(error_middleware_js_1.errorMiddleware);
    return app;
}
