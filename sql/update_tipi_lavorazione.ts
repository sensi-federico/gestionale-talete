import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function updateTipiLavorazione() {
  console.log('🔄 Aggiornamento tipi lavorazione...\n');

  // 1. Elimina tutti i rilevamenti (hanno foreign key)
  console.log('🧹 Elimino rilevamenti esistenti...');
  await supabase.from('rilevamenti').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 2. Elimina tipi lavorazione esistenti
  console.log('🧹 Elimino tipi lavorazione esistenti...');
  await supabase.from('tipi_lavorazione').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 3. Inserisci nuovi tipi lavorazione (nell'ordine corretto)
  console.log('📝 Inserisco nuovi tipi lavorazione...');
  const tipiLavorazione = [
    { id: 'a0000001-0001-0001-0001-000000000001', name: 'Allaccio' },
    { id: 'a0000002-0002-0002-0002-000000000002', name: 'Manutenzione' },
    { id: 'a0000003-0003-0003-0003-000000000003', name: 'Ispezione' },
    { id: 'a0000004-0004-0004-0004-000000000004', name: 'Predisposizione allaccio' },
    { id: 'a0000005-0005-0005-0005-000000000005', name: 'Riparazione' },
    { id: 'a0000006-0006-0006-0006-000000000006', name: 'Sostituzione' },
    { id: 'a0000007-0007-0007-0007-000000000007', name: 'Altro' },
  ];

  const { error } = await supabase.from('tipi_lavorazione').insert(tipiLavorazione);
  if (error) {
    console.error('❌ Errore:', error.message);
    return;
  }

  // 4. Verifica
  const { data } = await supabase.from('tipi_lavorazione').select('name').order('name');
  console.log('\n✅ Tipi lavorazione inseriti:');
  data?.forEach((t, i) => console.log(`   ${i + 1}. ${t.name}`));

  console.log('\n📝 Ora rigenera i rilevamenti con: node --experimental-strip-types seed_rilevamenti.ts');
}

updateTipiLavorazione();
