export type UserRole = "operaio" | "admin" | "impresa" | "responsabile";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  impresaId?: string; // Solo per ruolo impresa
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

// Tipi per mezzi, attrezzature e operai
export interface MezzoUtilizzo {
  mezzoId: string;
  mezzoNome?: string;
  oreUtilizzo: number;
}

export interface AttrezzaturaUtilizzo {
  attrezzaturaId: string;
  attrezzaturaNome?: string;
  oreUtilizzo: number;
}

export interface OperaioEntry {
  tipoOperaio: 'specializzato' | 'qualificato' | 'comune';
  numero: number;
  oreLavoro: number;
}

export interface RilevamentoBase {
  comuneId: string;
  via: string;
  numeroCivico?: string;
  tipoLavorazioneId: string;
  impresaId?: string;
  numeroOperai: number;
  fotoUrl?: string;
  gpsLat: number;
  gpsLon: number;
  manualLat?: number | null;
  manualLon?: number | null;
  rilevamentoDate: string;
  rilevamentoTime: string;
  oraFine?: string;
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
  // Nuovi campi per mezzi, attrezzature e operai
  mezziUtilizzo?: MezzoUtilizzo[];
  attrezzatureUtilizzo?: AttrezzaturaUtilizzo[];
  operai?: OperaioEntry[];
}
