// Dev contra o Supabase LOCAL (npx supabase start), sem tocar no .env real.
// Uso: node scripts/local-supabase.mjs seed  -> cria o usuário de teste (idempotente)
//      node scripts/local-supabase.mjs dev   -> sobe o vite apontando pro banco local
// As chaves abaixo são as padrões de demonstração do Supabase CLI (iguais em qualquer máquina).
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const API_URL = "http://127.0.0.1:54321";
const PUBLISHABLE_KEY = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
const SECRET_KEY = "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz";

// Login do app: nome "teste" vira teste@minhavida360.app (ver usernameToEmail em src/routes/auth.tsx)
export const TEST_USER = { username: "teste", email: "teste@minhavida360.app", password: "teste-local-360" };

const cmd = process.argv[2];

if (cmd === "seed") {
  const admin = createClient(API_URL, SECRET_KEY, { auth: { persistSession: false } });
  const { error } = await admin.auth.admin.createUser({
    email: TEST_USER.email,
    password: TEST_USER.password,
    email_confirm: true,
  });
  if (error && !/already/i.test(error.message)) throw error;
  console.log(error ? "usuário de teste já existe" : "usuário de teste criado");
} else if (cmd === "dev") {
  // Variáveis já presentes no processo têm prioridade sobre o .env (Vite e dotenv não sobrescrevem).
  const env = {
    ...process.env,
    VITE_SUPABASE_URL: API_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE_KEY,
    SUPABASE_URL: API_URL,
    SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE_KEY,
  };
  const cwd = fileURLToPath(new URL("..", import.meta.url));
  spawn("npx", ["vite", "dev"], { cwd, env, stdio: "inherit", shell: true }).on("exit", (c) => process.exit(c ?? 0));
} else {
  console.error("uso: node scripts/local-supabase.mjs <seed|dev>");
  process.exit(1);
}
