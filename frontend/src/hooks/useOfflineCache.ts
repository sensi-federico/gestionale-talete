import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { api } from "../services/api";

// Tipi per i dati di riferimento (nomi dal backend)
export interface Comune {
  id: string;
  name: string;
  nome: string;
  province: string;
  region: string;
}

export interface Impresa {
  id: string;
  name: string;
  ragione_sociale: string;
}

export interface TipoLavorazione {
  id: string;
  name: string;
  nome: string;
  descrizione?: string;
}

export interface Mezzo {
  id: string;
  nome: string;
  icona?: string;
  attivo: boolean;
}

export interface Attrezzatura {
  id: string;
  nome: string;
  icona?: string;
  attivo: boolean;
}

export interface MaterialeTubo {
  id: string;
  nome: string;
  attivo: boolean;
}

export interface ReferenceData {
  comuni: Comune[];
  imprese: Impresa[];
  tipiLavorazione: TipoLavorazione[];
  mezzi?: Mezzo[];
  attrezzature?: Attrezzatura[];
  materialiTubo?: MaterialeTubo[];
}

const CACHE_KEY = "talete_reference_data";
const CACHE_TIMESTAMP_KEY = "talete_reference_data_timestamp";
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 ore

// Funzioni di gestione cache
const saveToCache = (data: ReferenceData) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.warn("Impossibile salvare cache locale:", error);
  }
};

const loadFromCache = (): ReferenceData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (!cached || !timestamp) return null;
    
    // Verifica se la cache è ancora valida (max 24h)
    const age = Date.now() - parseInt(timestamp, 10);
    if (age > CACHE_MAX_AGE) {
      // Cache scaduta ma la restituiamo comunque se offline
      console.log("Cache scaduta, verrà aggiornata al prossimo collegamento");
    }
    
    return JSON.parse(cached) as ReferenceData;
  } catch (error) {
    console.warn("Errore lettura cache locale:", error);
    return null;
  }
};

const isCacheValid = (): boolean => {
  const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  if (!timestamp) return false;
  
  const age = Date.now() - parseInt(timestamp, 10);
  return age <= CACHE_MAX_AGE;
};

/**
 * Hook per caricare i dati di riferimento (comuni, imprese, tipi lavorazione)
 * con supporto offline tramite cache locale in localStorage.
 */
export const useReferenceData = () => {
  const { tokens } = useAuthStore();
  const queryClient = useQueryClient();

  return useQuery<ReferenceData>({
    queryKey: ["reference-data"],
    queryFn: async () => {
      // Se offline, usa la cache locale
      if (!navigator.onLine) {
        const cached = loadFromCache();
        if (cached) {
          console.log("Modalità offline: usando dati in cache");
          return cached;
        }
        throw new Error("Nessun dato disponibile offline");
      }

      // Se online, carica dal server
      if (!tokens) throw new Error("Token mancante");
      
      const data = await api.fetchReferenceData(tokens.accessToken);
      
      // Salva in cache per uso offline
      saveToCache(data);
      
      return data;
    },
    enabled: Boolean(tokens) || !navigator.onLine,
    staleTime: 5 * 60 * 1000, // 5 minuti
    gcTime: 30 * 60 * 1000, // 30 minuti (ex cacheTime)
    // Usa i dati in cache come placeholder iniziale
    placeholderData: () => {
      const cached = loadFromCache();
      return cached ?? undefined;
    },
    // Retry solo se online
    retry: (failureCount, error) => {
      if (!navigator.onLine) return false;
      return failureCount < 3;
    }
  });
};

/**
 * Hook per forzare il refresh dei dati di riferimento
 * Utile quando si torna online
 */
export const useRefreshReferenceData = () => {
  const queryClient = useQueryClient();
  
  return () => {
    if (navigator.onLine) {
      queryClient.invalidateQueries({ queryKey: ["reference-data"] });
    }
  };
};

/**
 * Verifica se ci sono dati in cache disponibili
 */
export const hasOfflineCache = (): boolean => {
  return loadFromCache() !== null;
};

/**
 * Restituisce l'età della cache in millisecondi
 */
export const getCacheAge = (): number | null => {
  const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  if (!timestamp) return null;
  return Date.now() - parseInt(timestamp, 10);
};
