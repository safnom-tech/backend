"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishingRoutes = void 0;
const express_1 = require("express");
const publishing_controller_js_1 = require("./publishing.controller.js");
const router = (0, express_1.Router)();
exports.publishingRoutes = router;
router.all("*", publishing_controller_js_1.publishingController.placeholder);
