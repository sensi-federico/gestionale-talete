-- Migrazione per aggiungere nuovi campi alla tabella rilevamenti
-- Data: 30 novembre 2025

-- Nuovi campi per i dettagli del lavoro
ALTER TABLE rilevamenti
ADD COLUMN IF NOT EXISTS materiale_tubo TEXT,
ADD COLUMN IF NOT EXISTS diametro TEXT,
ADD COLUMN IF NOT EXISTS altri_interventi TEXT;

-- Campi nascosti per tracking (timestamp e GPS reali al momento dell'invio)
ALTER TABLE rilevamenti
ADD COLUMN IF NOT EXISTS submit_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS submit_gps_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS submit_gps_lon DOUBLE PRECISION;

-- Commenti descrittivi
COMMENT ON COLUMN rilevamenti.materiale_tubo IS 'Materiale del tubo (es: PVC, Ghisa, Acciaio, PE)';
COMMENT ON COLUMN rilevamenti.diametro IS 'Diametro del tubo in mm o pollici';
COMMENT ON COLUMN rilevamenti.altri_interventi IS 'Descrizione di altri interventi effettuati';
COMMENT ON COLUMN rilevamenti.submit_timestamp IS 'Timestamp reale al momento dell invio del form';
COMMENT ON COLUMN rilevamenti.submit_gps_lat IS 'Latitudine GPS reale al momento dell invio';
COMMENT ON COLUMN rilevamenti.submit_gps_lon IS 'Longitudine GPS reale al momento dell invio';
