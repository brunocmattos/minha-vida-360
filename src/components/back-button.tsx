import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

/** Volta à tela anterior do app; sem histórico interno, vai para /meu-dia. */
export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (router.history.canGoBack()) router.history.back();
        else router.navigate({ to: "/meu-dia" });
      }}
      className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary"
    >
      <ArrowLeft className="size-4" /> Voltar
    </button>
  );
}

/** Confirma descarte quando há alterações não salvas. */
export function confirmDiscard(dirty: boolean) {
  return !dirty || window.confirm("Descartar as alterações não salvas?");
}

/** Confirma a exclusão de um item; `noun` opcional vem antes do nome (ex.: "a tarefa"). */
export function confirmDelete(label: string, noun = "") {
  return window.confirm(`Excluir ${noun ? `${noun} ` : ""}“${label}”? Isso não pode ser desfeito.`);
}
