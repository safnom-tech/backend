import { Router } from "express";
import { domainsController } from "./domains.controller.js";

const router = Router();

router.all("*", domainsController.placeholder);

export { router as domainsRoutes };
