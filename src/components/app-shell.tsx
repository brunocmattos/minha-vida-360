import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { House, LogOut, Menu, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { AREAS, MEU_DIA } from "@/lib/areas";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LuisaChat } from "@/components/luisa-chat";
import { cn } from "@/lib/utils";

const itemCls =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
const activeCls = "bg-sidebar-accent text-sidebar-accent-foreground";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const Sun = MEU_DIA.icon;
  return (
    <nav className="flex flex-col gap-1">
      <Link to="/casa" onClick={onNavigate} className={itemCls} activeProps={{ className: activeCls }}>
        <House className="size-4" /> Minha Casa
      </Link>
      <Link to="/meu-dia" onClick={onNavigate} className={itemCls} activeProps={{ className: activeCls }}>
        <Sun className="size-4" /> {MEU_DIA.name}
      </Link>
      <div className="mt-3 mb-1 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Áreas</div>
      {AREAS.map((a) => (
        <Link key={a.slug} to="/area/$slug" params={{ slug: a.slug }} onClick={onNavigate}
          className={itemCls} activeProps={{ className: activeCls }}>
          <a.icon className="size-4" /> {a.short}
        </Link>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/casa" className="flex min-w-0 items-center gap-2">
      <span className="grid size-9 place-items-center rounded-md bg-secondary font-display text-base font-bold text-primary">360</span>
      <span className="font-display text-lg font-semibold">Minha Vida 360</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const logout = (
    <Button variant="ghost" onClick={signOut} className={cn(itemCls, "w-full")}>
      <LogOut className="size-4" /> Sair
    </Button>
  );

  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r bg-sidebar p-4 md:flex">
        <Brand />
        <NavList />
        <div className="mt-auto">{logout}</div>
      </aside>

      <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b bg-background/85 px-4 py-3 backdrop-blur md:hidden">
        <Brand />
        <Button variant="ghost" aria-label="Abrir menu" onClick={() => setOpen(true)} className="rounded-xl p-2 hover:bg-secondary">
          <Menu className="size-5" />
        </Button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <Button variant="ghost" aria-label="Fechar menu" className="absolute inset-0 bg-foreground/20" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-72 flex-col gap-4 overflow-y-auto bg-sidebar p-4 shadow-lift animate-in slide-in-from-right">
            <div className="flex justify-end">
              <Button variant="ghost" aria-label="Fechar menu" onClick={() => setOpen(false)} className="rounded-xl p-2 hover:bg-sidebar-accent">
                <X className="size-5" />
              </Button>
            </div>
            <NavList onNavigate={() => setOpen(false)} />
            <div className="mt-auto">{logout}</div>
          </div>
        </div>
      )}

      <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-6 md:px-8 md:py-10">{children}</main>
      <LuisaChat />
    </div>
  );
}
