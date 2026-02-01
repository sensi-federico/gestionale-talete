-- ============================================================
-- MIGRATION: FIX SECURITY ISSUES SEGNALATI DA SUPABASE
-- Data: 1 Febbraio 2026
-- ============================================================
-- Questo script risolve i seguenti problemi di sicurezza:
-- 1. View con SECURITY DEFINER → SECURITY INVOKER
-- 2. Funzioni senza search_path → SET search_path = ''
-- 3. RLS policy con auth.* non ottimizzate → (select auth.*())
-- 4. Indice duplicato su users → rimuovere duplicato
-- 5. Policy DELETE troppo permissive → restringere
-- ============================================================

-- ============================================================
-- 1. FIX VIEW: v_rilevamenti_for_responsabile
-- Cambiare da SECURITY DEFINER a SECURITY INVOKER
-- ============================================================
-- Prima droppiamo la view se esiste e la ricreiamo con SECURITY INVOKER
DROP VIEW IF EXISTS public.v_rilevamenti_for_responsabile;

-- Ricrea la view con SECURITY INVOKER (la view usa i permessi di chi la interroga)
CREATE OR REPLACE VIEW public.v_rilevamenti_for_responsabile
WITH (security_invoker = true)
AS
SELECT 
  r.id,
  r.operaio_id,
  r.impresa_id,
  r.tipo_lavorazione_id,
  r.comune_id,
  r.rilevamento_date,
  r.rilevamento_time,
  r.ora_fine,
  r.via,
  r.numero_civico,
  r.notes,
  r.foto_url,
  r.foto_panoramica_url,
  r.foto_inizio_lavori_url,
  r.foto_intervento_url,
  r.foto_fine_lavori_url,
  r.gps_lat,
  r.gps_lon,
  r.manual_lat,
  r.manual_lon,
  r.created_at,
  r.updated_at,
  r.sync_status,
  r.materiale_tubo,
  r.diametro,
  r.materiale_tubo_id,
  r.tubo_esistente_materiale,
  r.tubo_esistente_diametro,
  r.tubo_esistente_pn,
  r.tubo_esistente_profondita,
  r.tubo_nuovo_materiale,
  r.tubo_nuovo_diametro,
  r.tubo_nuovo_pn,
  r.tubo_nuovo_profondita,
  r.numero_operai,
  r.altri_interventi,
  -- Campi sensibili OMESSI per il responsabile:
  -- r.submit_timestamp,
  -- r.submit_gps_lat,
  -- r.submit_gps_lon,
  u.full_name as operaio_name,
  u.email as operaio_email,
  i.name as impresa_name,
  c.name as comune_name,
  t.name as tipo_lavorazione_name
FROM rilevamenti r
LEFT JOIN users u ON r.operaio_id = u.id
LEFT JOIN imprese i ON r.impresa_id = i.id
LEFT JOIN comuni c ON r.comune_id = c.id
LEFT JOIN tipi_lavorazione t ON r.tipo_lavorazione_id = t.id;

-- Commento sulla view
COMMENT ON VIEW public.v_rilevamenti_for_responsabile IS 
  'View rilevamenti per ruolo responsabile - esclude campi sensibili (submit_timestamp, submit_gps)';


-- ============================================================
-- 2. FIX FUNZIONE: get_rilevamenti_sanitized_for_responsabile
-- Aggiungere SET search_path = ''
-- ============================================================
DROP FUNCTION IF EXISTS public.get_rilevamenti_sanitized_for_responsabile();

CREATE OR REPLACE FUNCTION public.get_rilevamenti_sanitized_for_responsabile()
RETURNS SETOF public.v_rilevamenti_for_responsabile
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT * FROM public.v_rilevamenti_for_responsabile;
$$;

COMMENT ON FUNCTION public.get_rilevamenti_sanitized_for_responsabile() IS 
  'Funzione per recuperare rilevamenti sanitizzati per il responsabile';


-- ============================================================
-- 3. FIX FUNZIONE: handle_new_user
-- Aggiungere SET search_path = ''
-- ============================================================
-- Questa funzione gestisce la creazione di un nuovo utente in auth.users
-- e sincronizza i dati nella tabella public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, is_active, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'operaio'),
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 
  'Trigger function per sincronizzare auth.users con public.users';


-- ============================================================
-- 4. FIX FUNZIONE: update_updated_at_column
-- Aggiungere SET search_path = ''
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column() IS 
  'Trigger function per aggiornare automaticamente il campo updated_at';


-- ============================================================
-- 5. FIX RLS POLICIES: Usare (select auth.*()) invece di auth.*()
-- Questo migliora le performance evitando la ri-valutazione per ogni riga
-- ============================================================

-- ---------- MEZZI ----------
DROP POLICY IF EXISTS "mezzi_select_authenticated" ON public.mezzi;
CREATE POLICY "mezzi_select_authenticated" ON public.mezzi
  FOR SELECT TO authenticated
  USING (is_active = true OR (select auth.jwt() ->> 'role') = 'admin');

DROP POLICY IF EXISTS "mezzi_insert_admin" ON public.mezzi;
CREATE POLICY "mezzi_insert_admin" ON public.mezzi
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.jwt() ->> 'role') = 'admin');

DROP POLICY IF EXISTS "mezzi_update_admin" ON public.mezzi;
CREATE POLICY "mezzi_update_admin" ON public.mezzi
  FOR UPDATE TO authenticated
  USING ((select auth.jwt() ->> 'role') = 'admin');

DROP POLICY IF EXISTS "mezzi_delete_admin" ON public.mezzi;
CREATE POLICY "mezzi_delete_admin" ON public.mezzi
  FOR DELETE TO authenticated
  USING ((select auth.jwt() ->> 'role') = 'admin');

-- ---------- ATTREZZATURE ----------
DROP POLICY IF EXISTS "attrezzature_select_authenticated" ON public.attrezzature;
CREATE POLICY "attrezzature_select_authenticated" ON public.attrezzature
  FOR SELECT TO authenticated
  USING (is_active = true OR (select auth.jwt() ->> 'role') = 'admin');

DROP POLICY IF EXISTS "attrezzature_insert_admin" ON public.attrezzature;
CREATE POLICY "attrezzature_insert_admin" ON public.attrezzature
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.jwt() ->> 'role') = 'admin');

DROP POLICY IF EXISTS "attrezzature_update_admin" ON public.attrezzature;
CREATE POLICY "attrezzature_update_admin" ON public.attrezzature
  FOR UPDATE TO authenticated
  USING ((select auth.jwt() ->> 'role') = 'admin');

DROP POLICY IF EXISTS "attrezzature_delete_admin" ON public.attrezzature;
CREATE POLICY "attrezzature_delete_admin" ON public.attrezzature
  FOR DELETE TO authenticated
  USING ((select auth.jwt() ->> 'role') = 'admin');

-- ---------- MATERIALI TUBO ----------
DROP POLICY IF EXISTS "materiali_tubo_select_authenticated" ON public.materiali_tubo;
CREATE POLICY "materiali_tubo_select_authenticated" ON public.materiali_tubo
  FOR SELECT TO authenticated
  USING (is_active = true OR (select auth.jwt() ->> 'role') = 'admin');

DROP POLICY IF EXISTS "materiali_tubo_insert_admin" ON public.materiali_tubo;
CREATE POLICY "materiali_tubo_insert_admin" ON public.materiali_tubo
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.jwt() ->> 'role') = 'admin');

DROP POLICY IF EXISTS "materiali_tubo_update_admin" ON public.materiali_tubo;
CREATE POLICY "materiali_tubo_update_admin" ON public.materiali_tubo
  FOR UPDATE TO authenticated
  USING ((select auth.jwt() ->> 'role') = 'admin');

DROP POLICY IF EXISTS "materiali_tubo_delete_admin" ON public.materiali_tubo;
CREATE POLICY "materiali_tubo_delete_admin" ON public.materiali_tubo
  FOR DELETE TO authenticated
  USING ((select auth.jwt() ->> 'role') = 'admin');

-- ---------- RILEVAMENTI ----------
-- Fix policy INSERT se esiste
DROP POLICY IF EXISTS "Users can insert own rilevamenti" ON public.rilevamenti;
CREATE POLICY "Users can insert own rilevamenti" ON public.rilevamenti
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = operaio_id);


-- ============================================================
-- 6. FIX INDICE DUPLICATO: users_email_idx vs users_email_key
-- Manteniamo users_email_key (constraint UNIQUE) e rimuoviamo l'indice ridondante
-- ============================================================
DROP INDEX IF EXISTS public.users_email_idx;


-- ============================================================
-- 7. FIX POLICY DELETE TROPPO PERMISSIVE
-- rilevamenti_attrezzature e rilevamenti_operai
-- Permettere DELETE solo se l'utente è proprietario del rilevamento correlato o è admin
-- ============================================================

-- ---------- RILEVAMENTI_ATTREZZATURE ----------
DROP POLICY IF EXISTS "rilevamenti_attrezzature_delete" ON public.rilevamenti_attrezzature;
CREATE POLICY "rilevamenti_attrezzature_delete" ON public.rilevamenti_attrezzature
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rilevamenti r 
      WHERE r.id = rilevamento_id 
      AND (r.operaio_id = (select auth.uid()) OR (select auth.jwt() ->> 'role') = 'admin')
    )
  );

-- ---------- RILEVAMENTI_OPERAI ----------
DROP POLICY IF EXISTS "rilevamenti_operai_delete" ON public.rilevamenti_operai;
CREATE POLICY "rilevamenti_operai_delete" ON public.rilevamenti_operai
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rilevamenti r 
      WHERE r.id = rilevamento_id 
      AND (r.operaio_id = (select auth.uid()) OR (select auth.jwt() ->> 'role') = 'admin')
    )
  );

-- ---------- RILEVAMENTI_MEZZI (applicare stessa logica per consistenza) ----------
DROP POLICY IF EXISTS "rilevamenti_mezzi_delete" ON public.rilevamenti_mezzi;
CREATE POLICY "rilevamenti_mezzi_delete" ON public.rilevamenti_mezzi
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rilevamenti r 
      WHERE r.id = rilevamento_id 
      AND (r.operaio_id = (select auth.uid()) OR (select auth.jwt() ->> 'role') = 'admin')
    )
  );


-- ============================================================
-- NOTA: Errore #5 (Leaked password protection)
-- Questo va abilitato dalla Dashboard Supabase:
-- Authentication → Settings → Security → Enable "Leaked password protection"
-- Non può essere configurato via SQL migration
-- ============================================================


-- ============================================================
-- FINE MIGRATION
-- ============================================================
