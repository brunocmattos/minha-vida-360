/** Nome do app num lugar só: trocar aqui troca títulos, cabeçalho, login e o texto da Luísa. */
export const APP_NAME = "comtay";
/** Letra do selo (cabeçalho, login e ícone do app instalado: public/icons). */
export const APP_MARK = "c";

/** Título de página no padrão "Finanças — comtay". */
export const pageTitle = (page?: string) => (page ? `${page} — ${APP_NAME}` : APP_NAME);

/**
 * Domínio do e-mail interno do login por nome ("tayane" → tayane@minhavida360.app).
 * NÃO trocar junto com o nome: é o login já gravado no Supabase dela. Só muda quando o login
 * passar a ser por e-mail real (ROADMAP, Fase 1). Repetido em scripts/tables.mjs.
 */
export const LOGIN_EMAIL_DOMAIN = "minhavida360.app";
