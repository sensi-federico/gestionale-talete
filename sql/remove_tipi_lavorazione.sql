-- Script per rimuovere "costruzione" e "demolizione" dalla tabella tipi_lavorazione
-- Eseguire questo script direttamente nella console SQL di Supabase

-- Prima verifichiamo quali record esistono
SELECT id, name FROM tipi_lavorazione WHERE name ILIKE '%costruzione%' OR name ILIKE '%demolizione%';

-- Verifichiamo se ci sono rilevamenti collegati
SELECT COUNT(*) as rilevamenti_collegati 
FROM rilevamenti r 
JOIN tipi_lavorazione t ON r.tipo_lavorazione_id = t.id 
WHERE t.name ILIKE '%costruzione%' OR t.name ILIKE '%demolizione%';

-- STEP 1: Elimina i rilevamenti collegati a costruzione/demolizione
DELETE FROM rilevamenti 
WHERE tipo_lavorazione_id IN (
  SELECT id FROM tipi_lavorazione 
  WHERE name ILIKE '%costruzione%' OR name ILIKE '%demolizione%'
);

-- STEP 2: Elimina i tipi di lavorazione
DELETE FROM tipi_lavorazione WHERE name ILIKE '%costruzione%' OR name ILIKE '%demolizione%';

-- Verifica risultato finale
SELECT id, name FROM tipi_lavorazione ORDER BY name;
