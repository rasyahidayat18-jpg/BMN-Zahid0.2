import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Inbox } from "lucide-react";

export const PageHeader = ({ title, description, actions, icon: Icon }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="hidden sm:flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

export const StatusPill = ({ label, className }) => (
  <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", className)}>
    {label}
  </span>
);

export const StatCard = ({ label, value, icon: Icon, tone = "primary", onClick, testId }) => {
  const tones = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
    info: "bg-sky-100 text-sky-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <Card
      data-testid={testId}
      onClick={onClick}
      className={cn("p-4 md:p-5 border transition-colors hover:border-primary/40", onClick && "cursor-pointer")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="font-heading text-2xl md:text-3xl font-semibold tracking-tight mt-1">{value}</p>
        </div>
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
          {Icon && <Icon className="h-5 w-5" />}
        </div>
      </div>
    </Card>
  );
};

export const Loading = ({ label = "Memuat data..." }) => (
  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
    <Loader2 className="h-6 w-6 animate-spin mb-3" />
    <p className="text-sm">{label}</p>
  </div>
);

export const EmptyState = ({ title = "Belum ada data", description, action, icon: Icon = Inbox }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mb-4">
      <Icon className="h-7 w-7" />
    </div>
    <h3 className="font-medium text-foreground">{title}</h3>
    {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
