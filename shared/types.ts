export type UserRole = "operaio" | "admin";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface Comune {
  id: string;
  name: string;
  province: string;
  region: string;
}

export interface Impresa {
  id: string;
  name: string;
  partitaIva: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface TipoLavorazione {
  id: string;
  name: string;
  description?: string;
}

export interface RilevamentoBase {
  comuneId: string;
  via: string;
  numeroCivico: string;
  tipoLavorazioneId: string;
  impresaId: string;
  numeroOperai: number;
  fotoUrl?: string;
  gpsLat: number;
  gpsLon: number;
  manualLat?: number | null;
  manualLon?: number | null;
  rilevamentoDate: string;
  rilevamentoTime: string;
  notes?: string;
  // Nuovi campi dettagli lavoro
  materialeTubo?: string;
  diametro?: string;
  altriInterventi?: string;
  // Campi nascosti per tracking
  submitTimestamp?: string;
  submitGpsLat?: number;
  submitGpsLon?: number;
}

export interface Rilevamento extends RilevamentoBase {
  id: string;
  operaioId: string;
  syncStatus: "synced" | "pending" | "failed";
  createdAt: string;
  updatedAt: string;
}

export interface OfflineRilevamento extends RilevamentoBase {
  localId: string;
  isSynced: boolean;
  localCreatedAt: string;
  fileBlob?: Blob;
}
