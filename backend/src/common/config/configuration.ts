/**
 * Configuration typée exposée via ConfigService.
 * Regroupe les variables d'environnement validées en objets exploitables.
 */
export const configuration = () => ({
  nodeEnv: process.env.NODE_ENV as 'development' | 'production' | 'test',
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    url: process.env.DATABASE_URL,
  },
});

export type AppConfig = ReturnType<typeof configuration>;
