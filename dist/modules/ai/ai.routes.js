"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRoutes = void 0;
const express_1 = require("express");
const ai_controller_js_1 = require("./ai.controller.js");
const router = (0, express_1.Router)();
exports.aiRoutes = router;
router.all("*", ai_controller_js_1.aiController.placeholder);
