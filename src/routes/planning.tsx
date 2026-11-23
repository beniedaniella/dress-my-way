import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RefreshCw, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Page } from "@/components/Page";
import { OutfitStrip } from "@/components/ItemThumb";
import { Button } from "@/components/ui/button";
import { listPlan, savePlan, savePlanDay } from "@/lib/db";
import { generateOutfit, planRentree } from "@/lib/rules";
import { useApp } from "@/lib/store";
import type { PlanDay } from "@/lib/types";

export const Route = createFileRoute("/planning")({
  head: () => ({ meta: [
    { title: "Planning de rentrée — Dress My Way" },
    { name: "description", content: "15 tenues variées pour vos 3 premières semaines de cours." },
    { property: "og:title", content: "Planning de rentrée — Dress My Way" },
    { property: "og:description", content: "15 tenues variées pour 3 semaines de cours." },
  ] }),
  component: Planning,
});
const fmt = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
function Planning() {
  const { items, profile } = useApp();
  const [plan, setPlan] = useState<PlanDay[]>([]);
  const [start, setStart] = useState("");
  useEffect(() => { void listPlan().then(setPlan); }, []);
  const tops = items.filter((i) => i.status === "disponible" && i.category === "haut").length;
  const bottoms = items.filter((i) => i.status === "disponible" && (i.category === "bas" || (!profile.excludeDresses && i.category === "jupe"))).length;

  async function gen() {
    const p = planRentree(items, profile, start ? new Date(start + "T12:00:00") : undefined);
    if (!p.length) { toast.error("Ajoutez des hauts et des bas disponibles d'abord."); return; }
    await savePlan(p); setPlan(p); toast.success(`${p.length} tenues préparées !`);
  }
  async function replace(day: PlanDay) {
    const used = new Set(plan.filter((d) => d.date !== day.date).map((d) => d.outfit.itemIds.slice(0, 2).join("|")));
    const o = generateOutfit(items, profile, { avoidCombos: used, occasion: "cours", seed: Date.now() });
    if (!o) return;
    const nd = { ...day, outfit: o }; await savePlanDay(nd);
    setPlan((p) => p.map((d) => (d.date === day.date ? nd : d)));
  }
  // Signale les tenues contenant une pièce devenue indisponible (lavage, réparation…)
  const unavailable = (d: PlanDay) => d.outfit.itemIds.some((id) => { const i = items.find((x) => x.id === id); return !i || i.status !== "disponible"; });
  return (
    <Page title="Rentrée" subtitle="3 semaines, 15 jours de cours, 15 tenues.">
      <div className="mb-5 space-y-3 rounded-3xl border bg-card p-4">
        <label className="block text-sm">Premier jour de cours (facultatif)
          <input type="date" className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3" value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <Button className="h-12 w-full text-base" onClick={gen}><Wand2 className="mr-2 h-5 w-5" />Préparer mes 15 tenues de rentrée</Button>
        <p className="text-xs text-muted-foreground">{tops} haut(s) · {bottoms} bas disponibles. Les bas sont réutilisés de façon réaliste, jamais avec le même haut. Pièces au lavage exclues.</p>
      </div>
      <div className="space-y-3">
        {plan.map((d, k) => (
          <article key={d.date} className={`rounded-3xl border bg-card p-4 ${unavailable(d) ? "border-destructive" : ""}`}>
            <div className="mb-3 flex items-center justify-between">
              <div><p className="text-[11px] uppercase tracking-wide text-muted-foreground">Semaine {Math.floor(k / 5) + 1} · Jour {k + 1}</p><h3 className="text-lg capitalize">{fmt(d.date)}</h3></div>
              <Button size="sm" variant="secondary" onClick={() => replace(d)}><RefreshCw className="mr-1 h-4 w-4" />Remplacer</Button>
            </div>
            <OutfitStrip ids={d.outfit.itemIds} items={items} />
            {unavailable(d) && <p className="mt-2 text-xs text-destructive">Une pièce n'est plus disponible : touchez « Remplacer ».</p>}
          </article>
        ))}
      </div>
    </Page>
  );
}
