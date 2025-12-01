import { supabaseAdmin } from "../lib/supabaseClient.js";
import { logger } from "../lib/logger.js";

// Nuovi tipi lavorazione richiesti
const TIPI_LAVORAZIONE = [
  { name: "Riparazione", description: "Riparazione di tubazioni o impianti esistenti" },
  { name: "Sostituzione", description: "Sostituzione di tubazioni o componenti" },
  { name: "Allaccio", description: "Nuovo allaccio alla rete idrica" },
  { name: "Predisposizione allaccio", description: "Predisposizione per futuro allaccio" },
  { name: "Altro", description: "Altre tipologie di intervento" }
];

export const seedTipiLavorazione = async () => {
  try {
    // Prima verifica se ci sono già i nuovi tipi
    const { data: existing } = await supabaseAdmin
      .from("tipi_lavorazione")
      .select("name");
    
    const existingNames = new Set(existing?.map(t => t.name) || []);
    
    // Aggiungi solo i tipi che non esistono già
    const toInsert = TIPI_LAVORAZIONE.filter(t => !existingNames.has(t.name));
    
    if (toInsert.length === 0) {
      logger.info("Tutti i tipi lavorazione sono già presenti");
      return;
    }

    const { error } = await supabaseAdmin
      .from("tipi_lavorazione")
      .insert(toInsert);

    if (error) {
      throw error;
    }

    logger.info(`Aggiunti ${toInsert.length} tipi lavorazione`, { 
      tipi: toInsert.map(t => t.name) 
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Errore nel seeding tipi lavorazione", { message });
  }
};
