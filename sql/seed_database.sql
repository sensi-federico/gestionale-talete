-- ============================================
-- SCRIPT PER PULIRE E RIPOPOLARE IL DATABASE
-- Gestionale Talete - Dati di Test Realistici
-- Comuni della Provincia di Viterbo
-- ============================================
-- ATTENZIONE: Questo script eliminerà TUTTI i dati esistenti!
-- Eseguire nella console SQL di Supabase

-- ============================================
-- STEP 1: PULIZIA COMPLETA
-- ============================================

-- Elimina tutti i rilevamenti
DELETE FROM rilevamenti;

-- Elimina tutti gli utenti pubblici (NON auth.users)
-- Gli utenti auth devono essere eliminati dal pannello Authentication
DELETE FROM users;

-- Pulisce e ripopola i comuni
DELETE FROM comuni;

-- Pulisce e ripopola le imprese
DELETE FROM imprese;

-- Pulisce e ripopola i tipi di lavorazione
DELETE FROM tipi_lavorazione;

-- ============================================
-- STEP 2: INSERIMENTO TIPI LAVORAZIONE
-- ============================================

INSERT INTO tipi_lavorazione (id, name) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Riparazione perdita'),
  ('a2222222-2222-2222-2222-222222222222', 'Sostituzione tubazione'),
  ('a3333333-3333-3333-3333-333333333333', 'Allaccio nuova utenza'),
  ('a4444444-4444-4444-4444-444444444444', 'Manutenzione programmata'),
  ('a5555555-5555-5555-5555-555555555555', 'Intervento emergenza'),
  ('a6666666-6666-6666-6666-666666666666', 'Posa nuova condotta'),
  ('a7777777-7777-7777-7777-777777777777', 'Verifica contatore'),
  ('a8888888-8888-8888-8888-888888888888', 'Bonifica rete');

-- ============================================
-- STEP 3: INSERIMENTO COMUNI (Provincia di Viterbo - TUTTI 60)
-- ============================================

INSERT INTO comuni (id, name, province) VALUES
  -- A
  ('c0000001-0001-0001-0001-000000000001', 'Acquapendente', 'VT'),
  ('c0000002-0002-0002-0002-000000000002', 'Arlena di Castro', 'VT'),
  -- B
  ('c0000003-0003-0003-0003-000000000003', 'Bagnoregio', 'VT'),
  ('c0000004-0004-0004-0004-000000000004', 'Barbarano Romano', 'VT'),
  ('c0000005-0005-0005-0005-000000000005', 'Bassano Romano', 'VT'),
  ('c0000006-0006-0006-0006-000000000006', 'Bassano in Teverina', 'VT'),
  ('c0000007-0007-0007-0007-000000000007', 'Blera', 'VT'),
  ('c0000008-0008-0008-0008-000000000008', 'Bolsena', 'VT'),
  ('c0000009-0009-0009-0009-000000000009', 'Bomarzo', 'VT'),
  -- C
  ('c0000010-0010-0010-0010-000000000010', 'Calcata', 'VT'),
  ('c0000011-0011-0011-0011-000000000011', 'Canepina', 'VT'),
  ('c0000012-0012-0012-0012-000000000012', 'Canino', 'VT'),
  ('c0000013-0013-0013-0013-000000000013', 'Capodimonte', 'VT'),
  ('c0000014-0014-0014-0014-000000000014', 'Capranica', 'VT'),
  ('c0000015-0015-0015-0015-000000000015', 'Caprarola', 'VT'),
  ('c0000016-0016-0016-0016-000000000016', 'Carbognano', 'VT'),
  ('c0000017-0017-0017-0017-000000000017', 'Castel Sant''Elia', 'VT'),
  ('c0000018-0018-0018-0018-000000000018', 'Castiglione in Teverina', 'VT'),
  ('c0000019-0019-0019-0019-000000000019', 'Celleno', 'VT'),
  ('c0000020-0020-0020-0020-000000000020', 'Cellere', 'VT'),
  ('c0000021-0021-0021-0021-000000000021', 'Civita Castellana', 'VT'),
  ('c0000022-0022-0022-0022-000000000022', 'Civitella d''Agliano', 'VT'),
  ('c0000023-0023-0023-0023-000000000023', 'Corchiano', 'VT'),
  -- F
  ('c0000024-0024-0024-0024-000000000024', 'Fabrica di Roma', 'VT'),
  ('c0000025-0025-0025-0025-000000000025', 'Faleria', 'VT'),
  ('c0000026-0026-0026-0026-000000000026', 'Farnese', 'VT'),
  -- G
  ('c0000027-0027-0027-0027-000000000027', 'Gallese', 'VT'),
  ('c0000028-0028-0028-0028-000000000028', 'Gradoli', 'VT'),
  ('c0000029-0029-0029-0029-000000000029', 'Graffignano', 'VT'),
  ('c0000030-0030-0030-0030-000000000030', 'Grotte di Castro', 'VT'),
  -- I
  ('c0000031-0031-0031-0031-000000000031', 'Ischia di Castro', 'VT'),
  -- L
  ('c0000032-0032-0032-0032-000000000032', 'Latera', 'VT'),
  ('c0000033-0033-0033-0033-000000000033', 'Lubriano', 'VT'),
  -- M
  ('c0000034-0034-0034-0034-000000000034', 'Marta', 'VT'),
  ('c0000035-0035-0035-0035-000000000035', 'Montalto di Castro', 'VT'),
  ('c0000036-0036-0036-0036-000000000036', 'Montefiascone', 'VT'),
  ('c0000037-0037-0037-0037-000000000037', 'Monte Romano', 'VT'),
  ('c0000038-0038-0038-0038-000000000038', 'Monterosi', 'VT'),
  -- N
  ('c0000039-0039-0039-0039-000000000039', 'Nepi', 'VT'),
  -- O
  ('c0000040-0040-0040-0040-000000000040', 'Onano', 'VT'),
  ('c0000041-0041-0041-0041-000000000041', 'Oriolo Romano', 'VT'),
  ('c0000042-0042-0042-0042-000000000042', 'Orte', 'VT'),
  -- P
  ('c0000043-0043-0043-0043-000000000043', 'Piansano', 'VT'),
  ('c0000044-0044-0044-0044-000000000044', 'Proceno', 'VT'),
  -- R
  ('c0000045-0045-0045-0045-000000000045', 'Ronciglione', 'VT'),
  -- S
  ('c0000046-0046-0046-0046-000000000046', 'San Lorenzo Nuovo', 'VT'),
  ('c0000047-0047-0047-0047-000000000047', 'Soriano nel Cimino', 'VT'),
  ('c0000048-0048-0048-0048-000000000048', 'Sutri', 'VT'),
  -- T
  ('c0000049-0049-0049-0049-000000000049', 'Tarquinia', 'VT'),
  ('c0000050-0050-0050-0050-000000000050', 'Tessennano', 'VT'),
  ('c0000051-0051-0051-0051-000000000051', 'Tuscania', 'VT'),
  -- V
  ('c0000052-0052-0052-0052-000000000052', 'Valentano', 'VT'),
  ('c0000053-0053-0053-0053-000000000053', 'Vallerano', 'VT'),
  ('c0000054-0054-0054-0054-000000000054', 'Vasanello', 'VT'),
  ('c0000055-0055-0055-0055-000000000055', 'Vejano', 'VT'),
  ('c0000056-0056-0056-0056-000000000056', 'Vetralla', 'VT'),
  ('c0000057-0057-0057-0057-000000000057', 'Vignanello', 'VT'),
  ('c0000058-0058-0058-0058-000000000058', 'Villa San Giovanni in Tuscia', 'VT'),
  ('c0000059-0059-0059-0059-000000000059', 'Viterbo', 'VT'),
  ('c0000060-0060-0060-0060-000000000060', 'Vitorchiano', 'VT');

-- ============================================
-- STEP 4: INSERIMENTO IMPRESE
-- ============================================

INSERT INTO imprese (id, name) VALUES
  ('i1111111-1111-1111-1111-111111111111', 'Idraulica Viterbese Srl'),
  ('i2222222-2222-2222-2222-222222222222', 'Talete SpA'),
  ('i3333333-3333-3333-3333-333333333333', 'Acquedotti Tuscia'),
  ('i4444444-4444-4444-4444-444444444444', 'Servizi Idrici Cimini'),
  ('i5555555-5555-5555-5555-555555555555', 'Pronto Intervento Acqua VT'),
  ('i6666666-6666-6666-6666-666666666666', 'Manutenzione Reti Lazio'),
  ('i7777777-7777-7777-7777-777777777777', 'Consorzio Acque Alto Lazio');

-- ============================================
-- VERIFICA FINALE
-- ============================================

SELECT 'Tipi lavorazione:' as tabella, COUNT(*) as totale FROM tipi_lavorazione
UNION ALL
SELECT 'Comuni:', COUNT(*) FROM comuni
UNION ALL
SELECT 'Imprese:', COUNT(*) FROM imprese
UNION ALL
SELECT 'Users:', COUNT(*) FROM users
UNION ALL
SELECT 'Rilevamenti:', COUNT(*) FROM rilevamenti;
