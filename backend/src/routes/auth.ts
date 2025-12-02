import { Router } from "express";
import type { Request, Response } from "express";
import { loginSchema, refreshSchema, createUserSchema, updateProfileSchema } from "../schemas/auth.js";
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
  const impresaId = metadata.impresa_id ?? null;
  const user: UserProfile = {
    id: data.user.id,
    email: data.user.email ?? email,
    fullName: metadata.full_name ?? metadata.fullName ?? "",
    role,
    impresaId: impresaId ?? undefined
  };

  const tokenPayload = { sub: user.id, email: user.email, role: user.role, impresaId };
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
      role: payload.role,
      impresaId: payload.impresaId ?? null
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
        role: payload.role,
        impresaId: payload.impresaId ?? undefined
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

// GET /auth/profile - Ottieni profilo utente corrente
router.get("/profile", requireAuth(["operaio", "admin"]), async (req: Request, res: Response) => {
  const userId = res.locals.user.sub;
  
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  
  if (error || !data.user) {
    logger.error("Errore recupero profilo", { userId });
    return res.status(404).json({ message: "Utente non trovato" });
  }
  
  const metadata = data.user.user_metadata ?? {};
  const profile: UserProfile = {
    id: data.user.id,
    email: data.user.email ?? "",
    fullName: metadata.full_name ?? "",
    role: metadata.role ?? "operaio"
  };
  
  return res.json({ profile });
});

// PUT /auth/profile - Aggiorna profilo utente corrente
router.put("/profile", requireAuth(["operaio", "admin"]), async (req: Request, res: Response) => {
  const userId = res.locals.user.sub;
  const parseResult = updateProfileSchema.safeParse(req.body);
  
  if (!parseResult.success) {
    logger.warn("Update profilo payload non valido", { path: req.originalUrl });
    return res.status(400).json({ message: "Dati non validi" });
  }
  
  const { fullName, currentPassword, newPassword } = parseResult.data;
  
  // Se sta cambiando password, verifica quella corrente
  if (newPassword && currentPassword) {
    // Verifica password corrente facendo login
    const { data: currentUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (!currentUser.user?.email) {
      return res.status(400).json({ message: "Impossibile verificare l'utente" });
    }
    
    const { error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: currentUser.user.email,
      password: currentPassword
    });
    
    if (loginError) {
      logger.warn("Password corrente errata durante update profilo", { userId });
      return res.status(400).json({ message: "Password corrente non corretta" });
    }
  }
  
  // Prepara update
  const updateData: { user_metadata?: { full_name: string }; password?: string } = {};
  
  if (fullName !== undefined) {
    // Recupera metadata esistenti per preservarli
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const existingMetadata = existingUser.user?.user_metadata ?? {};
    
    updateData.user_metadata = {
      ...existingMetadata,
      full_name: fullName
    };
  }
  
  if (newPassword) {
    updateData.password = newPassword;
  }
  
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData);
  
  if (error || !data.user) {
    logger.error("Errore aggiornamento profilo", {
      userId,
      message: error instanceof Error ? error.message : String(error)
    });
    return res.status(500).json({ message: "Impossibile aggiornare il profilo" });
  }
  
  const metadata = data.user.user_metadata ?? {};
  const updatedProfile: UserProfile = {
    id: data.user.id,
    email: data.user.email ?? "",
    fullName: metadata.full_name ?? "",
    role: metadata.role ?? "operaio"
  };
  
  logger.info("Profilo aggiornato", { userId });
  return res.json({ profile: updatedProfile });
});

export default router;
