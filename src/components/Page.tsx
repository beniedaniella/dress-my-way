import type { ReactNode } from "react";
export function Page({ title, subtitle, children, action }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <main className="mx-auto max-w-lg px-4 pb-28 pt-6">
      <header className="mb-5 flex items-end justify-between gap-3">
        <div><h1 className="text-3xl font-semibold">{title}</h1>{subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}</div>
        {action}
      </header>
      {children}
    </main>
  );
}
