import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  port: number;
  mongoUri: string;
  nodeEnv: string;
  adminApiKey: string;
  learnWorlds: {
    baseUrl: string;
    accessToken: string;
    clientId: string;
  };
  pok: {
    baseUrl: string;
    apiKey: string;
  };
  sync: {
    cron: string;
    batchSize: number;
    concurrency: number;
    simulationMode: boolean;
  };
}

export function loadConfig(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 3000),
    mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/certificados',
    nodeEnv: process.env.NODE_ENV ?? 'development',
    adminApiKey: process.env.ADMIN_API_KEY ?? 'dev-admin-key',
    learnWorlds: {
      baseUrl:
        process.env.LEARNWORLDS_BASE_URL ??
        'https://yourschool.learnworlds.com/admin/api/v2',
      accessToken: process.env.LEARNWORLDS_ACCESS_TOKEN ?? '',
      clientId: process.env.LEARNWORLDS_CLIENT_ID ?? '',
    },
    pok: {
      baseUrl: process.env.POK_BASE_URL ?? 'https://api.pok.tech',
      apiKey: process.env.POK_API_KEY ?? '',
    },
    sync: {
      cron: process.env.SYNC_CRON ?? '0 2 * * *',
      batchSize: Number(process.env.SYNC_BATCH_SIZE ?? 50),
      concurrency: Number(process.env.SYNC_CONCURRENCY ?? 3),
      simulationMode: process.env.SIMULATION_MODE !== 'false',
    },
  };
}
