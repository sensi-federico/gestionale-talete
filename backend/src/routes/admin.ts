import { Router } from "express";
import type { Request, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabaseClient.js";
import { z } from "zod";
import { logger } from "../lib/logger.js";

const router = Router();

const comuneSchema = z.object({
  name: z.string().min(2),
  province: z.string().min(2),
  region: z.string().min(2)
});

const impresaSchema = z.object({
  name: z.string().min(2),
  partitaIva: z.string().min(11).max(11),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional()
});

const updateUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  role: z.enum(["operaio", "admin"]),
  password: z.string().min(6).optional()
});

router.get(
  "/reference",
  requireAuth(["operaio", "admin"]),
  async (_req: Request, res: Response) => {
    const [comuni, imprese, tipi] = await Promise.all([
      supabaseAdmin.from("comuni").select("id, name, province, region").order("name"),
      supabaseAdmin.from("imprese").select("id, name, partita_iva, phone, email, address").order("name"),
      supabaseAdmin.from("tipi_lavorazione").select("id, name, description").order("name")
    ]);

    if (comuni.error || imprese.error || tipi.error) {
      logger.error("Errore nel recupero reference dati", {
        comuniError: comuni.error?.message,
        impreseError: imprese.error?.message,
        tipiError: tipi.error?.message
      });
      return res.status(500).json({ message: "Errore nel recupero dei dati" });
    }

    return res.json({
      comuni: comuni.data,
      imprese: imprese.data,
      tipiLavorazione: tipi.data
    });
  }
);

router.get("/users", requireAuth(["admin"]), async (req: AuthenticatedRequest, res: Response) => {
  // Legge da public.users (sincronizzata con auth.users via trigger)
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, email, full_name, role, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Errore recupero utenti", { message: error.message });
    return res.status(500).json({ message: "Impossibile recuperare gli utenti" });
  }

  const users = (data ?? []).map((user) => ({
    id: user.id,
    email: user.email ?? "",
    fullName: user.full_name ?? "",
    role: (user.role ?? "operaio") as "operaio" | "admin",
    createdAt: user.created_at ?? null,
    updatedAt: user.updated_at ?? null
  }));

  logger.info("Lista utenti recuperata", { count: users.length, requesterId: req.user?.id });
  return res.json({ users });
});

router.put("/users/:id", requireAuth(["admin"]), async (req: AuthenticatedRequest, res: Response) => {
  const parseResult = updateUserSchema.safeParse(req.body);
  if (!parseResult.success) {
    logger.warn("Aggiornamento utente payload non valido", { userId: req.params.id });
    return res.status(400).json({ message: "Dati non validi" });
  }

  const payload = parseResult.data;
  const updateBody: Parameters<typeof supabaseAdmin.auth.admin.updateUserById>[1] = {
    email: payload.email,
    user_metadata: {
      full_name: payload.fullName,
      role: payload.role
    }
  };

  if (payload.password) {
    updateBody.password = payload.password;
  }

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, updateBody);

  if (error || !data.user) {
    logger.error("Errore aggiornamento utente", {
      userId: req.params.id,
      message: error?.message
    });
    return res.status(500).json({ message: "Impossibile aggiornare l'utente" });
  }

  // Aggiorna anche public.users per coerenza
  await supabaseAdmin
    .from("users")
    .update({
      email: payload.email,
      full_name: payload.fullName,
      role: payload.role,
      updated_at: new Date().toISOString()
    })
    .eq("id", req.params.id);

  const updatedUser = {
    id: data.user.id,
    email: payload.email,
    fullName: payload.fullName,
    role: payload.role as "operaio" | "admin",
    createdAt: data.user.created_at ?? null,
    updatedAt: new Date().toISOString()
  };

  logger.info("Utente aggiornato", { userId: updatedUser.id, requesterId: req.user?.id });
  return res.json({ user: updatedUser });
});

router.delete("/users/:id", requireAuth(["admin"]), async (req: AuthenticatedRequest, res: Response) => {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);

  if (error) {
    logger.error("Errore eliminazione utente", { userId: req.params.id, message: error.message });
    return res.status(500).json({ message: "Impossibile eliminare l'utente" });
  }

  logger.info("Utente eliminato", { userId: req.params.id, requesterId: req.user?.id });
  return res.status(204).send();
});

router.get("/comuni", requireAuth(["admin"]), async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin.from("comuni").select("*").order("name");
  if (error) {
    logger.error("Errore recupero comuni", { message: error.message });
    return res.status(500).json({ message: error.message });
  }
  return res.json({ comuni: data });
});

router.post("/comuni", requireAuth(["admin"]), async (req: AuthenticatedRequest, res: Response) => {
  const result = comuneSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Dati non validi" });
  }

  const { data, error } = await supabaseAdmin
    .from("comuni")
    .insert({
      name: result.data.name,
      province: result.data.province,
      region: result.data.region
    })
    .select()
    .single();

  if (error) {
    logger.error("Errore creazione comune", { message: error.message });
    return res.status(500).json({ message: error.message });
  }

  logger.info("Comune creato", { comuneId: data?.id, requesterId: req.user?.id });
  return res.status(201).json({ comune: data });
});

router.put("/comuni/:id", requireAuth(["admin"]), async (req: AuthenticatedRequest, res: Response) => {
  const result = comuneSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Dati non validi" });
  }

  const { data, error } = await supabaseAdmin
    .from("comuni")
    .update({
      name: result.data.name,
      province: result.data.province,
      region: result.data.region
    })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) {
    logger.error("Errore aggiornamento comune", { comuneId: req.params.id, message: error.message });
    return res.status(500).json({ message: error.message });
  }

  logger.info("Comune aggiornato", { comuneId: req.params.id, requesterId: req.user?.id });
  return res.json({ comune: data });
});

router.delete("/comuni/:id", requireAuth(["admin"]), async (req: AuthenticatedRequest, res: Response) => {
  const { error } = await supabaseAdmin.from("comuni").delete().eq("id", req.params.id);
  if (error) {
    logger.error("Errore eliminazione comune", { comuneId: req.params.id, message: error.message });
    return res.status(500).json({ message: error.message });
  }
  logger.info("Comune eliminato", { comuneId: req.params.id, requesterId: req.user?.id });
  return res.status(204).send();
});

router.get("/imprese", requireAuth(["admin"]), async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin.from("imprese").select("*").order("name");
  if (error) {
    logger.error("Errore recupero imprese", { message: error.message });
    return res.status(500).json({ message: error.message });
  }
  return res.json({ imprese: data });
});

router.post("/imprese", requireAuth(["admin"]), async (req: AuthenticatedRequest, res: Response) => {
  const result = impresaSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Dati non validi" });
  }

  const { data, error } = await supabaseAdmin
    .from("imprese")
    .insert({
      name: result.data.name,
      partita_iva: result.data.partitaIva,
      phone: result.data.phone ?? null,
      email: result.data.email ?? null,
      address: result.data.address ?? null
    })
    .select()
    .single();

  if (error) {
    logger.error("Errore creazione impresa", { message: error.message });
    return res.status(500).json({ message: error.message });
  }

  logger.info("Impresa creata", { impresaId: data?.id, requesterId: req.user?.id });
  return res.status(201).json({ impresa: data });
});

router.put("/imprese/:id", requireAuth(["admin"]), async (req: AuthenticatedRequest, res: Response) => {
  const result = impresaSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Dati non validi" });
  }

  const { data, error } = await supabaseAdmin
    .from("imprese")
    .update({
      name: result.data.name,
      partita_iva: result.data.partitaIva,
      phone: result.data.phone ?? null,
      email: result.data.email ?? null,
      address: result.data.address ?? null
    })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) {
    logger.error("Errore aggiornamento impresa", { impresaId: req.params.id, message: error.message });
    return res.status(500).json({ message: error.message });
  }

  logger.info("Impresa aggiornata", { impresaId: req.params.id, requesterId: req.user?.id });
  return res.json({ impresa: data });
});

router.delete("/imprese/:id", requireAuth(["admin"]), async (req: AuthenticatedRequest, res: Response) => {
  const { error } = await supabaseAdmin.from("imprese").delete().eq("id", req.params.id);
  if (error) {
    logger.error("Errore eliminazione impresa", { impresaId: req.params.id, message: error.message });
    return res.status(500).json({ message: error.message });
  }
  logger.info("Impresa eliminata", { impresaId: req.params.id, requesterId: req.user?.id });
  return res.status(204).send();
});

router.get("/rilevamenti", requireAuth(["admin"]), async (req: AuthenticatedRequest, res: Response) => {
  // Supporta filtro per operaio_id via query string: ?operaioId=uuid
  const operaioId = req.query.operaioId as string | undefined;

  let query = supabaseAdmin
    .from("rilevamenti")
    .select(
      `id, operaio_id, via, numero_civico, numero_operai, foto_url, gps_lat, gps_lon, manual_lat, manual_lon, rilevamento_date, rilevamento_time, notes, sync_status, created_at, updated_at,
      comune:comuni(name),
      impresa:imprese(name),
      tipo:tipi_lavorazione(name),
      operaio:users(id, email, full_name)`
    )
    .order("created_at", { ascending: false });

  if (operaioId) {
    query = query.eq("operaio_id", operaioId);
  }

  const { data, error } = await query;

  if (error) {
    logger.error("Errore recupero rilevamenti", { message: error.message });
    return res.status(500).json({ message: error.message });
  }

  logger.info("Lista rilevamenti recuperata", { count: data?.length ?? 0, filteredByOperaio: !!operaioId });
  return res.json({ rilevamenti: data });
});

export default router;
