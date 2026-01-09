import { Router } from "express";
import type { Request, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";
import { supabaseAdmin } from "../lib/supabaseClient.js";
import { z, ZodError } from "zod";
import { logger } from "../lib/logger.js";

const router = Router();

// Helper per formattare errori di validazione
const formatValidationError = (error: ZodError): string => {
  return error.errors.map(e => e.message).join(", ");
};

const comuneSchema = z.object({
  name: z.string().min(2, "Nome deve avere almeno 2 caratteri"),
  province: z.string().min(2, "Provincia deve avere almeno 2 caratteri"),
  region: z.string().min(2, "Regione deve avere almeno 2 caratteri")
});

const impresaSchema = z.object({
  name: z.string().min(2, "Nome impresa deve avere almeno 2 caratteri"),
  partitaIva: z.string().length(11, "Partita IVA deve essere di 11 caratteri").optional().or(z.literal("")),
  phone: z.string().optional().transform((val) => val === "" ? undefined : val),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  address: z.string().optional().transform((val) => val === "" ? undefined : val)
});

const updateUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  role: z.enum(["operaio", "admin", "impresa", "responsabile"]),
  password: z.string().min(6).optional(),
  impresaId: z.string().nullable().optional().transform((val) => (val && val.trim() !== "" ? val : null))
}).refine(
  (data) => {
    if (data.role === "impresa" && !data.impresaId) {
      return false;
    }
    return true;
  },
  { message: "impresaId richiesto per utenti con ruolo impresa" }
);

router.get(
  "/reference",
  requireAuth(["operaio", "admin", "impresa", "responsabile"]),
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
    .select("id, email, full_name, role, impresa_id, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Errore recupero utenti", { message: error.message });
    return res.status(500).json({ message: "Impossibile recuperare gli utenti" });
  }

  // Recupera last_sign_in_at da auth.users
  const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
  const authUsersMap = new Map(
    authData?.users?.map((u) => [u.id, u.last_sign_in_at]) ?? []
  );

  const users = (data ?? []).map((user) => ({
    id: user.id,
    email: user.email ?? "",
    fullName: user.full_name ?? "",
    role: (user.role ?? "operaio") as "operaio" | "admin" | "impresa",
    impresaId: user.impresa_id ?? null,
    createdAt: user.created_at ?? null,
    lastSignInAt: authUsersMap.get(user.id) ?? null
  }));

  logger.info("Lista utenti recuperata", { count: users.length, requesterId: req.user?.id });
  return res.json({ users });
});

router.put("/users/:id", requireAuth(["admin"]), async (req: AuthenticatedRequest, res: Response) => {
  const parseResult = updateUserSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg = formatValidationError(parseResult.error);
    logger.warn("Aggiornamento utente payload non valido", { userId: req.params.id, error: errorMsg });
    return res.status(400).json({ message: errorMsg });
  }

  const payload = parseResult.data;
  const updateBody: Parameters<typeof supabaseAdmin.auth.admin.updateUserById>[1] = {
    email: payload.email,
    user_metadata: {
      full_name: payload.fullName,
      role: payload.role,
      impresa_id: payload.impresaId ?? null
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
      impresa_id: payload.impresaId ?? null,
      updated_at: new Date().toISOString()
    })
    .eq("id", req.params.id);

  const updatedUser = {
    id: data.user.id,
    email: payload.email,
    fullName: payload.fullName,
    role: payload.role as "operaio" | "admin" | "impresa" | "responsabile",

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
    const errorMsg = formatValidationError(result.error);
    logger.warn("Creazione comune - validazione fallita", { error: errorMsg });
    return res.status(400).json({ message: errorMsg });
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
    const errorMsg = formatValidationError(result.error);
    logger.warn("Aggiornamento comune - validazione fallita", { comuneId: req.params.id, error: errorMsg });
    return res.status(400).json({ message: errorMsg });
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
    const errorMsg = formatValidationError(result.error);
    logger.warn("Creazione impresa - validazione fallita", { error: errorMsg, body: req.body });
    return res.status(400).json({ message: errorMsg });
  }

  const { data, error } = await supabaseAdmin
    .from("imprese")
    .insert({
      name: result.data.name,
      partita_iva: result.data.partitaIva || null,
      phone: result.data.phone ?? null,
      email: result.data.email === "" ? null : result.data.email ?? null,
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
    const errorMsg = formatValidationError(result.error);
    logger.warn("Aggiornamento impresa - validazione fallita", { impresaId: req.params.id, error: errorMsg });
    return res.status(400).json({ message: errorMsg });
  }

  const { data, error } = await supabaseAdmin
    .from("imprese")
    .update({
      name: result.data.name,
      partita_iva: result.data.partitaIva || null,
      phone: result.data.phone ?? null,
      email: result.data.email === "" ? null : result.data.email ?? null,
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

router.get("/rilevamenti", requireAuth(["admin", "responsabile"]), async (req: AuthenticatedRequest, res: Response) => {
  // Supporta filtri via query string
  const operaioId = req.query.operaioId as string | undefined;
  const comuneId = req.query.comuneId as string | undefined;
  const tipoLavorazioneId = req.query.tipoLavorazioneId as string | undefined;
  const dateFrom = req.query.dateFrom as string | undefined;
  const dateTo = req.query.dateTo as string | undefined;

  const isResponsabile = req.user?.role === "responsabile";

  const selectFieldsFull = `id, operaio_id, via, numero_civico, numero_operai, foto_url, gps_lat, gps_lon, manual_lat, manual_lon, rilevamento_date, rilevamento_time, notes, materiale_tubo, diametro, altri_interventi, submit_timestamp, submit_gps_lat, submit_gps_lon, sync_status, created_at, updated_at,
      comune:comuni(id, name, province),
      impresa:imprese(id, name),
      tipo:tipi_lavorazione(id, name),
      operaio:users(id, email, full_name)`;

  const selectFieldsLimited = `id, operaio_id, via, numero_civico, numero_operai, foto_url, notes, materiale_tubo, diametro, altri_interventi, sync_status, created_at, updated_at,
      comune:comuni(id, name, province),
      impresa:imprese(id, name),
      tipo:tipi_lavorazione(id, name),
      operaio:users(id, email, full_name)`;

  let query = supabaseAdmin
    .from("rilevamenti")
    .select(isResponsabile ? selectFieldsLimited : selectFieldsFull)
    .order("created_at", { ascending: false });

  if (operaioId) {
    query = query.eq("operaio_id", operaioId);
  }
  if (comuneId) {
    query = query.eq("comune_id", comuneId);
  }
  if (tipoLavorazioneId) {
    query = query.eq("tipo_lavorazione_id", tipoLavorazioneId);
  }
  if (dateFrom) {
    query = query.gte("rilevamento_date", dateFrom);
  }
  if (dateTo) {
    query = query.lte("rilevamento_date", dateTo);
  }

  const { data, error } = await query;

  if (error) {
    logger.error("Errore recupero rilevamenti", { message: error.message });
    return res.status(500).json({ message: error.message });
  }

  logger.info("Lista rilevamenti recuperata", { 
    count: data?.length ?? 0, 
    filteredByOperaio: !!operaioId,
    filteredByComune: !!comuneId,
    filteredByTipo: !!tipoLavorazioneId
  });
  return res.json({ rilevamenti: data });
});

// Export CSV rilevamenti
router.get("/rilevamenti/export", requireAuth(["admin", "responsabile"]), async (req: AuthenticatedRequest, res: Response) => {
  const operaioId = req.query.operaioId as string | undefined;
  const comuneId = req.query.comuneId as string | undefined;
  const tipoLavorazioneId = req.query.tipoLavorazioneId as string | undefined;
  const dateFrom = req.query.dateFrom as string | undefined;
  const dateTo = req.query.dateTo as string | undefined;

  const isResponsabile = req.user?.role === "responsabile";

  const selectFull = `id, via, numero_civico, numero_operai, foto_url, gps_lat, gps_lon, manual_lat, manual_lon, rilevamento_date, rilevamento_time, notes, materiale_tubo, diametro, altri_interventi, submit_timestamp, submit_gps_lat, submit_gps_lon, created_at,
      comune:comuni(name, province),
      impresa:imprese(name),
      tipo:tipi_lavorazione(name),
      operaio:users(email, full_name)`;

  const selectLimited = `id, via, numero_civico, numero_operai, foto_url, notes, materiale_tubo, diametro, altri_interventi, created_at,
      comune:comuni(name, province),
      impresa:imprese(name),
      tipo:tipi_lavorazione(name),
      operaio:users(email, full_name)`;

  let query = supabaseAdmin
    .from("rilevamenti")
    .select(isResponsabile ? selectLimited : selectFull)
    .order("rilevamento_date", { ascending: false });

  if (operaioId) query = query.eq("operaio_id", operaioId);
  if (comuneId) query = query.eq("comune_id", comuneId);
  if (tipoLavorazioneId) query = query.eq("tipo_lavorazione_id", tipoLavorazioneId);
  if (dateFrom) query = query.gte("rilevamento_date", dateFrom);
  if (dateTo) query = query.lte("rilevamento_date", dateTo);

  const { data, error } = await query;

  if (error) {
    logger.error("Errore export rilevamenti", { message: error.message });
    return res.status(500).json({ message: error.message });
  }

  // Genera CSV (limitata se responsabile)
  const headersFull = [
    "Data Rilevamento",
    "Ora Rilevamento", 
    "Comune",
    "Provincia",
    "Via",
    "Numero Civico",
    "Tipo Lavorazione",
    "Impresa",
    "Numero Operai",
    "Materiale Tubo",
    "Diametro",
    "Altri Interventi",
    "Note",
    "Operaio",
    "Email Operaio",
    "GPS Lat",
    "GPS Lon",
    "Posizione Manuale Lat",
    "Posizione Manuale Lon",
    "Timestamp Invio",
    "GPS Invio Lat",
    "GPS Invio Lon",
    "Foto URL",
    "Data Creazione"
  ];

  const headersLimited = [
    "Comune",
    "Provincia",
    "Via",
    "Numero Civico",
    "Tipo Lavorazione",
    "Impresa",
    "Numero Operai",
    "Materiale Tubo",
    "Diametro",
    "Altri Interventi",
    "Note",
    "Operaio",
    "Email Operaio",
    "Foto URL",
    "Data Creazione"
  ];

  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = (data ?? []).map((r) => {
    if (isResponsabile) {
      return [
        (r.comune as { name?: string })?.name ?? "",
        (r.comune as { province?: string })?.province ?? "",
        r.via,
        r.numero_civico,
        (r.tipo as { name?: string })?.name ?? "",
        (r.impresa as { name?: string })?.name ?? "",
        r.numero_operai,
        r.materiale_tubo,
        r.diametro,
        r.altri_interventi,
        r.notes,
        (r.operaio as { full_name?: string })?.full_name ?? "",
        (r.operaio as { email?: string })?.email ?? "",
        r.foto_url,
        r.created_at
      ].map(escapeCSV).join(",");
    }

    return [
      r.rilevamento_date,
      r.rilevamento_time,
      (r.comune as { name?: string })?.name ?? "",
      (r.comune as { province?: string })?.province ?? "",
      r.via,
      r.numero_civico,
      (r.tipo as { name?: string })?.name ?? "",
      (r.impresa as { name?: string })?.name ?? "",
      r.numero_operai,
      r.materiale_tubo,
      r.diametro,
      r.altri_interventi,
      r.notes,
      (r.operaio as { full_name?: string })?.full_name ?? "",
      (r.operaio as { email?: string })?.email ?? "",
      r.gps_lat,
      r.gps_lon,
      r.manual_lat,
      r.manual_lon,
      r.submit_timestamp,
      r.submit_gps_lat,
      r.submit_gps_lon,
      r.foto_url,
      r.created_at
    ].map(escapeCSV).join(",");
  });

  const csv = [(isResponsabile ? headersLimited : headersFull).join(","), ...rows].join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="rilevamenti_${new Date().toISOString().split("T")[0]}.csv"`);
  
  logger.info("Export CSV generato", { rows: data?.length ?? 0 });
  return res.send(csv);
});

export default router;
