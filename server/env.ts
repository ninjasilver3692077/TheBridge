export interface ServerEnv {
  mongodbUri: string;
  clientOrigins: string[];
  port: number;
}

export function readEnv(): ServerEnv {
  return {
    mongodbUri: process.env.MONGODB_URI ?? "",
    clientOrigins: (process.env.CLIENT_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    port: Number(process.env.PORT ?? 3000),
  };
}
