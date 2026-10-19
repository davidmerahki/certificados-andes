# Arquitectura — Plataforma de Certificación Multi-curso

## Decisión TypeScript

El repositorio partía de un esqueleto mínimo en JavaScript. Se migró a **TypeScript** porque:

- Casi no existía código productivo que migrar.
- Los contratos de repositorio/puertos se benefician de tipado estático.
- Las pruebas y el DI explícito son más seguros con interfaces.

## Diagrama de capas

```
┌─────────────────────────────────────────────────────────────┐
│  Presentation (Express)                                     │
│  routes → controllers → serializers / error middleware      │
└────────────────────────────┬────────────────────────────────┘
                             │ invoca
┌────────────────────────────▼────────────────────────────────┐
│  Application (use cases)                                    │
│  Sync · Eligibility · Emit · Courses · Reports              │
│  Dependencias inyectadas (repositorios + puertos)           │
└────────────────────────────┬────────────────────────────────┘
                             │ usa
┌────────────────────────────▼────────────────────────────────┐
│  Domain                                                     │
│  Entities · Value Objects · Eligibility rules               │
│  Repository contracts · External ports (LW / POK / Lock)    │
│  ★ Sin Express, Mongoose, HTTP ni env                       │
└────────────────────────────▲────────────────────────────────┘
                             │ implementa
┌────────────────────────────┴────────────────────────────────┐
│  Infrastructure                                             │
│  Mongo repos · LearnWorldsHttpClient · PokHttpClient        │
│  Cron scheduler · Distributed lock · Composition root       │
└─────────────────────────────────────────────────────────────┘
```

## Árbol de carpetas

```
src/
  domain/
    entities/          CourseConfig, Student, Enrollment, AcademicProgress,
                       Certification, SyncRun
    value-objects/     Statuses, requirements, identity, policies
    repositories/      I*Repository contracts
    ports/             ILearnWorldsClient, IPokClient, IDistributedLock, …
    services/          EligibilityService, TemplateCompatibilityService
    errors/
  application/
    use-cases/
      courses/         Register, Update, Activate, Deactivate, Validate, …
      sync/            SyncStudents, SyncEnrollments, RunSynchronization, …
      certification/   IdentifyEligible, Simulate, Emit, Retry, History, …
      reports/         GenerateSyncReport
  infrastructure/
    persistence/mongoose/   models + repository implementations
    external/learnworlds/   HTTP adapter
    external/pok/           HTTP adapter
    scheduling/             NightlySyncScheduler → use case only
    locks/                  MongoDistributedLock
    di/container.ts         Explicit composition root
    config/
  presentation/
    http/                   app, routes, controllers, middlewares
  server.ts
tests/
  domain/ application/ presentation/ integration/
docs/
  ARCHITECTURE.md
```

## Recorrido de una certificación (LearnWorlds → POK)

| # | Etapa | Capa |
|---|--------|------|
| 1 | Cron nocturno dispara `RunSynchronizationUseCase` | Infrastructure → Application |
| 2 | Se cargan **todos los cursos activos** desde Mongo (`findActiveForSync`) | Application → Domain contract → Infrastructure |
| 3 | Por curso: sync de inscritos/progreso vía `ILearnWorldsClient` | Application → Port → LearnWorlds adapter |
| 4 | `EligibilityService` evalúa finalización + reglas + idempotencia | Domain |
| 5 | Se crea `Certification` (identidad: student + course + cycle) | Domain |
| 6 | `EmitCredentialUseCase` llama `IPokClient.emitCredential` con la plantilla del curso | Application → Port → POK adapter |
| 7 | Se persiste estado `emitted` / `failed` en el repositorio | Infrastructure |
| 8 | Fallo de un curso/estudiante no detiene el resto | Application orchestration |

## Cómo agregar un curso nuevo (sin tocar código)

1. Obtener el ID del curso en LearnWorlds.
2. Obtener el ID de la plantilla en POK.
3. `POST /api/courses` con ambos IDs y la configuración.
4. `POST /api/courses/:id/validate` — comprueba accesibilidad y compatibilidad.
5. `POST /api/courses/:id/simulate` — revisa elegibles sin emitir.
6. `POST /api/courses/:id/activate` — entra en el cron nocturno automáticamente.

## Prevención de duplicados

Índice único MongoDB: `(studentId, courseConfigId, certificationCycle)`.

El mismo estudiante puede certificarse en cursos distintos; el mismo ciclo no se reemite.

## Criterios arquitectónicos verificados

1. Domain no importa Express/Mongoose/HTTP.
2. Use cases no consultan Mongo directamente.
3. Controllers solo validan → use case → respuesta.
4. LearnWorlds y POK son adaptadores independientes.
5. Repositorios implementan contratos del dominio.
6. El cron solo invoca use cases.
7. DI explícito en `createContainer`.
8. Tests con fakes (sin credenciales reales).
9. Reglas de negocio testeables sin servidor.
10. Mongo/Express/proveedores son reemplazables vía puertos.
