# Certificados — LearnWorlds → POK

Plataforma de integración **multi-curso / multi-certificación** con Clean Architecture.

## Stack

- TypeScript + Node.js
- Express (presentation)
- MongoDB + Mongoose (infrastructure)
- Vitest (tests)
- node-cron (scheduler)

## Inicio rápido

```bash
cp .env.example .env
# Editar MONGODB_URI, ADMIN_API_KEY, tokens LW/POK
npm install
npm run dev
```

```bash
npm test
npm run build
```

## API (admin)

Autenticación: header `x-api-key` o `Authorization: Bearer <ADMIN_API_KEY>`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Health check público |
| POST | `/api/courses` | Registrar curso |
| GET | `/api/courses` | Listar cursos |
| PATCH | `/api/courses/:id` | Actualizar configuración |
| POST | `/api/courses/:id/template` | Asociar plantilla POK |
| POST | `/api/courses/:id/validate` | Validar configuración |
| POST | `/api/courses/:id/simulate` | Simular emisiones |
| POST | `/api/courses/:id/activate` | Activar certificación |
| POST | `/api/courses/:id/deactivate` | Desactivar / archivar |
| POST | `/api/sync/run` | Ejecutar sincronización |
| GET | `/api/sync/runs/:id/report` | Informe de sync |
| POST | `/api/certifications/emit` | Emitir credencial |
| GET | `/api/certifications/history` | Historial |
| POST | `/api/certifications/:id/retry` | Reintentar fallo |

## Documentación de arquitectura

Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): diagrama, árbol de carpetas y flujo completo de certificación.
