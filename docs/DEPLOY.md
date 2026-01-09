# Deploy & Secrets (Breve guida)

Questa pagina spiega i passaggi necessari per abilitare il deploy automatico:

## Frontend → GitHub Pages
- Il workflow GitHub Action è: `.github/workflows/deploy.yml`.
- Il workflow costruisce il progetto in `frontend` e pubblica la cartella `frontend/dist` su GitHub Pages.
- Il `base` usato da Vite è impostato dinamicamente in build tramite `VITE_BASE_PATH`.
- Se usi il routing basato su `BrowserRouter`, valuta `HashRouter` o configura correttamente il `base`.

## Backend → Fly.io
- Il workflow GitHub Action è: `.github/workflows/deploy-backend.yml`.
- Assicurati di aggiungere il secret `FLY_API_TOKEN` nelle impostazioni del repository (Settings → Secrets → Actions).
  - Il token lo ottieni con `flyctl auth token` dopo aver eseguito il login con `flyctl`.
- Il file di configurazione Fly è `backend/fly.toml`.
- Il container usa il `Dockerfile` in `backend/` e l'app sarà disponibile su `https://<nome-app>.fly.dev`.

## Variabili d'ambiente/URL
- Il workflow frontend imposta `VITE_API_BASE_URL` a `https://gestionaletalete-backend.fly.dev/api` (modifica se necessario).
- Se desideri creare un account `responsabile` di default in fase di bootstrap, puoi impostare le variabili (sul server/VM o come secret CI):
  - `DEFAULT_RESPONSABILE_EMAIL`  es. `responsabile@tuo-dominio.it`
  - `DEFAULT_RESPONSABILE_PASSWORD`  es. `PasswordSicura123`
  - `DEFAULT_RESPONSABILE_NAME` (opzionale)

## Controlli rapidi
- Verifica che `frontend/dist` venga generato localmente con `cd frontend && npm ci && npm run build`.
- Verifica che il deploy backend lavori localmente con `flyctl deploy` (dopo login e configurazione iniziale).

Se vuoi, posso aggiungere anche un piccolo script di test che esegue una build e controlla che `frontend/dist/index.html` esista come parte della CI. Sentimi per procedere.