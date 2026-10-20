import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BackButton } from "@/components/back-button";
export const Route = createFileRoute("/_authenticated/area/financas")({
  validateSearch: (s: Record<string, unknown>) => ({
    mes:
      typeof s["mes"] === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(s["mes"])
        ? s["mes"]
        : undefined,
  }),
  component: FinanceLayout,
});
function FinanceLayout() {
  return (
    <div className="space-y-5">
      <BackButton />
      <Outlet />
    </div>
  );
}
