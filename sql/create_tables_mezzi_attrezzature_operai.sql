-- ============================================================
-- SCRIPT SQL PER SUPABASE - MEZZI, ATTREZZATURE, MATERIALI TUBO, OPERAI
-- Eseguire manualmente su Supabase SQL Editor
-- Data: Febbraio 2026
-- ============================================================

-- ============================================================
-- 1. TABELLA MEZZI DI LAVORO
-- ============================================================
CREATE TABLE IF NOT EXISTS mezzi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- emoji o codice icona
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice per query sui mezzi attivi
CREATE INDEX IF NOT EXISTS idx_mezzi_active ON mezzi(is_active) WHERE is_active = true;

-- ============================================================
-- 2. TABELLA ATTREZZATURE
-- ============================================================
CREATE TABLE IF NOT EXISTS attrezzature (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- emoji o codice icona
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice per query sulle attrezzature attive
CREATE INDEX IF NOT EXISTS idx_attrezzature_active ON attrezzature(is_active) WHERE is_active = true;

-- ============================================================
-- 3. TABELLA MATERIALI TUBO
-- ============================================================
CREATE TABLE IF NOT EXISTS materiali_tubo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice per query sui materiali attivi
CREATE INDEX IF NOT EXISTS idx_materiali_tubo_active ON materiali_tubo(is_active) WHERE is_active = true;

-- ============================================================
-- 4. TABELLA PONTE RILEVAMENTI-MEZZI (many-to-many con ore)
-- ============================================================
CREATE TABLE IF NOT EXISTS rilevamenti_mezzi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rilevamento_id UUID NOT NULL REFERENCES rilevamenti(id) ON DELETE CASCADE,
  mezzo_id UUID NOT NULL REFERENCES mezzi(id) ON DELETE CASCADE,
  ore_utilizzo DECIMAL(5,2) NOT NULL DEFAULT 0, -- ore con decimali (es. 2.5 ore)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rilevamento_id, mezzo_id)
);

-- Indici per join veloci
CREATE INDEX IF NOT EXISTS idx_rilevamenti_mezzi_rilevamento ON rilevamenti_mezzi(rilevamento_id);
CREATE INDEX IF NOT EXISTS idx_rilevamenti_mezzi_mezzo ON rilevamenti_mezzi(mezzo_id);

-- ============================================================
-- 5. TABELLA PONTE RILEVAMENTI-ATTREZZATURE (many-to-many con ore)
-- ============================================================
CREATE TABLE IF NOT EXISTS rilevamenti_attrezzature (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rilevamento_id UUID NOT NULL REFERENCES rilevamenti(id) ON DELETE CASCADE,
  attrezzatura_id UUID NOT NULL REFERENCES attrezzature(id) ON DELETE CASCADE,
  ore_utilizzo DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rilevamento_id, attrezzatura_id)
);

-- Indici per join veloci
CREATE INDEX IF NOT EXISTS idx_rilevamenti_attrezzature_rilevamento ON rilevamenti_attrezzature(rilevamento_id);
CREATE INDEX IF NOT EXISTS idx_rilevamenti_attrezzature_attrezzatura ON rilevamenti_attrezzature(attrezzatura_id);

-- ============================================================
-- 6. TABELLA RILEVAMENTI-OPERAI (dettaglio operai per tipo)
-- ============================================================
CREATE TABLE IF NOT EXISTS rilevamenti_operai (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rilevamento_id UUID NOT NULL REFERENCES rilevamenti(id) ON DELETE CASCADE,
  tipo_operaio TEXT NOT NULL CHECK (tipo_operaio IN ('specializzato', 'qualificato', 'comune')),
  numero INTEGER NOT NULL CHECK (numero > 0),
  ore_lavoro DECIMAL(5,2) NOT NULL CHECK (ore_lavoro > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rilevamento_id, tipo_operaio) -- Un solo record per tipo per rilevamento
);

-- Indice per join veloci
CREATE INDEX IF NOT EXISTS idx_rilevamenti_operai_rilevamento ON rilevamenti_operai(rilevamento_id);

-- ============================================================
-- 7. AGGIUNTA COLONNA materiale_tubo_id A RILEVAMENTI (opzionale)
-- ============================================================
-- Nota: mantenere anche materiale_tubo (text) per compatibilità con dati esistenti
ALTER TABLE rilevamenti 
ADD COLUMN IF NOT EXISTS materiale_tubo_id UUID REFERENCES materiali_tubo(id) ON DELETE SET NULL;

-- ============================================================
-- 8. RLS POLICIES - MEZZI
-- ============================================================
ALTER TABLE mezzi ENABLE ROW LEVEL SECURITY;

-- Tutti gli utenti autenticati possono leggere i mezzi attivi
CREATE POLICY "mezzi_select_authenticated" ON mezzi
  FOR SELECT TO authenticated
  USING (is_active = true OR auth.jwt() ->> 'role' = 'admin');

-- Solo admin può inserire/modificare/eliminare
CREATE POLICY "mezzi_insert_admin" ON mezzi
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "mezzi_update_admin" ON mezzi
  FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "mezzi_delete_admin" ON mezzi
  FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================
-- 9. RLS POLICIES - ATTREZZATURE
-- ============================================================
ALTER TABLE attrezzature ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attrezzature_select_authenticated" ON attrezzature
  FOR SELECT TO authenticated
  USING (is_active = true OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "attrezzature_insert_admin" ON attrezzature
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "attrezzature_update_admin" ON attrezzature
  FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "attrezzature_delete_admin" ON attrezzature
  FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================
-- 10. RLS POLICIES - MATERIALI TUBO
-- ============================================================
ALTER TABLE materiali_tubo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "materiali_tubo_select_authenticated" ON materiali_tubo
  FOR SELECT TO authenticated
  USING (is_active = true OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "materiali_tubo_insert_admin" ON materiali_tubo
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "materiali_tubo_update_admin" ON materiali_tubo
  FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "materiali_tubo_delete_admin" ON materiali_tubo
  FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================
-- 11. RLS POLICIES - TABELLE PONTE
-- ============================================================
ALTER TABLE rilevamenti_mezzi ENABLE ROW LEVEL SECURITY;
ALTER TABLE rilevamenti_attrezzature ENABLE ROW LEVEL SECURITY;
ALTER TABLE rilevamenti_operai ENABLE ROW LEVEL SECURITY;

-- Select: stesse regole dei rilevamenti
CREATE POLICY "rilevamenti_mezzi_select" ON rilevamenti_mezzi
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "rilevamenti_attrezzature_select" ON rilevamenti_attrezzature
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "rilevamenti_operai_select" ON rilevamenti_operai
  FOR SELECT TO authenticated USING (true);

-- Insert/Update/Delete: chi può modificare rilevamenti
CREATE POLICY "rilevamenti_mezzi_insert" ON rilevamenti_mezzi
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "rilevamenti_attrezzature_insert" ON rilevamenti_attrezzature
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "rilevamenti_operai_insert" ON rilevamenti_operai
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "rilevamenti_mezzi_delete" ON rilevamenti_mezzi
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "rilevamenti_attrezzature_delete" ON rilevamenti_attrezzature
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "rilevamenti_operai_delete" ON rilevamenti_operai
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 12. SEED DATA - MEZZI (da hardcoded esistente)
-- ============================================================
INSERT INTO mezzi (name, icon, description) VALUES
  ('Motocarro', '🚛', 'Veicolo leggero per trasporto materiali'),
  ('Fiorino', '🚐', 'Furgone compatto'),
  ('Daily', '🚐', 'Furgone medio Iveco Daily'),
  ('Camion', '🚚', 'Autocarro pesante'),
  ('Mini escavatore', '🚧', 'Escavatore compatto'),
  ('Escavatore', '🚧', 'Escavatore standard'),
  ('Terna', '🚜', 'Escavatore terna')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 13. SEED DATA - ATTREZZATURE (esempi comuni)
-- ============================================================
INSERT INTO attrezzature (name, icon, description) VALUES
  ('Tagliaerba', '🌿', 'Tagliaerba professionale'),
  ('Motosega', '🪚', 'Motosega per taglio legno'),
  ('Betoniera', '🔄', 'Betoniera per calcestruzzo'),
  ('Compressore', '💨', 'Compressore aria'),
  ('Martello demolitore', '🔨', 'Martello pneumatico/elettrico'),
  ('Saldatrice', '⚡', 'Saldatrice elettrica'),
  ('Trapano', '🔩', 'Trapano elettrico'),
  ('Smerigliatrice', '✨', 'Smerigliatrice angolare'),
  ('Generatore', '🔌', 'Generatore di corrente'),
  ('Pompa', '💧', 'Pompa acqua/fanghi')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 14. SEED DATA - MATERIALI TUBO (da hardcoded esistente)
-- ============================================================
INSERT INTO materiali_tubo (name, description) VALUES
  ('PVC', 'Cloruro di polivinile'),
  ('PE', 'Polietilene'),
  ('PEAD', 'Polietilene ad alta densità'),
  ('Ghisa', 'Tubazione in ghisa'),
  ('Acciaio', 'Tubazione in acciaio'),
  ('Rame', 'Tubazione in rame'),
  ('Cemento Amianto', 'Tubazione cemento amianto (legacy)'),
  ('Altro', 'Altro materiale')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 15. FUNZIONE TRIGGER PER updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per mezzi
DROP TRIGGER IF EXISTS update_mezzi_updated_at ON mezzi;
CREATE TRIGGER update_mezzi_updated_at
  BEFORE UPDATE ON mezzi
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger per attrezzature
DROP TRIGGER IF EXISTS update_attrezzature_updated_at ON attrezzature;
CREATE TRIGGER update_attrezzature_updated_at
  BEFORE UPDATE ON attrezzature
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger per materiali_tubo
DROP TRIGGER IF EXISTS update_materiali_tubo_updated_at ON materiali_tubo;
CREATE TRIGGER update_materiali_tubo_updated_at
  BEFORE UPDATE ON materiali_tubo
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FINE SCRIPT
-- ============================================================
