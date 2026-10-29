// Todas as tabelas da usuária, pais antes dos filhos (ordem usada no export e no import).
export const TABLES = [
  "fin_categories",
  "fin_recurrences",
  "fin_entries",
  "fin_openings",
  "fin_opening_history",
  "fin_transfers",
  "fin_savings_goals",
  "fin_payslips",
  "fin_credit_records",
  "pet_profiles",
  "pet_care_records",
  "pet_contacts",
  "tasks",
  "task_completions",
  "diary_entries",
  "luisa_conversations",
  "luisa_messages",
];

// Mesma regra do app (src/routes/auth.tsx → usernameToEmail).
export const toEmail = (u) =>
  `${u
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")}@minhavida360.app`; // = LOGIN_EMAIL_DOMAIN em src/lib/brand.ts
