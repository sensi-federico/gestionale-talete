# Relazione Progetto - Gestionale Rilevamenti Operai

## 1. Analisi dei Requisiti

### 1.1 Utenti del Sistema
- **Operai**: Utenti standard che raccolgono dati sul campo
- **Admin**: Utenti amministratori con accesso ai dati e alle configurazioni

### 1.2 Requisiti Funzionali

#### Per gli Operai
- **Autenticazione**: Login con email e password
- **Inserimento Rilevamenti**: Form offline-first con i seguenti campi:
  - Comune (dropdown gestito da admin)
  - Via (text input)
  - Numero civico (text/number input)
  - Tipo lavorazione (dropdown predefinito)
  - Impresa (dropdown gestito da admin)
  - Numero operai (number input)
  - Foto (camera/gallery upload con gestione offline)
  - Coordinate GPS automatiche (geolocalizzazione)
  - Coordinate manuali (mappa 3D satellitare interattiva)
  - Data e ora (auto-populated, modificabile)

- **Modalità Offline**: 
  - Salvataggio locale in IndexedDB
  - Sincronizzazione automatica quando online
  - Indicatore visivo dello stato di sync

#### Per gli Admin
- **Dashboard Admin**: Area dedicata con sezioni separate
- **Gestione Utenti**: 
  - Aggiungere nuovi operai
  - Gestire permessi
  - Visualizzare attività utenti
  
- **Gestione Comuni**: 
  - Aggiungere/modificare/eliminare comuni
  - Import/export lista

- **Gestione Imprese**: 
  - Aggiungere/modificare/eliminare imprese
  - Gestione dati aziendali

- **Visualizzazione Rilevamenti**: 
  - Tabella con tutti i rilevamenti
  - Filtri (data, comune, operaio, stato sync)
  - Export in CSV/Excel
  - Copia dati per Google Sheets

### 1.3 Requisiti Non Funzionali
- **Performance**: Loading time < 2s su 4G
- **Affidabilità**: PWA con cache strategy offline-first
- **Scalabilità**: Supporto fino a 100 operai simultanei
- **Responsiveness**: Funzionamento ottimale su mobile, tablet e desktop
- **Sicurezza**: Autenticazione con JWT, RBAC (Role-Based Access Control)

---

## 2. Stack Tecnologico

### Frontend
- **Framework**: React 18+ con Vite
- **UI Components**: Material-UI (MUI) o shadcn/ui per rapidità
- **State Management**: TanStack Query (React Query) + Zustand
- **Mappa 3D**: Mapbox GL JS (con layer satellitare)
- **Offline Storage**: IndexedDB con dexie.js
- **Geolocalizzazione**: Geolocation API nativa + idb-geo-api per tracciamento offline
- **Foto**: Sharp/Sharp.wasm per compressione lato client
- **PWA**: Workbox per service worker
- **UI**: Tailwind CSS per styling veloce

### Backend
- **Runtime**: Node.js + Express
- **Autenticazione**: JWT con refresh tokens
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage (per foto)
- **API**: REST (potenziale upgrade a GraphQL futuro)
- **Sync**: Implementazione custom con track dei timestamp
- **Validazione**: Joi o Zod per schema validation

### Database (Supabase/PostgreSQL)
Vedi sezione 3

### Deployment
- **Frontend**: Vercel o Netlify (con PWA support)
- **Backend**: Railway, Render, o Supabase Functions
- **Storage**: Supabase Storage

---

## 3. Architettura Database

### Tabelle Principali

#### `users`
```sql
id: UUID (PK)
email: VARCHAR UNIQUE
password_hash: VARCHAR
full_name: VARCHAR
role: ENUM ('operaio', 'admin')
created_at: TIMESTAMP
updated_at: TIMESTAMP
is_active: BOOLEAN
```

#### `comuni`
```sql
id: UUID (PK)
name: VARCHAR UNIQUE
province: VARCHAR
region: VARCHAR
created_by: UUID (FK users)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

#### `imprese`
```sql
id: UUID (PK)
name: VARCHAR UNIQUE
partita_iva: VARCHAR
phone: VARCHAR
email: VARCHAR
address: VARCHAR
created_by: UUID (FK users)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

#### `tipi_lavorazione`
```sql
id: UUID (PK)
name: VARCHAR UNIQUE
description: TEXT
created_at: TIMESTAMP
```
*Nota: Potrebbe essere un enum o statico*

#### `rilevamenti`
```sql
id: UUID (PK)
operaio_id: UUID (FK users)
comune_id: UUID (FK comuni)
via: VARCHAR
numero_civico: VARCHAR
tipo_lavorazione_id: UUID (FK tipi_lavorazione)
impresa_id: UUID (FK imprese)
numero_operai: INTEGER
foto_url: VARCHAR (file path in storage)
gps_lat: DECIMAL(10,8)
gps_lon: DECIMAL(10,8)
manual_lat: DECIMAL(10,8) NULLABLE
manual_lon: DECIMAL(10,8) NULLABLE
rilevamento_date: DATE
rilevamento_time: TIME
notes: TEXT NULLABLE
sync_status: ENUM ('synced', 'pending', 'failed') DEFAULT 'synced'
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

#### `rilevamenti_offline` (Locale - IndexedDB)
```js
{
  localId: string (UUID generato client)
  ...stessi campi di rilevamenti
  isSynced: boolean
  localCreatedAt: timestamp
}
```

### Indici
- `users(email)` - per login veloce
- `rilevamenti(operaio_id, created_at)` - per query storiche operaio
- `rilevamenti(sync_status)` - per tracking sync
- `comuni(name)` - per dropdown
- `imprese(name)` - per dropdown

### Row Level Security (RLS)
- Operai vedono solo i propri rilevamenti
- Admin vedono tutti i rilevamenti
- Operai non possono modificare comuni/imprese
- Operai non possono gestire utenti

---

## 4. Flussi Principali

### 4.1 Flusso Login
```
USER INPUT (email/password)
  ↓
POST /api/auth/login
  ↓
Validate credentials vs users table
  ↓
Generate JWT + refresh token
  ↓
Return tokens + user data + role
  ↓
Store in localStorage + Zustand
  ↓
Redirect based on role (operaio → home, admin → dashboard)
```

### 4.2 Flusso Inserimento Rilevamento (Online)
```
Operaio compila form
  ↓
Acquire GPS coordinates (Geolocation API)
  ↓
User selects manual coordinates on 3D map
  ↓
Upload foto a Supabase Storage
  ↓
POST /api/rilevamenti con tutti i dati
  ↓
Salva in PostgreSQL
  ↓
Aggiorna UI (success message)
  ↓
Clear form
```

### 4.3 Flusso Inserimento Rilevamento (Offline)
```
Operaio compila form (NO internet)
  ↓
Foto salvate localmente (blob in IndexedDB)
  ↓
Dati salvati in IndexedDB con isSynced: false
  ↓
UI mostra "Salvato offline - In attesa di sincronizzazione"
  ↓
Service Worker monitora connessione
  ↓
Quando online:
   ├─ Legge da IndexedDB (rilevamenti offline)
   ├─ Carica foto in Supabase Storage
   ├─ POST /api/rilevamenti/sync con batch di dati
   ├─ Sposta da IndexedDB a "synced"
   └─ Notifica utente
```

### 4.4 Flusso Dashboard Admin
```
Admin accede a /admin
  ↓
GET /api/admin/rilevamenti (con filtri)
  ↓
Riceve tabella dati dal server
  ↓
Rendering tabella con:
   ├─ Ordinamento
   ├─ Filtri
   ├─ Paginazione
   └─ Azioni (visualizza dettagli, elimina)
  ↓
Export:
   ├─ Copia tabella
   ├─ Download CSV
   └─ Integrazione Google Sheets (API)
```

### 4.5 Flusso Gestione Comuni/Imprese
```
Admin accede a sezione admin
  ↓
GET /api/admin/comuni (o imprese)
  ↓
Mostra tabella gestionale
  ↓
Add/Edit/Delete tramite modal form
  ↓
POST/PUT/DELETE /api/admin/comuni
  ↓
Validazione backend
  ↓
Aggiorna database
  ↓
Notifica all operai della modifica (cache invalidation)
```

---

## 5. Strategie Implementative

### 5.1 Offline-First Architecture
- **IndexedDB Schema**: Replicare struttura Supabase localmente
- **Sync Strategy**: 
  - Last-Write-Wins per conflitti
  - Timestamp tracking per rilevamenti
  - Queue per operazioni in sospeso
  
- **Service Worker**:
  - Cache statico: JS, CSS, immagini (cache-first)
  - Cache dinamico: API calls (network-first)
  - Background sync: Retry failed requests

### 5.2 PWA Implementation
- **manifest.json**: Icon, theme colors, display mode
- **Service Worker**: Workbox configuration
- **Install Prompt**: Custom UI per installazione
- **Offline Fallback**: Pagina offline dedicata
- **App Shell**: Core UI cached, dynamic content lazy-loaded

### 5.3 Mappa 3D Satellitare
- **Mapbox GL JS**: 
  - Basemap: `mapbox://styles/mapbox/satellite-v9`
  - Pitch: 60° per visualizzazione 3D
  - Controlli: Zoom, pan, rotation
  - Marker: Posizione GPS e manuale
  - Interaction: Click per selezionare coordinate

### 5.4 Geolocalizzazione
- **GPS Automatico**: 
  - Accuracy threshold: < 20 metri
  - Timeout: 30 secondi
  - Fallback: Ultimo GPS noto
  
- **Salvamento**: 
  - Lat/Lon in DECIMAL(10,8) per precisione ~1cm
  - Accuratezza: ±1 metro

### 5.5 Foto e Compressione
- **Cattura**: Camera API o file upload
- **Compressione Lato Client**: 
  - Sharp.wasm per ridurre da 5-10MB a 500KB-1MB
  - Formato: WebP (se supportato), altrimenti JPEG
  
- **Upload**: 
  - Multipart form-data a Supabase Storage
  - Naming: `rilevamenti/{user_id}/{timestamp}-{randomId}.jpg`

### 5.6 Sicurezza
- **Autenticazione**: 
  - Supabase Auth con JWT
  - Refresh token ogni 1 ora
  - LocalStorage per token (considerare sessionStorage)

- **Autorizzazione**: 
  - Middleware Express per verificare role
  - RLS policies su Supabase

- **Validazione**: 
  - Client-side: Zod schema
  - Server-side: Joi + RLS check

- **HTTPS**: Obbligatorio per PWA e geolocalizzazione

---

## 6. Struttura Progetto

```
talete-2.0/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   ├── Operaio/
│   │   │   ├── Admin/
│   │   │   ├── Map/
│   │   │   ├── Shared/
│   │   │   └── Offline/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── OperaioHome.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── NotFound.tsx
│   │   ├── stores/
│   │   │   ├── authStore.ts
│   │   │   ├── rilevamentiStore.ts
│   │   │   └── offlineStore.ts
│   │   ├── hooks/
│   │   │   ├── useGeolocation.ts
│   │   │   ├── useOfflineSync.ts
│   │   │   └── useComuniQuery.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── db.ts (IndexedDB)
│   │   │   ├── storage.ts (file handling)
│   │   │   └── sync.ts
│   │   ├── utils/
│   │   │   ├── compression.ts
│   │   │   ├── validators.ts
│   │   │   └── constants.ts
│   │   ├── styles/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   │   ├── manifest.json
│   │   ├── icons/
│   │   └── offline.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── sw.ts (Service Worker)
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── rilevamenti.ts
│   │   │   └── admin.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── validation.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── db/
│   │   │   ├── supabase.ts
│   │   │   └── migrations/
│   │   ├── utils/
│   │   ├── types/
│   │   └── app.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── shared/
│   ├── types.ts (Interfacce comuni)
│   └── validators.ts (Schema Zod comuni)
│
└── RELAZIONE_PROGETTO.md
```

---

## 7. Timeline Implementazione

| Fase | Task | Durata | Priorità |
|------|------|--------|----------|
| 1 | Setup progetto + Vite + deps | 1h | ALTA |
| 2 | DB Schema + Migrations | 2h | ALTA |
| 3 | Backend: Auth routes | 2h | ALTA |
| 4 | Backend: Rilevamenti CRUD | 2h | ALTA |
| 5 | Frontend: Layout base + Auth | 2h | ALTA |
| 6 | Frontend: Form rilevamenti | 3h | ALTA |
| 7 | Frontend: Mappa Mapbox 3D | 3h | MEDIA |
| 8 | Frontend: Geolocalizzazione | 1h | MEDIA |
| 9 | Frontend: Compressione foto | 2h | MEDIA |
| 10 | Frontend: IndexedDB + Offline | 4h | ALTA |
| 11 | Frontend: Service Worker | 2h | MEDIA |
| 12 | Backend: Admin routes | 2h | MEDIA |
| 13 | Frontend: Admin dashboard | 4h | MEDIA |
| 14 | Frontend: Export/Copy tabella | 2h | MEDIA |
| 15 | PWA: manifest + installazione | 1h | BASSA |
| 16 | Testing + bug fixes | 3h | ALTA |

**Totale stimato: 35-40 ore di sviluppo**

---

## 8. Considerazioni Importanti

### 8.1 Sfide Tecniche
1. **Sincronizzazione Offline**: Gestire conflitti quando lo stesso rilevamento è modificato da più dispositivi
2. **Performance Mappa**: Su dispositivi low-end, Mapbox 3D potrebbe essere lento → fallback a 2D
3. **Limite Upload Storage**: Supabase ha limiti di upload → chunk upload per file grandi
4. **Compatibilità Browser**: PWA e Geolocalizzazione non supportati su IE11

### 8.2 Miglioramenti Futuri
- [ ] GraphQL per query ottimizzate
- [ ] Real-time updates con WebSocket (Supabase Realtime)
- [ ] Mappa offline con MBTiles
- [ ] OCR per estrazione dati da foto
- [ ] Integrazione Salesforce/SAP
- [ ] Analytics dashboard
- [ ] Mobile app nativa (React Native)

### 8.3 Metriche di Successo
- ✅ App funzionante offline
- ✅ Tempo di sync < 5 secondi per 10 rilevamenti
- ✅ Load time < 2 secondi su 4G
- ✅ Installabile come PWA
- ✅ 100% dei dati sincronizzati entro 24h
- ✅ User adoption > 80%

---

## 9. Dipendenze Critiche

### Frontend
```json
{
  "react": "^18.2.0",
  "vite": "^5.0.0",
  "zustand": "^4.4.0",
  "@tanstack/react-query": "^5.0.0",
  "@mui/material": "^5.14.0",
  "mapbox-gl": "^3.0.0",
  "dexie": "^4.0.0",
  "zod": "^3.22.0",
  "axios": "^1.6.0",
  "workbox": "^7.0.0"
}
```

### Backend
```json
{
  "express": "^4.18.0",
  "supabase": "^2.38.0",
  "jsonwebtoken": "^9.1.0",
  "joi": "^17.11.0",
  "cors": "^2.8.0",
  "dotenv": "^16.3.0"
}
```

---

## 10. Checklist Pre-Implementazione

- [ ] Configurare account Supabase
- [ ] Configurare credenziali API Mapbox
- [ ] Setup repository Git
- [ ] Installare dipendenze Node.js
- [ ] Configurare variabili d'ambiente (.env)
- [ ] Review schema database con stakeholder
- [ ] Ottenere design mockup (opzionale)
- [ ] Setup CI/CD pipeline
- [ ] Configurare hosting (Vercel + Railway/Render)

---

**Documento preparato il**: 29 Novembre 2025  
**Versione**: 1.0  
**Status**: Pronto per implementazione
