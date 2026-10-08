import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/notFound.middleware.js";
import { v1Router } from "./routes/v1/index.js";
import { logger } from "./utils/logger.js";

export function createApp(): express.Application {
  const app = express();

  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === `${env.apiPrefix}/health`,
      },
    })
  );

  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true,
    })
  );

  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(env.apiPrefix, v1Router);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
