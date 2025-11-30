import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/token";
import { UserRole, UserProfile } from "@shared/types";
import { logger } from "../lib/logger";

export interface AuthenticatedRequest<TBody = unknown> extends Request<any, any, TBody, any> {
  user?: UserProfile;
  file?: Express.Multer.File;
}

export const requireAuth = (roles?: UserRole[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      logger.warn("Richiesta senza token", { path: req.originalUrl });
      return res.status(401).json({ message: "Token mancante" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const payload = verifyToken(token);
      const user: UserProfile = {
        id: payload.sub,
        email: payload.email,
        fullName: "",
        role: payload.role
      };

      if (roles && !roles.includes(user.role)) {
        logger.warn("Accesso non autorizzato", {
          userId: user.id,
          requiredRoles: roles,
          userRole: user.role,
          path: req.originalUrl
        });
        return res.status(403).json({ message: "Permessi insufficienti" });
      }

      req.user = user;
      next();
    } catch (error) {
      logger.error("Errore verifica token", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return res.status(401).json({ message: "Token non valido" });
    }
  };
