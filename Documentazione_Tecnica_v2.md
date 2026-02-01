# Documentazione Tecnica - Talete Gestionale

## Indice

1. [Architettura](#1-architettura)
2. [Frontend](#2-frontend)
3. [Backend](#3-backend)
4. [Database](#4-database)
5. [Autenticazione](#5-autenticazione)
6. [Offline & PWA](#6-offline--pwa)
7. [API Reference](#7-api-reference)
8. [Deploy](#8-deploy)

---

## 1. Architettura

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    React PWA                         │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │    │
│  │  │  Zustand │  │  TanStack│  │  Service Worker  │  │    │
│  │  │  Store   │  │  Query   │  │  (Workbox)       │  │    │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │    │
│  │                       │                │            │    │
│  │                       ▼                ▼            │    │
│  │              ┌──────────────┐  ┌─────────────┐     │    │
│  │              │   API Layer  │  │  IndexedDB  │     │    │
│  │              │   (fetch)    │  │   (Dexie)   │     │    │
│  │              └──────────────┘  └─────────────┘     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         SERVER                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Express API                       │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │    │
│  │  │  Routes  │  │   Auth   │  │     Multer       │  │    │
│  │  │          │  │Middleware│  │  (file upload)   │  │    │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        SUPABASE                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  PostgreSQL │  │    Auth     │  │      Storage        │  │
│  │  Database   │  │   (JWT)     │  │  (foto interventi)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Flusso Dati

1. **Online**: Client → Express API → Supabase
2. **Offline**: Client → IndexedDB → (sync) → Express API → Supabase

---

## 2. Frontend

### Tecnologie

| Package | Versione | Uso |
|---------|----------|-----|
| React | 18.x | UI Framework |
| Vite | 5.x | Build tool |
| TypeScript | 5.x | Type safety |
| @tanstack/react-query | 5.x | Data fetching & cache |
| zustand | 4.x | State management |
| react-router-dom | 6.x | Routing (HashRouter) |
| maplibre-gl | 4.x | Mappe |
| dexie | 3.x | IndexedDB wrapper |
| vite-plugin-pwa | 0.20.x | PWA support |

### Struttura Componenti

```
src/
├── components/
│   ├── admin/           # Pagine admin
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminUsersPage.tsx
│   │   ├── AdminRilevazioniPage.tsx
│   │   └── ...
│   ├── auth/
│   │   └── LoginForm.tsx
│   ├── wizard/          # Wizard intervento (6 step)
│   │   ├── InterventoWizard.tsx
│   │   ├── StepLuogo.tsx
│   │   ├── StepLavoro.tsx
│   │   ├── StepOperai.tsx
│   │   ├── StepMezziAttrezzature.tsx
│   │   ├── StepDocumenta.tsx
│   │   └── StepRiepilogo.tsx
│   ├── layout/
│   │   └── AppLayout.tsx
│   ├── map/
│   │   └── MapPicker.tsx
│   └── ui/              # Componenti riutilizzabili
├── hooks/
│   ├── useGeolocation.ts
│   ├── useOfflineQueue.ts
│   ├── useOfflineCache.ts
│   └── useSWUpdate.ts
├── services/
│   └── api.ts           # API client
├── store/
│   └── authStore.ts     # Zustand auth store
├── utils/
│   ├── offlineDB.ts     # Dexie database
│   └── imageCompression.ts
└── styles/              # CSS modulari
```

### State Management

**Zustand Store** (`authStore.ts`):
```typescript
interface AuthState {
  user: UserProfile | null;
  tokens: { accessToken: string; refreshToken: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  restoreSession: () => Promise<void>;
}
```

**TanStack Query** - Usato per:
- Fetch dati anagrafiche (comuni, imprese, tipi lavorazione)
- Lista rilevamenti
- Statistiche dashboard

### Routing

Usa `HashRouter` per compatibilità con hosting statico.

```typescript
// Routes principali
/                    # Dashboard (role-based)
/login               # Login page
/nuovo-intervento    # Wizard intervento
/miei-rilevamenti    # Lista propri rilevamenti
/admin/*             # Pagine admin
```

---

## 3. Backend

### Tecnologie

| Package | Uso |
|---------|-----|
| Express | Web framework |
| @supabase/supabase-js | Database client |
| multer | File upload |
| zod | Schema validation |
| sharp | Image processing |

### Struttura

```
src/
├── index.ts              # Entry point
├── routes/
│   ├── auth.ts           # POST /auth/login, /auth/refresh
│   ├── rilevamenti.ts    # CRUD rilevamenti
│   └── admin.ts          # Endpoints admin
├── middleware/
│   ├── auth.ts           # JWT verification
│   └── requestLogger.ts  # Logging
├── lib/
│   ├── supabaseClient.ts # Supabase instance
│   └── token.ts          # JWT utilities
└── shared/
    └── types.ts          # Tipi condivisi
```

### Middleware Auth

```typescript
// Verifica JWT Supabase
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error) return res.status(401).json({ error: 'Unauthorized' });
  req.user = user;
  next();
};
```

---

## 4. Database

### Schema Principale

```sql
-- Utenti (gestiti da Supabase Auth)
-- profiles estende auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'responsabile', 'operaio', 'impresa')),
  impresa_id UUID REFERENCES imprese(id)
);

-- Rilevamenti
CREATE TABLE rilevamenti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operaio_id UUID NOT NULL REFERENCES profiles(id),
  comune_id UUID NOT NULL REFERENCES comuni(id),
  impresa_id UUID REFERENCES imprese(id),
  tipo_lavorazione_id UUID NOT NULL REFERENCES tipi_lavorazione(id),
  
  -- Localizzazione
  via TEXT NOT NULL,
  numero_civico TEXT,
  gps_lat DECIMAL(10, 8) NOT NULL,
  gps_lon DECIMAL(11, 8) NOT NULL,
  manual_lat DECIMAL(10, 8),
  manual_lon DECIMAL(11, 8),
  
  -- Dati intervento
  rilevamento_date DATE NOT NULL,
  rilevamento_time TIME NOT NULL,
  ora_fine TIME,
  numero_operai INTEGER NOT NULL,
  
  -- Dati tubo
  tubo_esistente JSONB,
  tubo_nuovo JSONB,
  altri_interventi TEXT,
  
  -- Foto (URLs Supabase Storage)
  foto_panoramica TEXT,
  foto_inizio_lavori TEXT,
  foto_intervento TEXT,
  foto_fine_lavori TEXT,
  
  -- Tracking
  submit_timestamp TIMESTAMPTZ,
  submit_gps_lat DECIMAL(10, 8),
  submit_gps_lon DECIMAL(11, 8),
  
  -- Metadata
  sync_status TEXT DEFAULT 'synced',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabelle relazionali
CREATE TABLE rilevamenti_mezzi (
  rilevamento_id UUID REFERENCES rilevamenti(id),
  mezzo_id UUID REFERENCES mezzi(id),
  ore_utilizzo DECIMAL(4, 2),
  PRIMARY KEY (rilevamento_id, mezzo_id)
);

CREATE TABLE rilevamenti_attrezzature (
  rilevamento_id UUID REFERENCES rilevamenti(id),
  attrezzatura_id UUID REFERENCES attrezzature(id),
  ore_utilizzo DECIMAL(4, 2),
  PRIMARY KEY (rilevamento_id, attrezzatura_id)
);

CREATE TABLE rilevamenti_operai (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rilevamento_id UUID REFERENCES rilevamenti(id),
  tipo_operaio TEXT CHECK (tipo_operaio IN ('specializzato', 'qualificato', 'comune')),
  numero INTEGER,
  ore_lavoro DECIMAL(4, 2)
);
```

### Anagrafiche

```sql
-- Comuni
CREATE TABLE comuni (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  province TEXT,
  region TEXT
);

-- Imprese
CREATE TABLE imprese (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  partita_iva TEXT,
  phone TEXT,
  email TEXT,
  address TEXT
);

-- Tipi Lavorazione
CREATE TABLE tipi_lavorazione (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

-- Mezzi, Attrezzature, Materiali Tubo
CREATE TABLE mezzi (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE attrezzature (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE materiali_tubo (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
);
```

---

## 5. Autenticazione

### Flusso

1. **Login**: Client → Backend `/auth/login` → Supabase Auth
2. **Token**: Supabase restituisce `access_token` + `refresh_token`
3. **Storage**: Tokens salvati in `localStorage` + Zustand
4. **Requests**: `Authorization: Bearer <access_token>`
5. **Refresh**: Automatico quando token scade

### Ruoli e Permessi

| Ruolo | Rilevamenti | Anagrafiche | Utenti |
|-------|-------------|-------------|--------|
| admin | Tutti (RW) | Tutti (RW) | Tutti (RW) |
| responsabile | Tutti (R) | Tutti (R) | No |
| operaio | Propri (RW) | Lettura | No |
| impresa | Propria impresa (RW) | Lettura | No |

---

## 6. Offline & PWA

### IndexedDB Schema

```typescript
// utils/offlineDB.ts
interface OfflineRilevamento {
  localId: string;           // UUID locale
  isSynced: boolean;         // Stato sync
  localCreatedAt: string;    // Timestamp creazione locale
  
  // Dati rilevamento
  comuneId: string;
  via: string;
  // ... altri campi
  
  // Foto come Blob per offline
  fotoPanoramicaBlob?: Blob;
  fotoInizioLavoriBlob?: Blob;
  fotoInterventoBlob?: Blob;
  fotoFineLavoriBlob?: Blob;
}
```

### Flusso Sincronizzazione

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Utente    │     │  IndexedDB   │     │   Server    │
└──────┬──────┘     └──────┬───────┘     └──────┬──────┘
       │                   │                    │
       │  Submit (offline) │                    │
       │──────────────────►│                    │
       │                   │                    │
       │ ◄─────────────────│                    │
       │  Salvato locale   │                    │
       │                   │                    │
       │        [Torna online]                  │
       │                   │                    │
       │                   │    Sync automatica │
       │                   │───────────────────►│
       │                   │                    │
       │                   │ ◄─────────────────│
       │                   │    Success        │
       │                   │                    │
       │                   │  Rimuovi da queue │
       │                   │                    │
```

### Service Worker

Configurato con `vite-plugin-pwa`:

```typescript
// vite.config.ts
VitePWA({
  registerType: 'prompt',  // Mostra modal prima di aggiornare
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-cache',
          expiration: { maxEntries: 50, maxAgeSeconds: 86400 }
        }
      }
    ]
  }
})
```

---

## 7. API Reference

### Autenticazione

#### POST `/auth/login`
```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Nome Utente",
    "role": "operaio"
  },
  "accessToken": "jwt...",
  "refreshToken": "jwt..."
}
```

#### POST `/auth/refresh`
```json
Request:
{
  "refreshToken": "jwt..."
}

Response:
{
  "accessToken": "new-jwt...",
  "refreshToken": "new-jwt..."
}
```

### Rilevamenti

#### GET `/rilevamenti`
Query params: `page`, `limit`, `comuneId`, `impresaId`, `from`, `to`

#### POST `/rilevamenti`
```
Content-Type: multipart/form-data

Fields:
- comuneId (required)
- via (required)
- numeroCivico
- tipoLavorazioneId (required)
- impresaId
- gpsLat (required)
- gpsLon (required)
- manualLat
- manualLon
- rilevamentoDate (required)
- rilevamentoTime (required)
- oraFine
- tuboEsistente (JSON)
- tuboNuovo (JSON)
- mezziUtilizzo (JSON array)
- attrezzatureUtilizzo (JSON array)
- operai (JSON array)
- notes

Files:
- fotoPanoramica
- fotoInizioLavori
- fotoIntervento
- fotoFineLavori
```

#### GET `/rilevamenti/:id`
#### DELETE `/rilevamenti/:id` (admin only)

### Admin

#### GET `/admin/users`
#### POST `/admin/users`
#### PUT `/admin/users/:id`
#### DELETE `/admin/users/:id`

#### GET `/admin/comuni`
#### POST `/admin/comuni`
#### PUT `/admin/comuni/:id`
#### DELETE `/admin/comuni/:id`

(Simili per: imprese, tipi-lavorazione, mezzi, attrezzature, materiali-tubo)

---

## 8. Deploy

### Frontend (Vercel)

```bash
# vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Backend (Fly.io)

```bash
# fly.toml già configurato
fly deploy
```

### Environment Variables

**Frontend** (`.env`):
```
VITE_API_URL=https://api.example.com
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Backend** (`.env`):
```
PORT=3001
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=your-secret
CORS_ORIGIN=https://app.example.com
```

---

## Appendice: Tipi TypeScript

Vedi [shared/types.ts](../shared/types.ts) per tutti i tipi condivisi tra frontend e backend.
