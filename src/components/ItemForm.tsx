import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES, COLORS, OCCASIONS, PATTERNS, STATUSES, SUBCATS, type Item } from "@/lib/types";
import { ItemThumb } from "./ItemThumb";

const sel = "h-10 w-full rounded-md border border-input bg-card px-3 text-sm";
export function ItemForm({ initial, onSave, onCancel, saveLabel = "Enregistrer" }: { initial: Item; onSave: (i: Item) => void; onCancel?: () => void; saveLabel?: string }) {
  const [it, setIt] = useState<Item>(initial);
  const up = <K extends keyof Item>(k: K, v: Item[K]) => setIt((x) => ({ ...x, [k]: v }));
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSave({ ...it, name: it.name.trim() || `${it.subcategory || it.category} ${it.colorMain}` }); }}>
      <div className="mx-auto w-40"><ItemThumb item={it} /></div>
      <L t="Nom"><Input value={it.name} onChange={(e) => up("name", e.target.value)} placeholder="ex. Chemise blanche en lin" /></L>
      <div className="grid grid-cols-2 gap-3">
        <L t="Catégorie"><select className={sel} value={it.category} onChange={(e) => { const c = e.target.value as Item["category"]; setIt((x) => ({ ...x, category: c, subcategory: SUBCATS[c][0] ?? "" })); }}>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></L>
        <L t="Type"><select className={sel} value={it.subcategory} onChange={(e) => up("subcategory", e.target.value)}>
          {SUBCATS[it.category].map((s) => <option key={s}>{s}</option>)}</select></L>
        <L t="Couleur dominante"><select className={sel} value={it.colorMain} onChange={(e) => up("colorMain", e.target.value)}>
          {COLORS.map((c) => <option key={c}>{c}</option>)}</select></L>
        <L t="Motif"><select className={sel} value={it.pattern} onChange={(e) => up("pattern", e.target.value)}>
          {PATTERNS.map((c) => <option key={c}>{c}</option>)}</select></L>
        <L t="Matière apparente"><Input value={it.material} onChange={(e) => up("material", e.target.value)} placeholder="coton, lin, jean…" /></L>
        <L t="Coupe"><Input value={it.fit} onChange={(e) => up("fit", e.target.value)} placeholder="ample, droite, cintrée…" /></L>
        <L t="Statut"><select className={sel} value={it.status} onChange={(e) => up("status", e.target.value as Item["status"])}>
          {STATUSES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></L>
        <L t="Rangement"><Input value={it.location} onChange={(e) => up("location", e.target.value)} placeholder="Valise 1, grand sac…" /></L>
      </div>
      <L t="Couleurs secondaires">
        <Chips options={COLORS} value={it.colorsSecondary} onChange={(v) => up("colorsSecondary", v)} />
      </L>
      <L t="Occasions"><Chips options={OCCASIONS} value={it.occasion} onChange={(v) => up("occasion", v)} /></L>
      <div className="flex gap-2 pt-2">
        {onCancel && <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Annuler</Button>}
        <Button type="submit" className="flex-1">{saveLabel}</Button>
      </div>
    </form>
  );
}
function L({ t, children }: { t: string; children: React.ReactNode }) {
  return <label className="block space-y-1"><span className="text-xs font-medium text-muted-foreground">{t}</span>{children}</label>;
}
export function Chips({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o);
        return <button type="button" key={o} onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
          className={`rounded-full border px-2.5 py-1 text-xs ${on ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{o}</button>;
      })}
    </div>
  );
}
export function blankItem(id: string, photo?: string, color = "noir"): Item {
  return { id, name: "", category: "haut", subcategory: "T-shirt", colorMain: color, colorsSecondary: [], pattern: "uni", material: "", fit: "", occasion: ["cours"], status: "disponible", location: "", createdAt: Date.now(), ...(photo ? { photo } : {}) };
}
