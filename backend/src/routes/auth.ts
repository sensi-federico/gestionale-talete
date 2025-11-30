import { Router } from "express";
import type { Request, Response } from "express";
import { loginSchema, refreshSchema, createUserSchema } from "../schemas/auth.js";
import { supabaseAdmin, supabaseClient } from "../lib/supabaseClient.js";
import { signAccessToken, signRefreshToken, verifyToken } from "../lib/token.js";
import { requireAuth } from "../middleware/auth.js";
import { UserProfile } from "../shared/types.js";
import { logger } from "../lib/logger.js";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    logger.warn("Login payload non valido", { path: req.originalUrl });
    return res.status(400).json({ message: "Dati non validi" });
  }

  const { email, password } = parseResult.data;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.user) {
    logger.warn("Login fallito", { email });
    return res.status(401).json({ message: "Credenziali non valide" });
  }

  const metadata = data.user.user_metadata ?? {};
  const role = (metadata.role as UserProfile["role"]) ?? "operaio";
  const user: UserProfile = {
    id: data.user.id,
    email: data.user.email ?? email,
    fullName: metadata.full_name ?? metadata.fullName ?? "",
    role
  };

  const tokenPayload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  logger.info("Login eseguito", { userId: user.id, role: user.role });
  return res.json({ accessToken, refreshToken, user });
});

router.post("/refresh", async (req: Request, res: Response) => {
  const parseResult = refreshSchema.safeParse(req.body);
  if (!parseResult.success) {
    logger.warn("Refresh token mancante o non valido", { path: req.originalUrl });
    return res.status(400).json({ message: "Token non valido" });
  }

  try {
    const payload = verifyToken(parseResult.data.refreshToken);
    const tokenPayload = {
      sub: payload.sub,
      email: payload.email,
      role: payload.role
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const response = {
      accessToken,
      refreshToken,
      user: {
        id: payload.sub,
        email: payload.email,
        fullName: "",
        role: payload.role
      }
    };

    logger.info("Refresh token rigenerato", { userId: payload.sub });
    return res.json(response);
  } catch (error) {
    logger.error("Refresh token non valido", {
      message: error instanceof Error ? error.message : String(error)
    });
    return res.status(401).json({ message: "Refresh token non valido" });
  }
});

router.post("/users", requireAuth(["admin"]), async (req: Request, res: Response) => {
  const parseResult = createUserSchema.safeParse(req.body);
  if (!parseResult.success) {
    logger.warn("Creazione utente payload non valido", { path: req.originalUrl });
    return res.status(400).json({ message: "Dati non validi" });
  }

  const { email, password, fullName, role } = parseResult.data;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: {
      full_name: fullName,
      role
    },
    email_confirm: true
  });

  if (error || !data.user) {
    logger.error("Errore creazione utente", {
      message: error instanceof Error ? error.message : String(error)
    });
    return res.status(500).json({ message: "Impossibile creare l'utente" });
  }

  const createdUser: UserProfile = {
    id: data.user.id,
    email: data.user.email ?? email,
    fullName,
    role
  };

  logger.info("Utente creato", { userId: createdUser.id, role: createdUser.role });
  return res.status(201).json({ user: createdUser });
});

export default router;
