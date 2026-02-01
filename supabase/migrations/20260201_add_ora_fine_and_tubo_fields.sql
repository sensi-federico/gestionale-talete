-- Migration: Add ora_fine column and expanded tubo fields
-- Date: 2026-02-01

-- Add ora_fine column (was missing, causing insert errors)
ALTER TABLE rilevamenti 
ADD COLUMN IF NOT EXISTS ora_fine TIME;

COMMENT ON COLUMN rilevamenti.ora_fine IS 'Ora fine intervento';

-- Add expanded tubo fields for "tubo esistente" (existing pipe)
ALTER TABLE rilevamenti 
ADD COLUMN IF NOT EXISTS tubo_esistente_materiale TEXT,
ADD COLUMN IF NOT EXISTS tubo_esistente_diametro TEXT,
ADD COLUMN IF NOT EXISTS tubo_esistente_pn TEXT,
ADD COLUMN IF NOT EXISTS tubo_esistente_profondita TEXT;

COMMENT ON COLUMN rilevamenti.tubo_esistente_materiale IS 'Materiale tubo esistente';
COMMENT ON COLUMN rilevamenti.tubo_esistente_diametro IS 'Diametro tubo esistente (mm)';
COMMENT ON COLUMN rilevamenti.tubo_esistente_pn IS 'Pressione nominale tubo esistente';
COMMENT ON COLUMN rilevamenti.tubo_esistente_profondita IS 'Profondità tubo esistente (cm)';

-- Add expanded tubo fields for "tubo nuovo" (new pipe)
ALTER TABLE rilevamenti 
ADD COLUMN IF NOT EXISTS tubo_nuovo_materiale TEXT,
ADD COLUMN IF NOT EXISTS tubo_nuovo_diametro TEXT,
ADD COLUMN IF NOT EXISTS tubo_nuovo_pn TEXT,
ADD COLUMN IF NOT EXISTS tubo_nuovo_profondita TEXT;

COMMENT ON COLUMN rilevamenti.tubo_nuovo_materiale IS 'Materiale tubo nuovo';
COMMENT ON COLUMN rilevamenti.tubo_nuovo_diametro IS 'Diametro tubo nuovo (mm)';
COMMENT ON COLUMN rilevamenti.tubo_nuovo_pn IS 'Pressione nominale tubo nuovo';
COMMENT ON COLUMN rilevamenti.tubo_nuovo_profondita IS 'Profondità tubo nuovo (cm)';

-- Migrate old materiale_tubo and diametro to tubo_esistente fields (if they exist)
UPDATE rilevamenti 
SET tubo_esistente_materiale = materiale_tubo,
    tubo_esistente_diametro = diametro
WHERE materiale_tubo IS NOT NULL OR diametro IS NOT NULL;
