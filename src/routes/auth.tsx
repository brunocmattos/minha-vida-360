import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Minha Vida 360" },
      { name: "description", content: "Acesse seu espaço privado no Minha Vida 360." },
      { property: "og:title", content: "Entrar — Minha Vida 360" },
      { property: "og:description", content: "Acesse seu espaço privado no Minha Vida 360." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const inputCls =
  "w-full rounded-md border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring";

/** O nome de usuário é convertido num e-mail interno (o login exige e-mail). */
export function usernameToEmail(username: string) {
  return `${username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")}@minhavida360.app`;
}

function AuthPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/casa", replace: true });
    });
  }, [navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    setBusy(false);
    if (error) setError("Nome ou senha incorretos.");
    else navigate({ to: "/casa", replace: true });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-lg border bg-card p-7 shadow-lift">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 grid size-12 place-items-center rounded-md bg-secondary font-display text-lg font-bold text-primary">
            360
          </span>
          <h1 className="text-2xl font-semibold">Minha Vida 360</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Seu espaço acolhedor para organizar a vida.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <label htmlFor="auth-username" className="sr-only">
            Nome
          </label>
          <input
            id="auth-username"
            className={inputCls}
            required
            autoCapitalize="none"
            autoComplete="username"
            placeholder="Nome"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label htmlFor="auth-password" className="sr-only">
            Senha
          </label>
          <input
            id="auth-password"
            className={inputCls}
            type="password"
            required
            autoComplete="current-password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            disabled={busy}
            className="w-full rounded-md bg-primary py-3 text-sm font-bold text-primary-foreground shadow-soft transition hover:shadow-lift disabled:opacity-60"
          >
            {busy ? "Aguarde..." : "Entrar"}
          </Button>
        </form>
        {error && (
          <p role="alert" className="mt-4 text-center text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
