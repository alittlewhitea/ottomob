export const appConfig = {
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  auth: {
    cookieName: process.env.AUTH_COOKIE_NAME ?? "ottomob_session",
    jwtSecret: process.env.AUTH_JWT_SECRET ?? "dev-only-change-me",
  },
  mysql: {
    host: process.env.MYSQL_HOST ?? "127.0.0.1",
    port: Number(process.env.MYSQL_PORT ?? 3306),
    database: process.env.MYSQL_DATABASE ?? "ottomob",
    user: process.env.MYSQL_USER ?? "root",
    password: process.env.MYSQL_PASSWORD ?? "",
  },
  amazingSmm: {
    apiUrl: process.env.AMAZINGSMM_API_URL ?? "https://amazingsmm.com/api/v2",
    apiKey: process.env.AMAZINGSMM_API_KEY ?? "",
    syncSecret: process.env.SERVICE_SYNC_SECRET ?? "",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ??
      `${process.env.APP_URL ?? "http://localhost:3000"}/api/auth/google/callback`,
  },
};
