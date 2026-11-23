import { Link } from "@tanstack/react-router";
import { CalendarDays, Home, Plus, Shirt, Sparkles } from "lucide-react";

const tabs = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/dressing", label: "Dressing", icon: Shirt },
  { to: "/ajouter", label: "Ajouter", icon: Plus },
  { to: "/salon", label: "Stylistes", icon: Sparkles },
  { to: "/planning", label: "Planning", icon: CalendarDays },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg justify-around">
        {tabs.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} activeOptions={{ exact: to === "/" }}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground data-[status=active]:text-primary data-[status=active]:font-semibold">
            {to === "/ajouter" ? <span className="-mt-5 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg"><Icon className="h-6 w-6" /></span> : <Icon className="h-5 w-5" />}
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
