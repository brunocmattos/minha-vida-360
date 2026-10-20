// Importa um JSON do export-data.mjs num Supabase NOVO, trocando o dono antigo pelo novo.
//
// Uso:  DATABASE_URL=<connection string do Supabase novo> node scripts/import-data.mjs <arquivo.json> <nome-de-login>
//   - A usuária já precisa existir no Supabase novo (crie no painel: Authentication > Add user).
//   - Mantém os ids originais, então as ligações entre tabelas continuam valendo.
//   - Desliga os gatilhos durante a importação (senão o histórico de aberturas duplica e as
//     datas de "atualizado em" viram a data de hoje) e religa no fim.
//   - Tudo numa transação: se qualquer coisa falhar, nada é gravado.
//   - Recusa se a usuária já tiver dados no banco novo (evita importar duas vezes).
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { TABLES, toEmail } from "./tables.mjs";

const [file, login] = process.argv.slice(2);
if (!file || !login || !process.env.DATABASE_URL) {
  console.error(
    "uso: DATABASE_URL=... node scripts/import-data.mjs <arquivo.json> <nome-de-login>",
  );
  process.exit(1);
}

const dump = JSON.parse(readFileSync(file, "utf8"));
const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });

// jsonb (contracheque, ação da Luísa) vai como texto JSON; o Postgres converte.
const toDb = (row) =>
  Object.fromEntries(
    Object.entries(row).map(([k, v]) => [
      k,
      v !== null && typeof v === "object" ? JSON.stringify(v) : v,
    ]),
  );

try {
  const [user] = await sql`select id from auth.users where email = ${toEmail(login)}`;
  if (!user) throw new Error(`Usuária ${toEmail(login)} não existe no banco novo. Crie antes.`);

  for (const t of TABLES) {
    const [{ n }] = await sql`select count(*)::int as n from ${sql(t)} where owner_id = ${user.id}`;
    if (n > 0) throw new Error(`${t} já tem ${n} linha(s) dessa usuária. Nada foi importado.`);
  }

  await sql.begin(async (tx) => {
    for (const t of TABLES) await tx`alter table ${tx(t)} disable trigger user`;
    for (const t of TABLES) {
      const rows = (dump.tables[t] ?? []).map((r) => toDb({ ...r, owner_id: user.id }));
      for (let i = 0; i < rows.length; i += 500) {
        await tx`insert into ${tx(t)} ${tx(rows.slice(i, i + 500))}`;
      }
      console.log(`${t.padEnd(22)} ${rows.length}`);
    }
    for (const t of TABLES) await tx`alter table ${tx(t)} enable trigger user`;
  });

  // Confere: o banco novo tem que ter exatamente o que veio no arquivo.
  let ok = true;
  for (const t of TABLES) {
    const [{ n }] = await sql`select count(*)::int as n from ${sql(t)} where owner_id = ${user.id}`;
    const expected = (dump.tables[t] ?? []).length;
    if (n !== expected) {
      ok = false;
      console.error(`DIFERENÇA em ${t}: arquivo ${expected}, banco ${n}`);
    }
  }
  console.log(ok ? "\nImportação conferida: contagens batem." : "\nATENÇÃO: contagens não batem.");
  process.exitCode = ok ? 0 : 1;
} finally {
  await sql.end();
}
