import { z } from "zod";

export const rilevamentoBaseSchema = z.object({
  comuneId: z.string().uuid(),
  via: z.string().min(1),
  numeroCivico: z.string().min(1),
  tipoLavorazioneId: z.string().uuid(),
  impresaId: z.string().uuid(),
  numeroOperai: z.number().int().nonnegative(),
  gpsLat: z.number().min(-90).max(90),
  gpsLon: z.number().min(-180).max(180),
  manualLat: z.number().min(-90).max(90).nullable().optional(),
  manualLon: z.number().min(-180).max(180).nullable().optional(),
  rilevamentoDate: z.string(),
  rilevamentoTime: z.string(),
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
