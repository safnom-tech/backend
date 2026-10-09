"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const mongodb_js_1 = require("../../database/mongodb.js");
const apiResponse_js_1 = require("../../utils/apiResponse.js");
const healthRouter = (0, express_1.Router)();
exports.healthRouter = healthRouter;
healthRouter.get("/", (_req, res) => {
    (0, apiResponse_js_1.sendSuccess)(res, "Safnom API is healthy", {
        status: "ok",
        database: (0, mongodb_js_1.getDatabaseStatus)(),
    });
});
