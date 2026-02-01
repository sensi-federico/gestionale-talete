# Talete - Gestionale Interventi Idrici

Sistema gestionale per la registrazione e il monitoraggio di interventi sulla rete idrica, con supporto offline e sincronizzazione automatica.

## 🚀 Quick Start

### Requisiti
- Node.js 18+
- npm o pnpm
- Account Supabase

### Installazione

```bash
# Clone repository
git clone <repo-url>
cd gestionale-talete

# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Configure environment
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
# Edit .env files with your Supabase credentials

# Run development
cd frontend && npm run dev  # http://localhost:5173
cd backend && npm run dev   # http://localhost:3001
```

## 📦 Stack Tecnologico

| Layer | Tecnologie |
|-------|-----------|
| **Frontend** | React 18, Vite, TypeScript, TanStack Query, Zustand |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (JWT) |
| **PWA** | vite-plugin-pwa, Workbox |
| **Offline** | IndexedDB (Dexie), Service Worker |

## 👥 Ruoli Utente

| Ruolo | Accesso |
|-------|---------|
| **Admin** | Dashboard completa, gestione utenti/anagrafiche, tutti i rilevamenti |
| **Responsabile** | Dashboard, tutti i rilevamenti, statistiche |
| **Operaio** | Wizard inserimento interventi, propri rilevamenti |
| **Impresa** | Inserimento interventi (range orario), rilevamenti propria impresa |

## 📱 Funzionalità Principali

- **Wizard intervento** - Procedura guidata in 6 step con validazione
- **4 tipi di foto** - Panoramica, inizio lavori, intervento, fine lavori
- **Geolocalizzazione** - GPS automatico + selezione manuale su mappa
- **Offline-first** - Funziona senza connessione, sync automatica
- **PWA installabile** - Funziona come app nativa su mobile

## 🗂 Struttura Progetto

```
├── frontend/           # React PWA
│   ├── src/
│   │   ├── components/ # Componenti UI
│   │   ├── hooks/      # Custom hooks
│   │   ├── services/   # API client
│   │   ├── store/      # Zustand store
│   │   ├── styles/     # CSS modules
│   │   └── utils/      # Utilities
│   └── public/         # Assets statici
├── backend/            # Express API
│   └── src/
│       ├── routes/     # API endpoints
│       ├── middleware/ # Auth, logging
│       └── lib/        # Supabase client
├── shared/             # Tipi condivisi
└── docs/               # Documentazione
```

## 🔧 Scripts

```bash
# Frontend
npm run dev       # Development server
npm run build     # Production build
npm run preview   # Preview build

# Backend
npm run dev       # Development (nodemon)
npm run build     # Compile TypeScript
npm start         # Production
```

## 🌐 Deploy

- **Frontend**: Vercel, Netlify, o qualsiasi hosting statico
- **Backend**: Fly.io (config inclusa), Railway, Render

Vedi [docs/DEPLOY.md](docs/DEPLOY.md) per istruzioni dettagliate.

## 📄 Documentazione

- [Documentazione Tecnica](docs/Documentazione_Tecnica.md)
- [Guida Amministratori](docs/GUIDA_AMMINISTRATORI.md)
- [Guida Tecnici](docs/GUIDA_TECNICI.md)
- [Guida Imprese](docs/GUIDA_IMPRESE.md)

## 📝 License

Proprietario - Talete © 2024
