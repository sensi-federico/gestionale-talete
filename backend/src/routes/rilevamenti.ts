import { Router } from "express";
import type { Response } from "express";
import { randomUUID } from "node:crypto";
import multer from "multer";
import { supabaseAdmin } from "../lib/supabaseClient.js";
import { createRilevamentoSchema } from "../schemas/rilevamenti.js";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";
import { OfflineRilevamento, RilevamentoBase } from "../shared/types.js";
import { logger } from "../lib/logger.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "rilevamenti";

const uploadPhoto = async (file: Express.Multer.File, userId: string) => {
  const extension = file.originalname.split(".").pop() ?? "jpg";
  const fileName = `${userId}/${Date.now()}-${randomUUID()}.${extension}`;

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    logger.error("Errore caricamento foto", { message: error.message });
    throw new Error(`Errore upload foto: ${error.message}`);
  }

  const {
    data: { publicUrl }
  } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);

  return publicUrl;
};

const insertRilevamento = async (
  payload: RilevamentoBase,
  operaioId: string,
  fotoUrl?: string
) => {
  const { error } = await supabaseAdmin.from("rilevamenti").insert({
    operaio_id: operaioId,
    comune_id: payload.comuneId,
    via: payload.via,
    numero_civico: payload.numeroCivico || "",
    tipo_lavorazione_id: payload.tipoLavorazioneId,
    impresa_id: payload.impresaId || null,
    numero_operai: payload.numeroOperai,
    foto_url: fotoUrl ?? payload.fotoUrl ?? null,
    gps_lat: payload.gpsLat,
    gps_lon: payload.gpsLon,
    manual_lat: payload.manualLat ?? null,
    manual_lon: payload.manualLon ?? null,
    rilevamento_date: payload.rilevamentoDate,
    rilevamento_time: payload.rilevamentoTime,
    notes: payload.notes ?? null,
    // Nuovi campi
    materiale_tubo: payload.materialeTubo ?? null,
    diametro: payload.diametro ?? null,
    altri_interventi: payload.altriInterventi ?? null,
    submit_timestamp: payload.submitTimestamp ?? new Date().toISOString(),
    submit_gps_lat: payload.submitGpsLat ?? null,
    submit_gps_lon: payload.submitGpsLon ?? null,
    sync_status: "synced"
  });

  if (error) {
    logger.error("Errore inserimento rilevamento", { message: error.message });
    throw new Error(error.message);
  }
};

router.get("/", requireAuth(), async (req: AuthenticatedRequest, res: Response) => {
  const isResponsabile = req.user?.role === "responsabile";

  const selectFull = `id, operaio_id, comune:comuni(name), impresa_id, impresa:imprese(name), tipo:tipi_lavorazione(name), via, numero_civico, numero_operai, foto_url, gps_lat, gps_lon, manual_lat, manual_lon, rilevamento_date, rilevamento_time, notes, materiale_tubo, diametro, altri_interventi, submit_timestamp, submit_gps_lat, submit_gps_lon, sync_status, created_at`;

  const selectLimited = `id, operaio_id, comune:comuni(name), impresa_id, impresa:imprese(name), tipo:tipi_lavorazione(name), via, numero_civico, numero_operai, foto_url, notes, materiale_tubo, diametro, altri_interventi, sync_status, created_at`;

  const query = supabaseAdmin
    .from("rilevamenti")
    .select(isResponsabile ? selectLimited : selectFull)
    .order("created_at", { ascending: false });

  // Filtra per ruolo: operaio vede solo i suoi, impresa vede solo quelli della sua impresa
  if (req.user?.role === "operaio") {
    query.eq("operaio_id", req.user.id);
  } else if (req.user?.role === "impresa" && req.user?.impresaId) {
    query.eq("impresa_id", req.user.impresaId);
  }

  const { data, error } = await query;

  if (error) {
    logger.error("Errore recupero rilevamenti", { message: error.message });
    return res.status(500).json({ message: error.message });
  }

  logger.info("Rilevamenti recuperati", {
    count: data?.length ?? 0,
    requesterId: req.user?.id,
    scopedToUser: req.user?.role === "operaio",
    scopedToImpresa: req.user?.role === "impresa"
  });
  return res.json({ rilevamenti: data });
});

type RilevamentoRequestBody = {
  comuneId: string;
  via: string;
  numeroCivico: string;
  tipoLavorazioneId: string;
  impresaId: string;
  numeroOperai: string;
  gpsLat: string;
  gpsLon: string;
  manualLat?: string;
  manualLon?: string;
  rilevamentoDate: string;
  rilevamentoTime: string;
  notes?: string;
  // Nuovi campi
  materialeTubo?: string;
  diametro?: string;
  altriInterventi?: string;
  submitTimestamp?: string;
  submitGpsLat?: string;
  submitGpsLon?: string;
};

router.post(
  "/",
  requireAuth(["operaio", "admin", "impresa"]),
  upload.single("foto"),
  async (req: AuthenticatedRequest<RilevamentoRequestBody>, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Utente non autenticato" });
    }

    const parseResult = createRilevamentoSchema.safeParse({
      ...req.body,
      impresaId: req.body.impresaId || undefined,
      numeroCivico: req.body.numeroCivico || "",
      numeroOperai: Number(req.body.numeroOperai),
      gpsLat: Number(req.body.gpsLat),
      gpsLon: Number(req.body.gpsLon),
      manualLat: req.body.manualLat ? Number(req.body.manualLat) : null,
      manualLon: req.body.manualLon ? Number(req.body.manualLon) : null,
      submitGpsLat: req.body.submitGpsLat ? Number(req.body.submitGpsLat) : undefined,
      submitGpsLon: req.body.submitGpsLon ? Number(req.body.submitGpsLon) : undefined
    });

    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ");
      logger.warn("Validazione fallita", { errors: errorMsg, body: req.body });
      return res.status(400).json({ message: `Validazione fallita: ${errorMsg}` });
    }

    let fotoUrl: string | undefined;

    if (req.file) {
      fotoUrl = await uploadPhoto(req.file, req.user.id);
    }

    try {
      await insertRilevamento(parseResult.data, req.user.id, fotoUrl);
      logger.info("Rilevamento creato", { userId: req.user.id, comuneId: parseResult.data.comuneId });
      return res.status(201).json({ message: "Rilevamento creato" });
    } catch (error) {
      logger.error("Errore creazione rilevamento", {
        message: error instanceof Error ? error.message : String(error),
        userId: req.user.id
      });
      return res.status(500).json({ message: "Errore creazione rilevamento" });
    }
  }
);

router.post(
  "/sync",
  requireAuth(),
  async (req: AuthenticatedRequest<{ records: OfflineRilevamento[] }>, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Utente non autenticato" });
    }

    const { records } = ((req as unknown as { body?: { records?: OfflineRilevamento[] } }).body ?? {});
    if (!records?.length) {
      return res.status(400).json({ message: "Nessun rilevamento da sincronizzare" });
    }

    try {
      for (const record of records) {
        const parseResult = createRilevamentoSchema.safeParse(record);
        if (!parseResult.success) {
          continue;
        }

        await insertRilevamento(parseResult.data, req.user.id, record.fotoUrl);
      }

      logger.info("Sync rilevamenti completata", {
        userId: req.user.id,
        imported: records.length
      });
      return res.json({ message: "Sync completata" });
    } catch (error) {
      logger.error("Errore sincronizzazione rilevamenti", {
        message: error instanceof Error ? error.message : String(error),
        userId: req.user.id
      });
      return res.status(500).json({ message: "Errore durante la sincronizzazione" });
    }
  }
);

// Elimina un rilevamento (solo admin)
router.delete("/:id", requireAuth(["admin"]), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  // Recupera il rilevamento per ottenere l'URL della foto
  const { data: rilevamento, error: fetchError } = await supabaseAdmin
    .from("rilevamenti")
    .select("foto_url")
    .eq("id", id)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    logger.error("Errore recupero rilevamento", { id, message: fetchError.message });
    return res.status(500).json({ message: "Errore durante l'eliminazione" });
  }

  // Elimina la foto dallo storage se presente
  if (rilevamento?.foto_url) {
    try {
      const url = new URL(rilevamento.foto_url);
      const pathParts = url.pathname.split("/");
      const bucketIndex = pathParts.findIndex((part) => part === bucket);
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        const filePath = pathParts.slice(bucketIndex + 1).join("/");
        const { error: storageError } = await supabaseAdmin.storage
          .from(bucket)
          .remove([filePath]);
        if (storageError) {
          logger.warn("Errore eliminazione foto storage", { 
            id, 
            filePath, 
            message: storageError.message 
          });
        }
      }
    } catch (err) {
      logger.warn("Errore parsing URL foto", { 
        id, 
        fotoUrl: rilevamento.foto_url, 
        message: err instanceof Error ? err.message : String(err) 
      });
    }
  }

  // Elimina il record dal database
  const { error } = await supabaseAdmin
    .from("rilevamenti")
    .delete()
    .eq("id", id);

  if (error) {
    logger.error("Errore eliminazione rilevamento", { id, message: error.message });
    return res.status(500).json({ message: "Errore durante l'eliminazione" });
  }

  logger.info("Rilevamento eliminato", { id, deletedBy: req.user?.id });
  return res.status(204).send();
});

export default router;
