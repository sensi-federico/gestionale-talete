/**
 * Script per eseguire il seed SQL tramite Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🚀 Pulizia e ripopolamento database...\n');

  // 1. Elimina rilevamenti
  console.log('🧹 Elimino rilevamenti...');
  await supabase.from('rilevamenti').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 2. Elimina comuni esistenti
  console.log('🧹 Elimino comuni...');
  await supabase.from('comuni').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 3. Elimina imprese esistenti  
  console.log('🧹 Elimino imprese...');
  await supabase.from('imprese').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 4. Elimina tipi lavorazione esistenti
  console.log('🧹 Elimino tipi lavorazione...');
  await supabase.from('tipi_lavorazione').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 5. Inserisci tipi lavorazione
  console.log('📝 Inserisco tipi lavorazione...');
  const tipiLavorazione = [
    { id: 'a1111111-1111-1111-1111-111111111111', name: 'Riparazione perdita' },
    { id: 'a2222222-2222-2222-2222-222222222222', name: 'Sostituzione tubazione' },
    { id: 'a3333333-3333-3333-3333-333333333333', name: 'Allaccio nuova utenza' },
    { id: 'a4444444-4444-4444-4444-444444444444', name: 'Manutenzione programmata' },
    { id: 'a5555555-5555-5555-5555-555555555555', name: 'Intervento emergenza' },
    { id: 'a6666666-6666-6666-6666-666666666666', name: 'Posa nuova condotta' },
    { id: 'a7777777-7777-7777-7777-777777777777', name: 'Verifica contatore' },
    { id: 'a8888888-8888-8888-8888-888888888888', name: 'Bonifica rete' },
  ];
  await supabase.from('tipi_lavorazione').insert(tipiLavorazione);

  // 6. Inserisci imprese
  console.log('📝 Inserisco imprese...');
  const imprese = [
    { id: 'i1111111-1111-1111-1111-111111111111', name: 'Idraulica Viterbese Srl' },
    { id: 'i2222222-2222-2222-2222-222222222222', name: 'Talete SpA' },
    { id: 'i3333333-3333-3333-3333-333333333333', name: 'Acquedotti Tuscia' },
    { id: 'i4444444-4444-4444-4444-444444444444', name: 'Servizi Idrici Cimini' },
    { id: 'i5555555-5555-5555-5555-555555555555', name: 'Pronto Intervento Acqua VT' },
    { id: 'i6666666-6666-6666-6666-666666666666', name: 'Manutenzione Reti Lazio' },
    { id: 'i7777777-7777-7777-7777-777777777777', name: 'Consorzio Acque Alto Lazio' },
  ];
  await supabase.from('imprese').insert(imprese);

  // 7. Inserisci tutti i comuni della provincia di Viterbo
  console.log('📝 Inserisco 60 comuni della provincia di Viterbo...');
  const comuni = [
    { id: 'c0000001-0001-0001-0001-000000000001', name: 'Acquapendente', province: 'VT' },
    { id: 'c0000002-0002-0002-0002-000000000002', name: 'Arlena di Castro', province: 'VT' },
    { id: 'c0000003-0003-0003-0003-000000000003', name: 'Bagnoregio', province: 'VT' },
    { id: 'c0000004-0004-0004-0004-000000000004', name: 'Barbarano Romano', province: 'VT' },
    { id: 'c0000005-0005-0005-0005-000000000005', name: 'Bassano Romano', province: 'VT' },
    { id: 'c0000006-0006-0006-0006-000000000006', name: 'Bassano in Teverina', province: 'VT' },
    { id: 'c0000007-0007-0007-0007-000000000007', name: 'Blera', province: 'VT' },
    { id: 'c0000008-0008-0008-0008-000000000008', name: 'Bolsena', province: 'VT' },
    { id: 'c0000009-0009-0009-0009-000000000009', name: 'Bomarzo', province: 'VT' },
    { id: 'c0000010-0010-0010-0010-000000000010', name: 'Calcata', province: 'VT' },
    { id: 'c0000011-0011-0011-0011-000000000011', name: 'Canepina', province: 'VT' },
    { id: 'c0000012-0012-0012-0012-000000000012', name: 'Canino', province: 'VT' },
    { id: 'c0000013-0013-0013-0013-000000000013', name: 'Capodimonte', province: 'VT' },
    { id: 'c0000014-0014-0014-0014-000000000014', name: 'Capranica', province: 'VT' },
    { id: 'c0000015-0015-0015-0015-000000000015', name: 'Caprarola', province: 'VT' },
    { id: 'c0000016-0016-0016-0016-000000000016', name: 'Carbognano', province: 'VT' },
    { id: 'c0000017-0017-0017-0017-000000000017', name: 'Castel Sant\'Elia', province: 'VT' },
    { id: 'c0000018-0018-0018-0018-000000000018', name: 'Castiglione in Teverina', province: 'VT' },
    { id: 'c0000019-0019-0019-0019-000000000019', name: 'Celleno', province: 'VT' },
    { id: 'c0000020-0020-0020-0020-000000000020', name: 'Cellere', province: 'VT' },
    { id: 'c0000021-0021-0021-0021-000000000021', name: 'Civita Castellana', province: 'VT' },
    { id: 'c0000022-0022-0022-0022-000000000022', name: 'Civitella d\'Agliano', province: 'VT' },
    { id: 'c0000023-0023-0023-0023-000000000023', name: 'Corchiano', province: 'VT' },
    { id: 'c0000024-0024-0024-0024-000000000024', name: 'Fabrica di Roma', province: 'VT' },
    { id: 'c0000025-0025-0025-0025-000000000025', name: 'Faleria', province: 'VT' },
    { id: 'c0000026-0026-0026-0026-000000000026', name: 'Farnese', province: 'VT' },
    { id: 'c0000027-0027-0027-0027-000000000027', name: 'Gallese', province: 'VT' },
    { id: 'c0000028-0028-0028-0028-000000000028', name: 'Gradoli', province: 'VT' },
    { id: 'c0000029-0029-0029-0029-000000000029', name: 'Graffignano', province: 'VT' },
    { id: 'c0000030-0030-0030-0030-000000000030', name: 'Grotte di Castro', province: 'VT' },
    { id: 'c0000031-0031-0031-0031-000000000031', name: 'Ischia di Castro', province: 'VT' },
    { id: 'c0000032-0032-0032-0032-000000000032', name: 'Latera', province: 'VT' },
    { id: 'c0000033-0033-0033-0033-000000000033', name: 'Lubriano', province: 'VT' },
    { id: 'c0000034-0034-0034-0034-000000000034', name: 'Marta', province: 'VT' },
    { id: 'c0000035-0035-0035-0035-000000000035', name: 'Montalto di Castro', province: 'VT' },
    { id: 'c0000036-0036-0036-0036-000000000036', name: 'Montefiascone', province: 'VT' },
    { id: 'c0000037-0037-0037-0037-000000000037', name: 'Monte Romano', province: 'VT' },
    { id: 'c0000038-0038-0038-0038-000000000038', name: 'Monterosi', province: 'VT' },
    { id: 'c0000039-0039-0039-0039-000000000039', name: 'Nepi', province: 'VT' },
    { id: 'c0000040-0040-0040-0040-000000000040', name: 'Onano', province: 'VT' },
    { id: 'c0000041-0041-0041-0041-000000000041', name: 'Oriolo Romano', province: 'VT' },
    { id: 'c0000042-0042-0042-0042-000000000042', name: 'Orte', province: 'VT' },
    { id: 'c0000043-0043-0043-0043-000000000043', name: 'Piansano', province: 'VT' },
    { id: 'c0000044-0044-0044-0044-000000000044', name: 'Proceno', province: 'VT' },
    { id: 'c0000045-0045-0045-0045-000000000045', name: 'Ronciglione', province: 'VT' },
    { id: 'c0000046-0046-0046-0046-000000000046', name: 'San Lorenzo Nuovo', province: 'VT' },
    { id: 'c0000047-0047-0047-0047-000000000047', name: 'Soriano nel Cimino', province: 'VT' },
    { id: 'c0000048-0048-0048-0048-000000000048', name: 'Sutri', province: 'VT' },
    { id: 'c0000049-0049-0049-0049-000000000049', name: 'Tarquinia', province: 'VT' },
    { id: 'c0000050-0050-0050-0050-000000000050', name: 'Tessennano', province: 'VT' },
    { id: 'c0000051-0051-0051-0051-000000000051', name: 'Tuscania', province: 'VT' },
    { id: 'c0000052-0052-0052-0052-000000000052', name: 'Valentano', province: 'VT' },
    { id: 'c0000053-0053-0053-0053-000000000053', name: 'Vallerano', province: 'VT' },
    { id: 'c0000054-0054-0054-0054-000000000054', name: 'Vasanello', province: 'VT' },
    { id: 'c0000055-0055-0055-0055-000000000055', name: 'Vejano', province: 'VT' },
    { id: 'c0000056-0056-0056-0056-000000000056', name: 'Vetralla', province: 'VT' },
    { id: 'c0000057-0057-0057-0057-000000000057', name: 'Vignanello', province: 'VT' },
    { id: 'c0000058-0058-0058-0058-000000000058', name: 'Villa San Giovanni in Tuscia', province: 'VT' },
    { id: 'c0000059-0059-0059-0059-000000000059', name: 'Viterbo', province: 'VT' },
    { id: 'c0000060-0060-0060-0060-000000000060', name: 'Vitorchiano', province: 'VT' },
  ];
  
  const { error: comuniError } = await supabase.from('comuni').insert(comuni);
  if (comuniError) {
    console.error('❌ Errore inserimento comuni:', comuniError.message);
  }

  // 8. Verifica
  const { count: comuniCount } = await supabase.from('comuni').select('*', { count: 'exact', head: true });
  const { count: impreseCount } = await supabase.from('imprese').select('*', { count: 'exact', head: true });
  const { count: tipiCount } = await supabase.from('tipi_lavorazione').select('*', { count: 'exact', head: true });

  console.log('\n✅ Database ripopolato!');
  console.log(`   - ${comuniCount} comuni`);
  console.log(`   - ${impreseCount} imprese`);
  console.log(`   - ${tipiCount} tipi lavorazione`);
  console.log('\n📝 Ora esegui: npx ts-node seed_rilevamenti.ts');
}

main().catch(console.error);
