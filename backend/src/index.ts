import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import rilevamentiRoutes from "./routes/rilevamenti";
import adminRoutes from "./routes/admin";
import { bootstrapAdmin } from "./setup/bootstrapAdmin";
import { requestLogger } from "./middleware/requestLogger";
import { logger } from "./lib/logger";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173"],
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
