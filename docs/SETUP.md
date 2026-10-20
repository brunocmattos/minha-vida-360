# Colocar no ar — passo a passo

O código já está pronto para Vercel + Supabase. O que falta precisa de **conta** ou **senha** de vocês,
por isso não dá para automatizar. ~30 minutos no total. Todos os comandos rodam dentro da pasta `app/`.

> O Lovable continua sendo a única cópia dos dados até o passo 4 terminar. Não apague nada lá antes.

---

## 1. Exportar os dados do Lovable (2 min · precisa da senha da Tayane)

```bash
node scripts/export-data.mjs
```

Pede o **nome de login** e a **senha** dela (a senha não aparece nem fica salva). Grava
`../backups/minha-vida-360-AAAA-MM-DD.json` — **fora** do repositório, nunca commitar esse arquivo.
A lista impressa mostra quantas linhas vieram de cada tabela: guarde para conferir no passo 4.
O e-mail interno que aparece no arquivo (ex.: `tayane@minhavida360.app`) é o login dela.

## 2. Criar o Supabase (5 min)

1. [supabase.com](https://supabase.com) → **New project** · nome `minha-vida-360` · região
   **South America (São Paulo)** · plano Free · anote a senha do banco.
2. **Authentication → Sign In / Providers** → desligue **Allow new users to sign up**.
3. **Authentication → Users → Add user → Create new user**: e-mail = o login do passo 1
   (`<nome>@minhavida360.app`), senha forte para ela, marque **Auto Confirm User**.
4. Anote três coisas:
   - **Project URL** e **Publishable key** (Project Settings → API Keys)
   - **Connection string → Session pooler** (botão **Connect** no topo), com a senha do banco no lugar de `[YOUR-PASSWORD]`

## 3. Criar as tabelas e importar os dados (2 min)

```bash
DATABASE_URL="<connection string do passo 2>" node node_modules/drizzle-kit/bin.cjs migrate
DATABASE_URL="<connection string do passo 2>" node scripts/import-data.mjs ../backups/minha-vida-360-AAAA-MM-DD.json <nome-de-login>
```

O import troca o dono dos dados pela usuária nova, mantém as datas originais e confere as contagens
no fim ("Importação conferida: contagens batem."). Se algo falhar, nada é gravado; se rodar duas
vezes, ele recusa.

## 4. GitHub (1 min)

O repositório já existe e está atualizado: **[brunooutcore/minha-vida-360](https://github.com/brunooutcore/minha-vida-360)** (privado).
Falta só ligar o backup: **Settings → Secrets and variables → Actions → New repository secret** →
nome `DATABASE_URL`, valor = a connection string do passo 2. A partir daí roda sozinho **a cada 3 dias**
(aba Actions → backup; dá para rodar na hora com **Run workflow**). Até cadastrar o segredo, a rotina
aparece como falha — é o aviso de que ainda não há backup.

## 5. Vercel (5 min)

[vercel.com](https://vercel.com) → **Add New → Project** → importe o repositório. Não precisa mudar
nenhuma configuração de build. Antes de clicar **Deploy**, abra **Environment Variables** e cadastre:

| Nome                            | Valor               |
| ------------------------------- | ------------------- |
| `VITE_SUPABASE_URL`             | Project URL         |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key     |
| `SUPABASE_URL`                  | Project URL         |
| `SUPABASE_PUBLISHABLE_KEY`      | Publishable key     |
| `LLM_API_KEY`                   | (opcional, passo 6) |

**Não** coloque a service role / secret key do Supabase — o app não usa.

Aí sim, **Deploy**. O endereço `*.vercel.app` é o app dela.

## 6. Luísa (opcional, 5 min)

1. [platform.deepseek.com](https://platform.deepseek.com) → crie a conta, coloque um crédito pequeno
   (US$ 2 dura meses no uso dela) → **API Keys → Create**.
2. Na Vercel: variável `LLM_API_KEY` = a chave → **Redeploy**.
   Para trocar de provedor depois (OpenAI, Gemini…): `LLM_BASE_URL` e `LLM_MODEL`. Ver docs/SUGESTOES.md §1.

## 7. Conferir com ela, no celular

- Entrar com o nome e a senha nova.
- Finanças do mês batendo com o que ela via no Lovable; Meus Filhos com as fotos; diário; tarefas.
- Opcional: no celular, "Adicionar à tela inicial" para abrir como app.

Só depois disso parar de usar o Lovable.
