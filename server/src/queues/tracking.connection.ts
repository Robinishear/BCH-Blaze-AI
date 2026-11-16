import { envVars } from "../app/config/env";

export const hasRedis = () => Boolean(envVars.REDIS_URL?.trim());

const base = () => {
  const u = new URL(envVars.REDIS_URL);
  return {
    host: u.hostname,
    port: Number(u.port || 6379),
    username: u.username ? decodeURIComponent(u.username) : undefined,
    password: u.password ? decodeURIComponent(u.password) : undefined,
    db: u.pathname.length > 1 ? Number(u.pathname.slice(1)) : undefined,
    ...(u.protocol === "rediss:" ? { tls: {} } : {}),
  };
};

export const queueConnection = () => ({ ...base(), enableOfflineQueue: false });

export const workerConnection = () => ({ ...base(), maxRetriesPerRequest: null });