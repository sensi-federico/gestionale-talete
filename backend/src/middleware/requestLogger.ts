import { NextFunction, Response } from "express";
import { randomUUID } from "node:crypto";
import { logger } from "../lib/logger.js";
import { AuthenticatedRequest } from "./auth.js";

export const requestLogger = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const requestId = randomUUID();
  const start = process.hrtime.bigint();

  res.locals.requestId = requestId;

  logger.info(`Incoming ${req.method} ${req.originalUrl}`, {
    requestId,
    ip: req.ip,
    userAgent: req.get("user-agent") || undefined
  });

  res.on("finish", () => {
    const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000;
    logger.info(`Completed ${req.method} ${req.originalUrl}`, {
      requestId,
      statusCode: res.statusCode,
      durationMs: Number(elapsed.toFixed(2)),
      userId: req.user?.id
    });
  });

  res.on("close", () => {
    if (!res.writableEnded) {
      const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000;
      logger.warn(`Connection closed before completion for ${req.method} ${req.originalUrl}`, {
        requestId,
        durationMs: Number(elapsed.toFixed(2)),
        userId: req.user?.id
      });
    }
  });

  next();
};
