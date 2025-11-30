import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import rilevamentiRoutes from "./routes/rilevamenti.js";
import adminRoutes from "./routes/admin.js";
import { bootstrapAdmin } from "./setup/bootstrapAdmin.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { logger } from "./lib/logger.js";

const app = express();

const defaultOrigins = ["http://localhost:5173"];
const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : [];
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

app.use(
  cors({
    origin(requestOrigin, callback) {
      if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin not allowed by CORS: ${requestOrigin}`));
    },
    credentials: true
  })
);

app.use(express.json());
app.use(requestLogger);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/rilevamenti", rilevamentiRoutes);
app.use("/api/admin", adminRoutes);

app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : String(err);
  logger.error("Unhandled error", {
    message,
    stack: err instanceof Error ? err.stack : undefined,
    requestId: res.locals.requestId,
    path: req.originalUrl
  });
  res.status(500).json({ message: "Errore interno" });
});

const port = Number(process.env.PORT) || 4000;

const startServer = async () => {
  await bootstrapAdmin();

  app.listen(port, () => {
    logger.info(`Backend server avviato su http://localhost:${port}`);
  });
};

startServer().catch((error) => {
  logger.error("Errore critico in fase di avvio", {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });
  process.exit(1);
});
