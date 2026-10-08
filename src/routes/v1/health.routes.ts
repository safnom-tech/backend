import { Router } from "express";
import { getDatabaseStatus } from "../../database/mongodb.js";
import { sendSuccess } from "../../utils/apiResponse.js";

const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  sendSuccess(res, "Safnom API is healthy", {
    status: "ok",
    database: getDatabaseStatus(),
  });
});

export { healthRouter };
