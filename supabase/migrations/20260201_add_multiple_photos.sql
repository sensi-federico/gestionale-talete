-- Migration: Add multiple photo columns for different stages of work
-- Date: 2026-02-01

-- Add new photo columns (keep foto_url for backward compatibility)
ALTER TABLE rilevamenti 
ADD COLUMN IF NOT EXISTS foto_panoramica_url TEXT,
ADD COLUMN IF NOT EXISTS foto_inizio_lavori_url TEXT,
ADD COLUMN IF NOT EXISTS foto_intervento_url TEXT,
ADD COLUMN IF NOT EXISTS foto_fine_lavori_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN rilevamenti.foto_panoramica_url IS 'URL foto panoramica del luogo di lavoro';
COMMENT ON COLUMN rilevamenti.foto_inizio_lavori_url IS 'URL foto inizio lavori';
COMMENT ON COLUMN rilevamenti.foto_intervento_url IS 'URL foto durante intervento';
COMMENT ON COLUMN rilevamenti.foto_fine_lavori_url IS 'URL foto fine lavori';

-- Migrate existing foto_url to foto_intervento_url if not null
UPDATE rilevamenti 
SET foto_intervento_url = foto_url 
WHERE foto_url IS NOT NULL AND foto_intervento_url IS NULL;
