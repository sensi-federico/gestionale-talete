import { z } from "zod";

// Schema per i dati del tubo (esistente o nuovo)
const tuboSchema = z.object({
  materiale: z.string().optional(),
  diametro: z.string().optional(),
  pn: z.string().optional(),
  profondita: z.string().optional()
}).optional();

export const rilevamentoBaseSchema = z.object({
  comuneId: z.string().uuid("Comune non valido"),
  via: z.string().min(1, "Via è obbligatoria"),
  numeroCivico: z.string().optional().default(""),
  tipoLavorazioneId: z.string().uuid("Tipo lavorazione non valido"),
  impresaId: z.string().uuid("Impresa non valida").optional(),
  numeroOperai: z.number().int("Numero operai deve essere intero").nonnegative("Numero operai non può essere negativo"),
  gpsLat: z.number().min(-90, "Latitudine non valida").max(90, "Latitudine non valida"),
  gpsLon: z.number().min(-180, "Longitudine non valida").max(180, "Longitudine non valida"),
  manualLat: z.number().min(-90).max(90).nullable().optional(),
  manualLon: z.number().min(-180).max(180).nullable().optional(),
  rilevamentoDate: z.string().min(1, "Data rilevamento obbligatoria"),
  rilevamentoTime: z.string().min(1, "Ora rilevamento obbligatoria"),
  notes: z.string().optional(),
  // Vecchi campi (deprecati, mantenuti per compatibilità)
  materialeTubo: z.string().optional(),
  diametro: z.string().optional(),
  // Nuovi campi tubo esistente e nuovo
  tuboEsistente: tuboSchema,
  tuboNuovo: tuboSchema,
  // Altri campi
  altriInterventi: z.string().optional(),
  oraFine: z.string().optional(),
  // Campi nascosti per tracking
  startTimestamp: z.string().optional(),
  startGpsLat: z.number().min(-90).max(90).optional(),
  startGpsLon: z.number().min(-180).max(180).optional(),
  submitTimestamp: z.string().optional(),
  submitGpsLat: z.number().min(-90).max(90).optional(),
  submitGpsLon: z.number().min(-180).max(180).optional()
});

export const createRilevamentoSchema = rilevamentoBaseSchema;
