import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectMongo, disconnectMongo } from "./database/mongodb.js";
import { connectTemplateCache, disconnectTemplateCache } from "./cache/template-cache.js";
import { logger } from "./utils/logger.js";

async function startServer(): Promise<void> {
  logger.info(
    { nodeEnv: env.nodeEnv, templateSource: env.templateSource },
    "Starting Safnom API"
  );

  await connectMongo();
  await connectTemplateCache();

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(
      { port: env.port, apiPrefix: env.apiPrefix },
      "HTTP server listening"
    );
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      logger.error(
        {
          port: env.port,
          hint:
            "On macOS, port 5000 is often used by AirPlay. Set PORT=8080 in backend/.env",
        },
        "Port already in use"
      );
      process.exit(1);
    }
    throw error;
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down gracefully");
    server.close(async () => {
      try {
        await disconnectTemplateCache();
        await disconnectMongo();
        process.exit(0);
      } catch (error) {
        logger.error({ err: error }, "Error during shutdown");
        process.exit(1);
      }
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

startServer().catch((error) => {
  logger.error({ err: error }, "Failed to start server");
  process.exit(1);
});
