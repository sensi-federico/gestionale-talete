import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function fixImprese() {
  console.log('Inserisco imprese...');
  
  const imprese = [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Idraulica Viterbese Srl' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Talete SpA' },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Acquedotti Tuscia' },
    { id: '44444444-4444-4444-4444-444444444444', name: 'Servizi Idrici Cimini' },
    { id: '55555555-5555-5555-5555-555555555555', name: 'Pronto Intervento Acqua VT' },
    { id: '66666666-6666-6666-6666-666666666666', name: 'Manutenzione Reti Lazio' },
    { id: '77777777-7777-7777-7777-777777777777', name: 'Consorzio Acque Alto Lazio' },
  ];
  
  for (const impresa of imprese) {
    const { data, error } = await supabase.from('imprese').insert(impresa).select();
    if (error) {
      console.log(`Errore ${impresa.name}:`, error.message);
    } else {
      console.log(`OK: ${impresa.name}`);
    }
  }
  
  const { count } = await supabase.from('imprese').select('*', { count: 'exact', head: true });
  console.log('Totale imprese:', count);
}

fixImprese();
