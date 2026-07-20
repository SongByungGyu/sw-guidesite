import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  GUILD_SLUG: z.string().min(1).default("conan"),
  ADMIN_ACCESS_KEY: z.string().min(8),
  SESSION_SECRET: z.string().min(32),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const serverEnv = serverEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  GUILD_SLUG: process.env.GUILD_SLUG,
  ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY,
  SESSION_SECRET: process.env.SESSION_SECRET,
  NODE_ENV: process.env.NODE_ENV,
});
