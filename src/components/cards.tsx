import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SoftCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-lg border bg-card p-5 shadow-soft", className)}>{children}</div>
  );
}

export function SectionCard({
  icon: Icon,
  title,
  tone = "bg-lavender",
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  tone?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <SoftCard>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "grid size-9 place-items-center rounded-md text-secondary-foreground",
              tone,
            )}
          >
            <Icon className="size-4" />
          </span>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </SoftCard>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
      {children}
    </p>
  );
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  return (
    <div className="mb-6">
      {eyebrow && <p className="mb-1 text-sm font-semibold capitalize text-primary">{eyebrow}</p>}
      <h1 className="text-3xl font-semibold md:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 max-w-xl text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
