import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, RefreshCw, Search, Settings, Sparkles } from "lucide-react";
import { Page } from "@/components/Page";
import { OutfitStrip } from "@/components/ItemThumb";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { discoverySuggestion, generateOutfit } from "@/lib/rules";
import type { Outfit } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Dress My Way — Votre dressing et vos stylistes" },
    { name: "description", content: "Organisez vos valises, composez vos tenues et préparez vos 15 tenues de rentrée." },
    { property: "og:title", content: "Dress My Way — Votre dressing et vos stylistes" },
    { property: "og:description", content: "Organisez vos valises, composez vos tenues et préparez la rentrée." },
  ] }),
  component: Home,
});
function Home() {
  const { items, profile, ready } = useApp();
  const [o, setO] = useState<Outfit | null>(null);
  const avail = items.filter((i) => i.status === "disponible").length;
  return (
    <Page title="Bonjour 👋" subtitle="Qu'est-ce qu'on porte aujourd'hui ?" action={<Link to="/profil" aria-label="Profil" className="rounded-full border bg-card p-2"><Settings className="h-5 w-5" /></Link>}>
      <section className="mb-5 grid grid-cols-3 gap-2 text-center">
        {[["Pièces", items.length], ["Disponibles", avail], ["Au lavage", items.filter((i) => i.status === "lavage").length]].map(([l, n]) => (
          <div key={l} className="rounded-2xl bg-secondary p-3"><p className="font-display text-2xl">{ready ? n : "–"}</p><p className="text-[11px] text-muted-foreground">{l}</p></div>
        ))}
      </section>
      <section className="mb-5 rounded-3xl border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-xl">Tenue du jour</h2>
          <Button size="sm" variant="secondary" onClick={() => setO(generateOutfit(items, profile, { occasion: "cours" }))}><RefreshCw className="mr-1 h-4 w-4" />{o ? "Une autre" : "Proposer"}</Button></div>
        {o ? <><OutfitStrip ids={o.itemIds} items={items} /><p className="mt-3 text-sm text-muted-foreground">{o.note}</p></>
          : <p className="text-sm text-muted-foreground">{avail < 2 ? "Ajoutez au moins un haut et un bas disponibles." : "Touchez « Proposer » : composé hors-ligne à partir de vos vraies pièces."}</p>}
      </section>
      <section className="mb-5 rounded-3xl bg-accent p-4 text-accent-foreground">
        <div className="mb-1 flex items-center gap-2 text-sm font-semibold"><Search className="h-4 w-4" />Découverte progressive</div>
        <p className="text-sm">{discoverySuggestion(items)}</p>
        <Link to="/ajouter" className="mt-2 inline-block text-sm font-semibold underline">Photographier cette pièce</Link>
      </section>
      <div className="grid grid-cols-2 gap-3">
        <Link to="/planning" className="rounded-3xl bg-primary p-4 text-primary-foreground"><CalendarDays className="mb-2 h-6 w-6" /><p className="font-semibold leading-tight">Préparer mes 15 tenues de rentrée</p></Link>
        <Link to="/salon" className="rounded-3xl border bg-card p-4"><Sparkles className="mb-2 h-6 w-6 text-primary" /><p className="font-semibold leading-tight">Le salon des 3 stylistes</p></Link>
      </div>
    </Page>
  );
}
