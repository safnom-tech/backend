"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.domainsRoutes = void 0;
const express_1 = require("express");
const domains_controller_js_1 = require("./domains.controller.js");
const router = (0, express_1.Router)();
exports.domainsRoutes = router;
router.all("*", domains_controller_js_1.domainsController.placeholder);
