# 📚 Gestionale Talete - Documentazione Tecnica

**Versione:** 0.1.2  
**Data:** Dicembre 2025  
**Autore:** Sviluppo Talete Spa

---

## Indice

1. [Panoramica del Sistema](#1-panoramica-del-sistema)
2. [Architettura](#2-architettura)
3. [Stack Tecnologico](#3-stack-tecnologico)
4. [Frontend](#4-frontend)
5. [Backend](#5-backend)
6. [Database](#6-database)
7. [Autenticazione](#7-autenticazione)
8. [PWA e Funzionalità Offline](#8-pwa-e-funzionalità-offline)
9. [API Reference](#9-api-reference)
10. [Deployment](#10-deployment)
11. [Sicurezza](#11-sicurezza)
12. [Manutenzione](#12-manutenzione)

---

## 1. Panoramica del Sistema

### 1.1 Descrizione
Il Gestionale Talete è un'applicazione web progressive (PWA) per la gestione degli interventi sul campo nel settore delle utility. Permette ai tecnici di registrare interventi con geolocalizzazione, foto e dettagli tecnici, anche in modalità offline.

### 1.2 Utenti del Sistema

| Ruolo | Descrizione | Permessi |
|-------|-------------|----------|
| **Admin** | Amministratori sistema | CRUD completo su tutte le entità |
| **Tecnico (operaio)** | Tecnici sul campo | CRUD propri interventi |
| **Impresa** | Imprese esterne | CRUD interventi della propria impresa |
| **Responsabile** | Utente di controllo | Può visualizzare interventi (monitoraggio) ma non vede data/ora/posizione; può scaricare CSV limitato |

### 1.3 Funzionalità Principali

- ✅ Registrazione interventi con foto e GPS
- ✅ Supporto offline con sincronizzazione automatica
- ✅ Dashboard con statistiche
- ✅ Gestione utenti, comuni, imprese
- ✅ Export dati in CSV
- ✅ PWA installabile su mobile e desktop

---

## 2. Architettura

### 2.1 Schema Generale

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (PWA)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   React     │  │  IndexedDB  │  │   Service Worker    │  │
│  │   App       │  │  (Cache)    │  │   (Offline)         │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼───────────────────┼──────────────┘
          │                │                   │
          │ HTTPS          │ LocalStorage      │ Cache API
          │                │                   │
┌─────────▼────────────────▼───────────────────▼──────────────┐
│                     BACKEND (Express.js)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Routes    │  │   Auth      │  │   Storage           │  │
│  │   API       │  │   JWT       │  │   (Supabase)        │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼───────────────────┼──────────────┘
          │                │                   │
          │ SQL            │ Verify            │ Upload
          │                │                   │
┌─────────▼────────────────▼───────────────────▼──────────────┐
│                     SUPABASE                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  PostgreSQL │  │    Auth     │  │      Storage        │  │
│  │  Database   │  │   (Users)   │  │      (Bucket)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Flusso Dati

```
User Action → React Component → API Service → Backend Route → Supabase → Response
     ↓              ↓               ↓              ↓            ↓          ↓
   Event      State Update      HTTP Call      Validation    Query     JSON/Error
```

---

## 3. Stack Tecnologico

### 3.1 Frontend

| Tecnologia | Versione | Utilizzo |
|------------|----------|----------|
| React | 18.x | UI Framework |
| TypeScript | 5.x | Type Safety |
| Vite | 5.x | Build Tool |
| React Router | 6.x | Routing |
| TanStack Query | 5.x | Data Fetching & Cache |
| Zustand | 4.x | State Management |
| vite-plugin-pwa | 0.17.x | PWA Support |

### 3.2 Backend

| Tecnologia | Versione | Utilizzo |
|------------|----------|----------|
| Node.js | 20.x | Runtime |
| Express.js | 4.x | HTTP Server |
| TypeScript | 5.x | Type Safety |
| Zod | 3.x | Schema Validation |
| jsonwebtoken | 9.x | JWT Auth |
| multer | 1.x | File Upload |
| pino | 8.x | Logging |

### 3.3 Database & Storage

| Tecnologia | Utilizzo |
|------------|----------|
| Supabase | BaaS Platform |
| PostgreSQL | Database |
| Supabase Storage | File Storage (foto) |
| Supabase Auth | User Authentication |

### 3.4 Deployment

| Servizio | Utilizzo |
|----------|----------|
| GitHub Pages | Frontend Hosting |
| Fly.io | Backend Hosting |
| Supabase Cloud | Database & Storage |

---

## 4. Frontend

### 4.1 Struttura Directory

```
frontend/
├── public/
│   ├── icons/              # Icone PWA
│   ├── logo/               # Logo aziendale
│   └── manifest.json       # PWA Manifest
├── src/
│   ├── components/
│   │   ├── admin/          # Componenti area admin
│   │   ├── auth/           # Login, logout
│   │   ├── impresa/        # Form impresa
│   │   ├── layout/         # AppLayout, Header, Footer
│   │   ├── offline/        # Banner offline
│   │   ├── operaio/        # Form tecnico, lista rilevamenti
│   │   └── ui/             # Componenti riutilizzabili
│   ├── hooks/
│   │   ├── useAdminAlerts.ts
│   │   ├── useConfirmModal.ts
│   │   ├── useOfflineCache.ts
│   │   ├── useOfflineSync.ts
│   │   └── useLogout.ts
│   ├── services/
│   │   └── api.ts          # API client
│   ├── store/
│   │   └── authStore.ts    # Zustand store
│   ├── App.tsx             # Router principale
│   ├── main.tsx            # Entry point
│   └── styles.css          # Stili globali
├── index.html
├── vite.config.ts
└── tsconfig.json
```

### 4.2 Componenti Principali

#### AppLayout
Shell principale dell'applicazione con header, navigation e footer.

```typescript
// Struttura
<AppLayout>
  <Header />        // Logo, menu hamburger, navigazione
  <main>
    <Outlet />      // Contenuto pagina (React Router)
  </main>
  <Footer />        // Copyright, versione
</AppLayout>
```

#### NuovoRilevamentoForm
Form completo per tecnici con tutti i campi dettagliati.

**Campi:**
- Luogo: comune, via, civico
- Data/Ora
- Dettagli: tipo lavorazione, impresa, n° operai, materiale, diametro
- Mezzi utilizzati (selezione multipla)
- Foto (camera/upload)
- Note
- GPS automatico

#### NuovoInterventoImpresaForm
Form semplificato per imprese.

**Campi:**
- Luogo: comune, via, civico
- Data, ora inizio, ora fine
- Tipo lavorazione, n° operai
- Mezzi utilizzati
- Note

### 4.3 State Management

**Zustand Store (authStore):**
```typescript
interface AuthState {
  user: User | null;
  tokens: Tokens | null;
  setAuth: (user: User, tokens: Tokens) => void;
  clearAuth: () => void;
  updateTokens: (tokens: Tokens) => void;
}
```

**TanStack Query:**
- `useQuery` per data fetching con cache
- `useMutation` per operazioni CRUD
- Cache invalidation automatica

### 4.4 Routing

```typescript
<Routes>
  <Route path="/login" element={<LoginForm />} />
  <Route element={<ProtectedRoute allowedRoles={["operaio", "admin", "impresa"]} />}>
    <Route path="/" element={<AppLayout />}>
      <Route index element={<HomeRoute />} />
      <Route path="profilo" element={<ProfilePage />} />
      
      {/* Rotte tecnico */}
      <Route element={<ProtectedRoute allowedRoles={["operaio"]} />}>
        <Route path="nuovo" element={<NuovoRilevamentoPage />} />
      </Route>
      
      {/* Rotte impresa */}
      <Route element={<ProtectedRoute allowedRoles={["impresa"]} />}>
        <Route path="nuovo-impresa" element={<NuovoInterventoImpresaPage />} />
      </Route>
      
      {/* Miei rilevamenti - operaio e impresa */}
      <Route element={<ProtectedRoute allowedRoles={["operaio", "impresa"]} />}>
        <Route path="miei-rilevamenti" element={<MieiRilevamentiPage />} />
      </Route>
      
      {/* Rotte admin */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="admin/*" element={<AdminRoutes />} />
      </Route>
    </Route>
  </Route>
</Routes>
```

---

## 5. Backend

### 5.1 Struttura Directory

```
backend/
├── src/
│   ├── lib/
│   │   ├── logger.ts           # Pino logger
│   │   └── supabaseClient.ts   # Supabase admin client
│   ├── middleware/
│   │   └── auth.ts             # JWT verification
│   ├── routes/
│   │   ├── admin.ts            # CRUD utenti, comuni, imprese
│   │   ├── auth.ts             # Login, register, refresh
│   │   └── rilevamenti.ts      # CRUD rilevamenti
│   ├── schemas/
│   │   ├── auth.ts             # Zod schemas auth
│   │   └── rilevamenti.ts      # Zod schemas rilevamenti
│   ├── shared/
│   │   └── types.ts            # Tipi condivisi
│   └── index.ts                # Entry point
├── Dockerfile
├── fly.toml
└── tsconfig.json
```

### 5.2 Middleware Auth

```typescript
export const requireAuth = (allowedRoles?: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token mancante" });
    }

    const token = authHeader.split(" ")[1];
    
    // Verifica JWT con Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: "Token non valido" });
    }

    // Recupera ruolo da metadata
    const role = user.user_metadata?.role ?? "operaio";
    
    if (allowedRoles && !allowedRoles.includes(role)) {
      return res.status(403).json({ message: "Accesso negato" });
    }

    req.user = {
      id: user.id,
      email: user.email!,
      role,
      impresaId: user.user_metadata?.impresa_id
    };

    next();
  };
};
```

### 5.3 Validazione con Zod

```typescript
// Schema esempio per creazione rilevamento
export const createRilevamentoSchema = z.object({
  comuneId: z.string().uuid(),
  via: z.string().min(1).max(255),
  numeroCivico: z.string().min(1).max(20),
  tipoLavorazioneId: z.string().uuid(),
  impresaId: z.string().uuid(),
  numeroOperai: z.number().int().positive(),
  gpsLat: z.number(),
  gpsLon: z.number(),
  rilevamentoDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rilevamentoTime: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().optional(),
  materialeTubo: z.string().optional(),
  diametro: z.string().optional(),
  altriInterventi: z.string().optional(),
});
```

---

## 6. Database

### 6.1 Schema ER

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   users     │     │   comuni    │     │ tipi_lavorazione│
├─────────────┤     ├─────────────┤     ├─────────────────┤
│ id (PK)     │     │ id (PK)     │     │ id (PK)         │
│ email       │     │ name        │     │ name            │
│ full_name   │     │ province    │     │ description     │
│ role        │     │ region      │     └─────────────────┘
│ impresa_id  │──┐  └─────────────┘              │
└─────────────┘  │          │                     │
                 │          │                     │
                 │  ┌───────▼─────────────────────▼───────┐
                 │  │            rilevamenti              │
                 │  ├─────────────────────────────────────┤
                 │  │ id (PK)                             │
                 │  │ operaio_id (FK) ──────────────────┐ │
                 │  │ comune_id (FK)                    │ │
                 │  │ impresa_id (FK) ──────────────┐   │ │
                 │  │ tipo_lavorazione_id (FK)      │   │ │
                 │  │ via, numero_civico            │   │ │
                 │  │ gps_lat, gps_lon              │   │ │
                 │  │ rilevamento_date/time         │   │ │
                 │  │ foto_url                      │   │ │
                 │  │ notes, materiale_tubo, etc.   │   │ │
                 │  │ sync_status                   │   │ │
                 │  │ created_at                    │   │ │
                 │  └───────────────────────────────┼───┼─┘
                 │                                  │   │
                 │  ┌───────────────────────────────▼───┘
                 │  │
                 └──▼────────────┐
                    │  imprese   │
                    ├────────────┤
                    │ id (PK)    │
                    │ name       │
                    │ piva       │
                    │ phone      │
                    │ email      │
                    │ address    │
                    └────────────┘
```

### 6.2 Tabelle Principali

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('operaio', 'admin', 'impresa')) DEFAULT 'operaio',
  impresa_id UUID REFERENCES imprese(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_sign_in_at TIMESTAMPTZ
);
```

#### rilevamenti
```sql
CREATE TABLE rilevamenti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operaio_id UUID NOT NULL REFERENCES users(id),
  comune_id UUID NOT NULL REFERENCES comuni(id),
  impresa_id UUID REFERENCES imprese(id),
  tipo_lavorazione_id UUID NOT NULL REFERENCES tipi_lavorazione(id),
  via TEXT NOT NULL,
  numero_civico TEXT NOT NULL,
  numero_operai INTEGER NOT NULL,
  foto_url TEXT,
  gps_lat DECIMAL(10, 8),
  gps_lon DECIMAL(11, 8),
  manual_lat DECIMAL(10, 8),
  manual_lon DECIMAL(11, 8),
  rilevamento_date DATE NOT NULL,
  rilevamento_time TIME NOT NULL,
  notes TEXT,
  materiale_tubo TEXT,
  diametro TEXT,
  altri_interventi TEXT,
  submit_timestamp TIMESTAMPTZ,
  submit_gps_lat DECIMAL(10, 8),
  submit_gps_lon DECIMAL(11, 8),
  sync_status TEXT DEFAULT 'synced',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.3 Trigger

```sql
-- Trigger per sincronizzare users con auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, impresa_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'operaio'),
    (NEW.raw_user_meta_data->>'impresa_id')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 7. Autenticazione

### 7.1 Flusso Login

```
1. User inserisce email/password
2. Frontend chiama POST /api/auth/login
3. Backend verifica con Supabase Auth
4. Supabase restituisce access_token e refresh_token
5. Backend aggiunge user metadata e restituisce
6. Frontend salva tokens in Zustand + localStorage
7. Tutte le richieste successive includono Authorization: Bearer {token}
```

### 7.2 Token Refresh

```
1. Access token scade (1 ora default)
2. Frontend intercetta 401
3. Frontend chiama POST /api/auth/refresh con refresh_token
4. Backend ottiene nuovi tokens da Supabase
5. Frontend aggiorna tokens
6. Ripete richiesta originale
```

### 7.3 Logout

```
1. User clicca Logout
2. Frontend chiama POST /api/auth/logout
3. Backend invalida sessione su Supabase
4. Frontend pulisce store e localStorage
5. Redirect a /login
```

---

## 8. PWA e Funzionalità Offline

### 8.1 Service Worker

Configurato con `vite-plugin-pwa`:

```typescript
// vite.config.ts
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'supabase-storage',
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }
        }
      }
    ]
  },
  manifest: {
    name: 'Gestionale Talete',
    short_name: 'Talete',
    theme_color: '#0066cc',
    icons: [...]
  }
})
```

### 8.2 Cache Offline

**useOfflineCache Hook:**
```typescript
// Salva dati di riferimento in localStorage
const saveToCache = (data: ReferenceData) => {
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
};

// Carica da cache se offline
const loadFromCache = (): ReferenceData | null => {
  const cached = localStorage.getItem(CACHE_KEY);
  return cached ? JSON.parse(cached) : null;
};
```

### 8.3 Sync Queue

**useOfflineSync Hook:**
```typescript
// Salva intervento in coda se offline
const addToQueue = (rilevamento: OfflineRilevamento) => {
  const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  queue.push({ ...rilevamento, id: uuid(), timestamp: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

// Processa coda quando online
const processSync = async () => {
  if (!navigator.onLine) return;
  
  const queue = getQueue();
  for (const item of queue) {
    await api.createRilevamento(item, token);
    removeFromQueue(item.id);
  }
};
```

---

## 9. API Reference

### 9.1 Autenticazione

#### POST /api/auth/login
```typescript
// Request
{ email: string, password: string }

// Response 200
{ 
  user: { id, email, fullName, role, impresaId },
  accessToken: string,
  refreshToken: string
}

// Response 401
{ message: "Credenziali non valide" }
```

#### POST /api/auth/refresh
```typescript
// Request
{ refreshToken: string }

// Response 200
{ accessToken: string, refreshToken: string }
```

#### POST /api/auth/logout
```typescript
// Headers: Authorization: Bearer {token}
// Response 200
{ message: "Logout effettuato" }
```

### 9.2 Rilevamenti

#### GET /api/rilevamenti
```typescript
// Headers: Authorization: Bearer {token}
// Response 200
{ 
  rilevamenti: [{
    id, via, numero_civico, rilevamento_date, rilevamento_time,
    comune: { name }, tipo: { name }, impresa: { name },
    foto_url, gps_lat, gps_lon, notes, ...
  }]
}
```

#### POST /api/rilevamenti
```typescript
// Headers: Authorization: Bearer {token}
// Content-Type: multipart/form-data
// Body: FormData con campi + foto

// Response 201
{ message: "Rilevamento creato", id: string }

// Response 400
{ message: "Dati non validi" }
```

### 9.3 Admin

#### GET /api/admin/users
```typescript
// Headers: Authorization: Bearer {token}
// Requires: role = admin

// Response 200
{ users: [{ id, email, fullName, role, impresaId, createdAt, lastSignInAt }] }
```

#### POST /api/admin/users
```typescript
// Request
{ email, fullName, password, role, impresaId? }

// Response 201
{ message: "Utente creato", user: {...} }
```

#### PUT /api/admin/users/:id
```typescript
// Request
{ email?, fullName?, password?, role?, impresaId? }

// Response 200
{ message: "Utente aggiornato" }
```

#### DELETE /api/admin/users/:id
```typescript
// Response 204 No Content
```

### 9.4 Reference Data

#### GET /api/admin/comuni
```typescript
{ comuni: [{ id, name, province, region }] }
```

#### GET /api/admin/imprese
```typescript
{ imprese: [{ id, name, piva, phone, email, address }] }
```

#### GET /api/admin/tipi-lavorazione
```typescript
{ tipiLavorazione: [{ id, name, description }] }
```

---

## 10. Deployment

### 10.1 Frontend (GitHub Pages)

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: cd frontend && npm ci && npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

### 10.2 Backend (Fly.io)

```toml
# fly.toml
app = "gestionaletalete-backend"
primary_region = "fra"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 3000
  force_https = true

[env]
  NODE_ENV = "production"
```

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src ./src
COPY tsconfig.json ./
RUN npm run build
RUN npm prune --production
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Deploy:**
```bash
cd backend
fly deploy
```

### 10.3 Environment Variables

**Frontend (.env):**
```
VITE_API_BASE_URL=https://gestionaletalete-backend.fly.dev/api
```

**Backend (Fly.io Secrets):**
```bash
fly secrets set SUPABASE_URL=https://xxx.supabase.co
fly secrets set SUPABASE_SERVICE_KEY=xxx
fly secrets set JWT_SECRET=xxx
```

---

## 11. Sicurezza

### 11.1 Misure Implementate

| Misura | Implementazione |
|--------|-----------------|
| HTTPS | Forzato su tutti gli endpoint |
| JWT Auth | Token firmati, scadenza 1h |
| CORS | Whitelist domini autorizzati |
| Input Validation | Zod schemas su tutti gli input |
| SQL Injection | Prepared statements via Supabase |
| XSS | React escaping automatico |
| CSRF | Token-based auth (no cookies) |
| Rate Limiting | Da implementare |

### 11.2 Row Level Security (RLS)

```sql
-- Utenti vedono solo i propri rilevamenti
CREATE POLICY "Users can view own rilevamenti"
ON rilevamenti FOR SELECT
USING (operaio_id = auth.uid());

-- Imprese vedono rilevamenti della propria impresa
CREATE POLICY "Imprese can view own rilevamenti"
ON rilevamenti FOR SELECT
USING (
  impresa_id = (SELECT impresa_id FROM users WHERE id = auth.uid())
);

-- Admin vedono tutto
CREATE POLICY "Admins can view all"
ON rilevamenti FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);
```

---

## 12. Manutenzione

### 12.1 Monitoring

**Logs Backend:**
```bash
fly logs -a gestionaletalete-backend
```

**Metriche Supabase:**
- Dashboard Supabase → Reports
- Query performance
- Storage usage
- Auth metrics

### 12.2 Backup

**Database:**
- Backup automatici Supabase (giornalieri)
- Export manuale: Supabase Dashboard → Database → Backups

**Storage:**
- Bucket replicato automaticamente

### 12.3 Aggiornamenti

**Frontend:**
```bash
cd frontend
npm update
npm run build
git push  # Auto-deploy via GitHub Actions
```

**Backend:**
```bash
cd backend
npm update
fly deploy
```

### 12.4 Troubleshooting

| Problema | Diagnosi | Soluzione |
|----------|----------|-----------|
| 401 su tutte le chiamate | Token scaduto/invalido | Verificare JWT_SECRET, refresh token |
| Foto non caricate | Storage permissions | Verificare bucket policies |
| Sync offline fallisce | Conflict dati | Verificare schema validation |
| PWA non aggiorna | Service worker cache | Incrementare versione, force refresh |

---

## Appendice A: Comandi Utili

```bash
# Frontend dev
cd frontend && npm run dev

# Backend dev
cd backend && npm run dev

# Build frontend
cd frontend && npm run build

# Deploy backend
cd backend && fly deploy

# Logs backend
fly logs -a gestionaletalete-backend

# Database migration (esempio)
npx supabase db push
```

---

## Appendice B: Changelog

### v0.1.2 (Dicembre 2025)
- ✅ Supporto ruolo Impresa
- ✅ Form semplificato per imprese
- ✅ Icone mezzi nel form
- ✅ Fix z-index modal
- ✅ Aggiornamento PWA icons

### v0.1.1
- ✅ Funzionalità offline complete
- ✅ Sync automatico
- ✅ Export CSV

### v0.1.0
- ✅ Release iniziale
- ✅ CRUD rilevamenti
- ✅ Gestione utenti
- ✅ PWA base

---

**Gestionale Talete v0.1.2**  
**© 2025 Talete Spa - Tutti i diritti riservati**
