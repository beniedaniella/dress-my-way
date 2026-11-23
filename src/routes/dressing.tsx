import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Page } from "@/components/Page";
import { ItemThumb } from "@/components/ItemThumb";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/store";
import { CATEGORIES, COLORS, STATUSES } from "@/lib/types";

export const Route = createFileRoute("/dressing")({
  head: () => ({ meta: [
    { title: "Mon dressing — Dress My Way" },
    { name: "description", content: "Catalogue complet, recherche et filtres de vos vêtements." },
    { property: "og:title", content: "Mon dressing — Dress My Way" },
    { property: "og:description", content: "Retrouvez chaque pièce en quelques secondes." },
  ] }),
  component: Dressing,
});
const sel = "h-9 rounded-md border border-input bg-card px-2 text-xs";
function Dressing() {
  const { items, ready } = useApp();
  const [q, setQ] = useState(""), [cat, setCat] = useState(""), [col, setCol] = useState(""), [st, setSt] = useState("");
  const list = useMemo(() => items.filter((i) => {
    const hay = [i.name, i.subcategory, i.colorMain, ...i.colorsSecondary, i.pattern, i.material, i.fit, i.location, ...i.occasion].join(" ").toLowerCase();
    return (!q || hay.includes(q.toLowerCase())) && (!cat || i.category === cat) && (!col || i.colorMain === col || i.colorsSecondary.includes(col)) && (!st || i.status === st);
  }), [items, q, cat, col, st]);
  return (
    <Page title="Mon dressing" subtitle={ready ? `${items.length} pièce(s)` : "Chargement…"}>
      <div className="relative mb-3"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Rechercher (lin, cargo, valise 2…)" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <select aria-label="Catégorie" className={sel} value={cat} onChange={(e) => setCat(e.target.value)}><option value="">Catégorie</option>{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
        <select aria-label="Couleur" className={sel} value={col} onChange={(e) => setCol(e.target.value)}><option value="">Couleur</option>{COLORS.map((c) => <option key={c}>{c}</option>)}</select>
        <select aria-label="Statut" className={sel} value={st} onChange={(e) => setSt(e.target.value)}><option value="">Statut</option>{STATUSES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
      </div>
      {ready && items.length === 0 && (
        <div className="rounded-2xl border border-dashed p-8 text-center"><p className="mb-3 text-muted-foreground">Votre dressing est vide.</p><Link to="/ajouter" className="font-semibold text-primary underline">Ajouter mes premières pièces</Link></div>
      )}
      <div className="grid grid-cols-3 gap-3">
        {list.map((i) => (
          <Link key={i.id} to="/article/$id" params={{ id: i.id }} className="min-w-0">
            <div className="relative"><ItemThumb item={i} />
              {i.status !== "disponible" && <span className="absolute left-1 top-1 rounded-full bg-card/90 px-1.5 text-[10px]">{STATUSES.find((s) => s.value === i.status)?.label}</span>}</div>
            <p className="mt-1 truncate text-xs font-medium">{i.name}</p>
          </Link>
        ))}
      </div>
    </Page>
  );
}
