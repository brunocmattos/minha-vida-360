// Exporta TODOS os dados de uma usuária para um JSON, entrando com o login dela.
// O RLS garante que só vêm as linhas dela. Não precisa de chave de admin.
//
// Uso:  node scripts/export-data.mjs [pasta-de-saida]
//   - Lê SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY do ambiente ou do .env (hoje: o banco do Lovable).
//   - Pergunta nome e senha na hora (nada é salvo).
//   - Grava <pasta>/minha-vida-360-AAAA-MM-DD.json  (padrão: ../backups, FORA do repositório).
import { createClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline/promises";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { TABLES, toEmail } from "./tables.mjs";

const PAGE = 1000; // limite por requisição do Supabase

if (!process.env.SUPABASE_URL && !process.env.VITE_SUPABASE_URL && existsSync(".env"))
  process.loadEnvFile(".env");
const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key)
  throw new Error("Defina SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY (ou tenha um .env).");

async function ask() {
  // LOGIN_USER/LOGIN_PASSWORD só para teste automatizado contra banco local.
  if (process.env.LOGIN_USER && process.env.LOGIN_PASSWORD)
    return [process.env.LOGIN_USER, process.env.LOGIN_PASSWORD];
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const user = await rl.question("Nome de login: ");
  rl.close();
  const password = await askHidden("Senha: ");
  return [user, password];
}

function askHidden(prompt) {
  return new Promise((done) => {
    process.stdout.write(prompt);
    const stdin = process.stdin;
    stdin.setRawMode?.(true);
    stdin.resume();
    let s = "";
    stdin.on("data", function onData(buf) {
      for (const ch of buf.toString("utf8")) {
        if (ch === "\r" || ch === "\n") {
          stdin.setRawMode?.(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          return done(s);
        }
        if (ch === "\u0003") process.exit(130); // Ctrl+C
        s = ch === "\u007f" || ch === "\b" ? s.slice(0, -1) : s + ch;
      }
    });
  });
}

const [user, password] = await ask();
const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
  email: toEmail(user),
  password,
});
if (authError) throw new Error(`Login falhou: ${authError.message}`);

const out = {
  exported_at: new Date().toISOString(),
  source: new URL(url).host,
  owner_id: auth.user.id,
  email: auth.user.email,
  tables: {},
};
for (const table of TABLES) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  out.tables[table] = rows;
  console.log(`${table.padEnd(22)} ${rows.length}`);
}

const dir = resolve(process.argv[2] ?? "../backups");
mkdirSync(dir, { recursive: true });
const file = join(dir, `minha-vida-360-${out.exported_at.slice(0, 10)}.json`);
writeFileSync(file, JSON.stringify(out, null, 2));
console.log(`\nSalvo em ${file}`);
await supabase.auth.signOut();
