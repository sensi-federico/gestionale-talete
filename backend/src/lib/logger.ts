import util from "node:util";

const formatMeta = (meta?: Record<string, unknown>) => {
  if (!meta || Object.keys(meta).length === 0) {
    return "";
  }
  return ` ${util.inspect(meta, { colors: false, depth: 4, breakLength: 120 })}`;
};

const write = (level: "info" | "warn" | "error" | "debug", message: string, meta?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] ${message}${formatMeta(meta)}`;

  switch (level) {
    case "info":
      console.log(base);
      break;
    case "warn":
      console.warn(base);
      break;
    case "error":
      console.error(base);
      break;
    case "debug":
      console.debug(base);
      break;
    default:
      console.log(base);
  }
};

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => write("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write("error", message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => write("debug", message, meta)
};
