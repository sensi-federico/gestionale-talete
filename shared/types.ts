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

// ============================================================
// NUOVE INTERFACCE PER MEZZI, ATTREZZATURE, MATERIALI, OPERAI
// ============================================================

export interface Mezzo {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
}

export interface Attrezzatura {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
}

export interface MaterialeTubo {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

// Tipo operaio per il dettaglio ore lavorate
export type TipoOperaio = "specializzato" | "qualificato" | "comune";

// Entry per mezzi utilizzati con ore
export interface MezzoUtilizzo {
  id?: string; // Unique key for allowing duplicates
  mezzoId: string;
  mezzoNome?: string; // Per riepilogo frontend
  oreUtilizzo: number;
}

// Entry per attrezzature utilizzate con ore
export interface AttrezzaturaUtilizzo {
  id?: string; // Unique key for allowing duplicates
  attrezzaturaId: string;
  attrezzaturaNome?: string; // Per riepilogo frontend
  oreUtilizzo: number;
}

// Entry per operai con tipo, numero e ore
export interface OperaioEntry {
  tipoOperaio: TipoOperaio;
  numero: number;
  oreLavoro: number;
}

// Dati del tubo (esistente o nuovo)
export interface TuboData {
  materiale?: string;
  diametro?: string;
  pn?: string;
  profondita?: string;
}

// ============================================================
// RILEVAMENTO BASE E DERIVATI
// ============================================================

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
  notes?: string;
  // Vecchi campi tubo (deprecati, per compatibilità)
  materialeTuboId?: string;
  materialeTubo?: string;
  diametro?: string;
  // Nuovi campi tubo espansi
  tuboEsistente?: TuboData;
  tuboNuovo?: TuboData;
  // Altri dettagli lavoro
  altriInterventi?: string;
  // Nuovi campi relazionali
  mezziUtilizzo?: MezzoUtilizzo[];
  attrezzatureUtilizzo?: AttrezzaturaUtilizzo[];
  operai?: OperaioEntry[];
  // Campi nascosti per tracking
  startTimestamp?: string | null;
  startGpsLat?: number | null;
  startGpsLon?: number | null;
  submitTimestamp?: string | null;
  submitGpsLat?: number | null;
  submitGpsLon?: number | null;
  // Campi aggiuntivi per imprese (range orario)
  oraFine?: string;
}

export interface Rilevamento extends RilevamentoBase {
  id: string;
  operaioId: string;
  syncStatus: "synced" | "pending" | "failed";
  createdAt: string;
  updatedAt: string;
  // Relazioni espanse (opzionali, popolate dal backend)
  mezzi?: Array<Mezzo & { oreUtilizzo: number }>;
  attrezzature?: Array<Attrezzatura & { oreUtilizzo: number }>;
  operaiDettaglio?: OperaioEntry[];
  startTimestamp?: string | null;
  startGpsLat?: number | null;
  startGpsLon?: number | null;
  submitTimestamp?: string | null;
  submitGpsLat?: number | null;
  submitGpsLon?: number | null;
}

export interface OfflineRilevamento extends RilevamentoBase {
  localId: string;
  isSynced: boolean;
  localCreatedAt: string;
  fileBlob?: Blob; // @deprecated - use specific photo blobs below
  // 4 tipi di foto per supporto offline completo
  fotoPanoramicaBlob?: Blob;
  fotoInizioLavoriBlob?: Blob;
  fotoInterventoBlob?: Blob;
  fotoFineLavoriBlob?: Blob;
}

// ============================================================
// DATI DI RIFERIMENTO (per dropdown e selezioni)
// ============================================================

export interface ReferenceData {
  comuni: Comune[];
  imprese: Impresa[];
  tipiLavorazione: TipoLavorazione[];
  mezzi: Mezzo[];
  attrezzature: Attrezzatura[];
  materialiTubo: MaterialeTubo[];
}

// ============================================================
// WIZARD INTERVENTO - DATI PER OGNI STEP
// ============================================================

export interface WizardStepLuogo {
  comuneId: string;
  via: string;
  numeroCivico?: string;
  gpsLat: number;
  gpsLon: number;
  manualLat?: number;
  manualLon?: number;
}

export interface WizardStepLavoro {
  tipoLavorazioneId: string;
  impresaId?: string;
  materialeTuboId?: string;
  diametro?: string;
  altriInterventi?: string;
  // Solo per imprese
  dataInizio?: string;
  oraInizio?: string;
  dataFine?: string;
  oraFine?: string;
}

export interface WizardStepOperai {
  operai: OperaioEntry[];
}

export interface WizardStepMezziAttrezzature {
  mezziUtilizzo: MezzoUtilizzo[];
  attrezzatureUtilizzo: AttrezzaturaUtilizzo[];
}

export interface WizardStepDocumenta {
  rilevamentoDate: string;
  rilevamentoTime: string;
  foto?: File;
  fotoPreview?: string;
  notes?: string;
}

// Dati completi del wizard
export interface InterventoWizardData {
  luogo: WizardStepLuogo;
  lavoro: WizardStepLavoro;
  operai: WizardStepOperai;
  mezziAttrezzature: WizardStepMezziAttrezzature;
  documenta: WizardStepDocumenta;
}
