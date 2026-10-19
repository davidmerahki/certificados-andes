# Deploy en Vercel (pnpm + auto-deploy)

## Auto-deploy

Con el repo `davidmerahki/certificados-andes` conectado a Vercel:

1. Cada **push a `main`** dispara un deploy automático.
2. No hace falta redeploy manual desde el dashboard.

Comprueba en Vercel → Project → Settings → Git que la rama de producción sea `main`.

## pnpm (seguridad)

- El proyecto **solo acepta pnpm** (`preinstall` + `packageManager`).
- Lockfile: `pnpm-lock.yaml` (no uses `package-lock.json`).
- Vercel instala con: `pnpm install --frozen-lockfile`.

Local:

```bash
npm install -g pnpm@9.15.9   # una vez
pnpm install
pnpm dev
```

## Variables de entorno (Vercel → Settings → Environment Variables)

Aplica a Production, Preview y Development:

- `MONGODB_URI`
- `ADMIN_API_KEY`
- `LEARNWORLDS_BASE_URL`
- `LEARNWORLDS_CLIENT_ID`
- `LEARNWORLDS_ACCESS_TOKEN`
- `POK_BASE_URL`
- `POK_API_KEY`
- `SIMULATION_MODE` (`true` hasta validar)
- `CRON_SECRET` (para el cron de Vercel)

Node recomendado en Vercel: **20.x** (Project → Settings → General → Node.js Version).

## Tras el deploy

```text
GET https://<tu-proyecto>.vercel.app/api/health
```

Cron nocturno: `GET /api/cron/sync` (7:00 UTC ≈ 2:00 Colombia).
