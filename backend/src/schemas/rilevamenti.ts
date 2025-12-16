import { z } from "zod";

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
  // Nuovi campi dettagli lavoro
  materialeTubo: z.string().optional(),
  diametro: z.string().optional(),
  altriInterventi: z.string().optional(),
  // Campi nascosti per tracking
  submitTimestamp: z.string().optional(),
  submitGpsLat: z.number().min(-90).max(90).optional(),
  submitGpsLon: z.number().min(-180).max(180).optional()
});

export const createRilevamentoSchema = rilevamentoBaseSchema;
