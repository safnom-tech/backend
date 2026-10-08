import type { Request, Response, NextFunction } from "express";
import { notImplementedHandler } from "../../utils/scaffold.js";

export const domainsController = {
  placeholder: (req: Request, res: Response, next: NextFunction): void => {
    notImplementedHandler(req, res, next);
  },
};
