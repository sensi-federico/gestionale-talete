/**
 * Script per popolare il database con dati di test realistici
 * Eseguire con: npx ts-node seed_rilevamenti.ts
 * 
 * Prerequisiti:
 * 1. Aver eseguito seed_database.sql per creare comuni, imprese, tipi_lavorazione
 * 2. Aver creato almeno un utente tecnico in Supabase Auth
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Workaround per __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carica variabili d'ambiente
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Mancano le variabili SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Foto realistiche di cantieri/lavori idrici (Unsplash)
const FOTO_CANTIERI = [
  'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800', // Scavo strada
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800', // Lavori stradali
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', // Escavatore
  'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=800', // Cantiere
  'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800', // Tubi
  'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800', // Costruzione
  'https://images.unsplash.com/photo-1517089596392-fb9a9033e05b?w=800', // Operai al lavoro
  null, // Alcuni senza foto
  null,
];

// Vie realistiche italiane
const VIE = [
  { via: 'Via Roma', civici: ['1', '15', '32', '45', '78', '112'] },
  { via: 'Via Garibaldi', civici: ['3', '22', '41', '56', '89'] },
  { via: 'Via Mazzini', civici: ['7', '18', '33', '67', '94'] },
  { via: 'Corso Italia', civici: ['12', '28', '55', '72', '101'] },
  { via: 'Via Dante', civici: ['5', '19', '38', '61', '83'] },
  { via: 'Via Verdi', civici: ['2', '14', '29', '47', '68'] },
  { via: 'Piazza della Repubblica', civici: ['1', '3', '5', '8'] },
  { via: 'Via XX Settembre', civici: ['11', '24', '42', '59'] },
  { via: 'Via Cavour', civici: ['6', '21', '35', '52', '77'] },
  { via: 'Via dei Mille', civici: ['9', '17', '31', '48', '66'] },
  { via: 'Via Nazionale', civici: ['4', '23', '39', '57', '85'] },
  { via: 'Via Vittorio Emanuele', civici: ['10', '26', '44', '63', '91'] },
  { via: 'Via San Marco', civici: ['8', '20', '36', '54'] },
  { via: 'Via della Libertà', civici: ['13', '27', '43', '69', '88'] },
  { via: 'Viale Europa', civici: ['16', '34', '51', '75', '99'] },
];

// Note realistiche per tipo di intervento
const NOTE_PER_TIPO: Record<string, string[]> = {
  'Allaccio': [
    'Nuovo allaccio per abitazione unifamiliare completato.',
    'Allaccio commerciale per ristorante. Contatore DN25.',
    'Derivazione per nuova palazzina 8 unità.',
    'Allaccio industriale con riduttore di pressione.',
    'Allaccio domestico standard completato senza problemi.',
  ],
  'Manutenzione': [
    'Verifica e pulizia pozzetti ispezione.',
    'Controllo pressione e portata su tratta.',
    'Sostituzione preventiva valvole vetuste.',
    'Manutenzione ordinaria completata.',
    'Controllo periodico impianto. Tutto regolare.',
  ],
  'Ispezione': [
    'Ispezione con telecamera. Nessuna anomalia rilevata.',
    'Verifica stato tubazioni. Leggera incrostazione.',
    'Ispezione preventiva post-segnalazione. OK.',
    'Controllo visivo rete. Nessun problema.',
    'Ispezione programmata trimestrale completata.',
  ],
  'Predisposizione allaccio': [
    'Predisposizione per futuro allaccio abitazione.',
    'Preparazione punto di derivazione per cantiere.',
    'Installazione saracinesca per futuro allaccio.',
    'Predisposizione completata, in attesa di richiesta allaccio.',
    'Punto predisposto per nuova utenza commerciale.',
  ],
  'Riparazione': [
    'Perdita individuata su giunto. Riparata con manicotto in acciaio.',
    'Fessura su tubo principale. Intervento con fascia di riparazione.',
    'Perdita da valvola. Sostituita guarnizione.',
    'Rottura per radici. Rimosso tratto danneggiato.',
    'Riparazione urgente completata. Ripristinata erogazione.',
  ],
  'Sostituzione': [
    'Sostituiti 15 metri di tubazione obsoleta con PEAD.',
    'Tratto corroso. Nuova posa con tubo PE ø110.',
    'Upgrade da DN80 a DN100 per aumentare portata.',
    'Sostituzione completa allaccio condominiale.',
    'Sostituzione contatore guasto con nuovo digitale.',
  ],
  'Altro': [
    'Intervento completato con successo.',
    'Sopralluogo tecnico per valutazione.',
    'Assistenza per lavori stradali terzi.',
    'Verifica segnalazione utente. Nessun problema riscontrato.',
    'Supporto tecnico per cantiere edile.',
  ],
};

// Materiali tubo
const MATERIALI = ['PVC', 'PE', 'PEAD', 'Ghisa', 'Acciaio', 'Rame', 'Cemento'];
const DIAMETRI = ['25mm', '32mm', '50mm', '63mm', '80mm', '100mm', '110mm', '125mm', '150mm', '200mm'];
const ALTRI_INTERVENTI = ['SI', 'NO'];

// Coordinate GPS per comuni della provincia di Viterbo
const COORDINATE_COMUNI: Record<string, { lat: number; lon: number; variance: number }> = {
  'c0000001-0001-0001-0001-000000000001': { lat: 42.7433, lon: 11.8658, variance: 0.01 }, // Acquapendente
  'c0000002-0002-0002-0002-000000000002': { lat: 42.4633, lon: 11.8167, variance: 0.005 }, // Arlena di Castro
  'c0000003-0003-0003-0003-000000000003': { lat: 42.6275, lon: 12.0911, variance: 0.01 }, // Bagnoregio
  'c0000004-0004-0004-0004-000000000004': { lat: 42.2500, lon: 12.0667, variance: 0.005 }, // Barbarano Romano
  'c0000005-0005-0005-0005-000000000005': { lat: 42.2167, lon: 12.1833, variance: 0.008 }, // Bassano Romano
  'c0000006-0006-0006-0006-000000000006': { lat: 42.4667, lon: 12.4333, variance: 0.005 }, // Bassano in Teverina
  'c0000007-0007-0007-0007-000000000007': { lat: 42.2744, lon: 11.9306, variance: 0.008 }, // Blera
  'c0000008-0008-0008-0008-000000000008': { lat: 42.6458, lon: 11.9858, variance: 0.01 }, // Bolsena
  'c0000009-0009-0009-0009-000000000009': { lat: 42.4747, lon: 12.2489, variance: 0.008 }, // Bomarzo
  'c0000010-0010-0010-0010-000000000010': { lat: 42.2200, lon: 12.4267, variance: 0.005 }, // Calcata
  'c0000011-0011-0011-0011-000000000011': { lat: 42.3833, lon: 12.2333, variance: 0.006 }, // Canepina
  'c0000012-0012-0012-0012-000000000012': { lat: 42.4667, lon: 11.7500, variance: 0.008 }, // Canino
  'c0000013-0013-0013-0013-000000000013': { lat: 42.5500, lon: 11.9000, variance: 0.006 }, // Capodimonte
  'c0000014-0014-0014-0014-000000000014': { lat: 42.2500, lon: 12.1667, variance: 0.008 }, // Capranica
  'c0000015-0015-0015-0015-000000000015': { lat: 42.3253, lon: 12.2358, variance: 0.008 }, // Caprarola
  'c0000016-0016-0016-0016-000000000016': { lat: 42.3333, lon: 12.2667, variance: 0.005 }, // Carbognano
  'c0000017-0017-0017-0017-000000000017': { lat: 42.2500, lon: 12.3667, variance: 0.006 }, // Castel Sant'Elia
  'c0000018-0018-0018-0018-000000000018': { lat: 42.6500, lon: 12.2000, variance: 0.006 }, // Castiglione in Teverina
  'c0000019-0019-0019-0019-000000000019': { lat: 42.5667, lon: 12.1333, variance: 0.005 }, // Celleno
  'c0000020-0020-0020-0020-000000000020': { lat: 42.5167, lon: 11.7667, variance: 0.005 }, // Cellere
  'c0000021-0021-0021-0021-000000000021': { lat: 42.2931, lon: 12.4092, variance: 0.012 }, // Civita Castellana
  'c0000022-0022-0022-0022-000000000022': { lat: 42.6000, lon: 12.2833, variance: 0.006 }, // Civitella d'Agliano
  'c0000023-0023-0023-0023-000000000023': { lat: 42.3500, lon: 12.3500, variance: 0.006 }, // Corchiano
  'c0000024-0024-0024-0024-000000000024': { lat: 42.3333, lon: 12.2833, variance: 0.008 }, // Fabrica di Roma
  'c0000025-0025-0025-0025-000000000025': { lat: 42.2333, lon: 12.4500, variance: 0.006 }, // Faleria
  'c0000026-0026-0026-0026-000000000026': { lat: 42.5500, lon: 11.7167, variance: 0.006 }, // Farnese
  'c0000027-0027-0027-0027-000000000027': { lat: 42.4167, lon: 12.4000, variance: 0.006 }, // Gallese
  'c0000028-0028-0028-0028-000000000028': { lat: 42.6500, lon: 11.8500, variance: 0.005 }, // Gradoli
  'c0000029-0029-0029-0029-000000000029': { lat: 42.5667, lon: 12.2167, variance: 0.005 }, // Graffignano
  'c0000030-0030-0030-0030-000000000030': { lat: 42.6833, lon: 11.8667, variance: 0.006 }, // Grotte di Castro
  'c0000031-0031-0031-0031-000000000031': { lat: 42.5500, lon: 11.7500, variance: 0.006 }, // Ischia di Castro
  'c0000032-0032-0032-0032-000000000032': { lat: 42.6333, lon: 11.8167, variance: 0.005 }, // Latera
  'c0000033-0033-0033-0033-000000000033': { lat: 42.6333, lon: 12.1000, variance: 0.005 }, // Lubriano
  'c0000034-0034-0034-0034-000000000034': { lat: 42.5333, lon: 11.9333, variance: 0.006 }, // Marta
  'c0000035-0035-0035-0035-000000000035': { lat: 42.3500, lon: 11.6000, variance: 0.01 }, // Montalto di Castro
  'c0000036-0036-0036-0036-000000000036': { lat: 42.5394, lon: 12.0306, variance: 0.01 }, // Montefiascone
  'c0000037-0037-0037-0037-000000000037': { lat: 42.2667, lon: 11.9000, variance: 0.006 }, // Monte Romano
  'c0000038-0038-0038-0038-000000000038': { lat: 42.2000, lon: 12.3500, variance: 0.006 }, // Monterosi
  'c0000039-0039-0039-0039-000000000039': { lat: 42.2436, lon: 12.3472, variance: 0.008 }, // Nepi
  'c0000040-0040-0040-0040-000000000040': { lat: 42.6833, lon: 11.8167, variance: 0.005 }, // Onano
  'c0000041-0041-0041-0041-000000000041': { lat: 42.1667, lon: 12.1333, variance: 0.006 }, // Oriolo Romano
  'c0000042-0042-0042-0042-000000000042': { lat: 42.4597, lon: 12.4500, variance: 0.008 }, // Orte
  'c0000043-0043-0043-0043-000000000043': { lat: 42.5333, lon: 11.8333, variance: 0.005 }, // Piansano
  'c0000044-0044-0044-0044-000000000044': { lat: 42.7667, lon: 11.8333, variance: 0.005 }, // Proceno
  'c0000045-0045-0045-0045-000000000045': { lat: 42.2897, lon: 12.2125, variance: 0.008 }, // Ronciglione
  'c0000046-0046-0046-0046-000000000046': { lat: 42.6833, lon: 11.9167, variance: 0.006 }, // San Lorenzo Nuovo
  'c0000047-0047-0047-0047-000000000047': { lat: 42.4192, lon: 12.2342, variance: 0.01 }, // Soriano nel Cimino
  'c0000048-0048-0048-0048-000000000048': { lat: 42.2414, lon: 12.2225, variance: 0.008 }, // Sutri
  'c0000049-0049-0049-0049-000000000049': { lat: 42.2494, lon: 11.7558, variance: 0.015 }, // Tarquinia
  'c0000050-0050-0050-0050-000000000050': { lat: 42.4667, lon: 11.8000, variance: 0.004 }, // Tessennano
  'c0000051-0051-0051-0051-000000000051': { lat: 42.4189, lon: 11.8717, variance: 0.01 }, // Tuscania
  'c0000052-0052-0052-0052-000000000052': { lat: 42.5667, lon: 11.8167, variance: 0.006 }, // Valentano
  'c0000053-0053-0053-0053-000000000053': { lat: 42.3833, lon: 12.2000, variance: 0.005 }, // Vallerano
  'c0000054-0054-0054-0054-000000000054': { lat: 42.4167, lon: 12.3500, variance: 0.006 }, // Vasanello
  'c0000055-0055-0055-0055-000000000055': { lat: 42.2167, lon: 12.0833, variance: 0.005 }, // Vejano
  'c0000056-0056-0056-0056-000000000056': { lat: 42.3194, lon: 12.0536, variance: 0.01 }, // Vetralla
  'c0000057-0057-0057-0057-000000000057': { lat: 42.3833, lon: 12.2833, variance: 0.006 }, // Vignanello
  'c0000058-0058-0058-0058-000000000058': { lat: 42.2667, lon: 12.0500, variance: 0.004 }, // Villa San Giovanni in Tuscia
  'c0000059-0059-0059-0059-000000000059': { lat: 42.4206, lon: 12.1081, variance: 0.02 }, // Viterbo
  'c0000060-0060-0060-0060-000000000060': { lat: 42.4667, lon: 12.1667, variance: 0.006 }, // Vitorchiano
};

// Funzioni utility
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomCoord(base: number, variance: number): number {
  return base + (Math.random() - 0.5) * 2 * variance;
}

function randomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysAgo));
  return date.toISOString().split('T')[0];
}

function randomTime(): string {
  const hour = randomInt(7, 17);
  const minute = randomInt(0, 59);
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
}

async function main() {
  console.log('🚀 Avvio popolamento database...\n');

  // 0. Pulisci rilevamenti esistenti
  console.log('🧹 Pulizia rilevamenti esistenti...');
  const { error: deleteError } = await supabase.from('rilevamenti').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (deleteError) {
    console.error('⚠️  Errore pulizia (potrebbe essere vuoto):', deleteError.message);
  } else {
    console.log('✅ Rilevamenti eliminati\n');
  }

  // 1. Recupera dati di riferimento
  const { data: tipiLavorazione } = await supabase.from('tipi_lavorazione').select('id, name');
  const { data: comuni } = await supabase.from('comuni').select('id, name');
  const { data: imprese } = await supabase.from('imprese').select('id, name');
  const { data: users } = await supabase.from('users').select('id, email, full_name, role').eq('role', 'operaio');

  if (!tipiLavorazione?.length || !comuni?.length || !imprese?.length) {
    console.error('❌ Tabelle di riferimento vuote. Esegui prima seed_database.sql');
    process.exit(1);
  }

  if (!users?.length) {
    console.error('❌ Nessun utente tecnico trovato. Crea almeno un utente con ruolo "operaio" in Supabase Auth.');
    console.log('\nPer creare un utente tecnico:');
    console.log('1. Vai su Supabase Dashboard → Authentication → Users');
    console.log('2. Clicca "Add user" → "Create new user"');
    console.log('3. Email: tecnico1@talete.it, Password: Test1234!');
    console.log('4. In user_metadata aggiungi: {"role": "operaio", "full_name": "Marco Rossi"}');
    process.exit(1);
  }

  console.log(`📊 Dati trovati:`);
  console.log(`   - ${tipiLavorazione.length} tipi lavorazione`);
  console.log(`   - ${comuni.length} comuni`);
  console.log(`   - ${imprese.length} imprese`);
  console.log(`   - ${users.length} tecnici\n`);

  // 2. Genera rilevamenti
  const rilevamenti = [];
  const NUM_RILEVAMENTI = 50; // Numero di rilevamenti da creare

  for (let i = 0; i < NUM_RILEVAMENTI; i++) {
    const tipo = randomElement(tipiLavorazione);
    const comune = randomElement(comuni);
    const impresa = randomElement(imprese);
    const operaio = randomElement(users);
    const viaData = randomElement(VIE);
    const coords = COORDINATE_COMUNI[comune.id] || { lat: 43.7696, lon: 11.2558, variance: 0.02 };
    
    const noteArray = NOTE_PER_TIPO[tipo.name] || ['Intervento completato con successo.'];
    const foto = randomElement(FOTO_CANTIERI);
    const date = randomDate(60); // Ultimi 60 giorni
    const time = randomTime();

    const lat = randomCoord(coords.lat, coords.variance);
    const lon = randomCoord(coords.lon, coords.variance);

    rilevamenti.push({
      operaio_id: operaio.id,
      comune_id: comune.id,
      impresa_id: impresa.id,
      tipo_lavorazione_id: tipo.id,
      via: viaData.via,
      numero_civico: randomElement(viaData.civici),
      numero_operai: randomInt(1, 5),
      foto_url: foto,
      gps_lat: lat,
      gps_lon: lon,
      manual_lat: Math.random() > 0.7 ? randomCoord(lat, 0.001) : null,
      manual_lon: Math.random() > 0.7 ? randomCoord(lon, 0.001) : null,
      rilevamento_date: date,
      rilevamento_time: time,
      notes: randomElement(noteArray),
      materiale_tubo: Math.random() > 0.3 ? randomElement(MATERIALI) : null,
      diametro: Math.random() > 0.3 ? randomElement(DIAMETRI) : null,
      altri_interventi: randomElement(ALTRI_INTERVENTI),
      submit_timestamp: `${date}T${time}+01:00`,
      submit_gps_lat: lat + (Math.random() - 0.5) * 0.0001,
      submit_gps_lon: lon + (Math.random() - 0.5) * 0.0001,
    });
  }

  // 3. Inserisci rilevamenti
  console.log(`📝 Inserimento ${rilevamenti.length} rilevamenti...`);
  
  const { data, error } = await supabase
    .from('rilevamenti')
    .insert(rilevamenti)
    .select('id');

  if (error) {
    console.error('❌ Errore inserimento:', error.message);
    process.exit(1);
  }

  console.log(`✅ Inseriti ${data?.length} rilevamenti con successo!\n`);

  // 4. Riepilogo
  const { count: totalRilevamenti } = await supabase
    .from('rilevamenti')
    .select('*', { count: 'exact', head: true });

  console.log('📊 Riepilogo finale:');
  console.log(`   - Rilevamenti totali: ${totalRilevamenti}`);
  console.log('\n✨ Database popolato con successo!');
}

main().catch(console.error);
