import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Users } from "lucide-react";
import { Page } from "@/components/Page";
import { OutfitStrip } from "@/components/ItemThumb";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/lib/store";
import { generateOutfit, usable, validateIds, explain } from "@/lib/rules";
import { STYLISTS, STYLIST_IDS, type StylistId } from "@/lib/stylists";
import { askStylist } from "@/lib/stylist.functions";
import type { Item, Profile } from "@/lib/types";

export const Route = createFileRoute("/salon")({
  head: () => ({ meta: [
    { title: "Le salon des stylistes — Dress My Way" },
    { name: "description", content: "Élise, Maya et Clara vous conseillent avec les pièces de votre propre dressing." },
    { property: "og:title", content: "Le salon des stylistes — Dress My Way" },
    { property: "og:description", content: "Trois visions de style, uniquement avec vos vrais vêtements." },
  ] }),
  component: Salon,
});

interface Msg { role: "user" | "assistant"; content: string; itemIds?: string[]; meta?: string; stylist?: StylistId }

async function consult(stylist: StylistId, message: string, history: Msg[], items: Item[], profile: Profile, focus?: string): Promise<Msg> {
  const local = (why: string): Msg => {
    const o = generateOutfit(items, profile, focus ? { mustInclude: focus } : {});
    const parts = (o?.itemIds ?? []).map((id) => items.find((i) => i.id === id)!).filter(Boolean);
    return { role: "assistant", stylist, content: o ? `${explain(parts)}` : "Votre dressing ne contient pas encore assez de pièces disponibles pour composer une tenue.", itemIds: o?.itemIds ?? [], meta: `Moteur local hors-ligne · ${why}` };
  };
  if (typeof navigator !== "undefined" && !navigator.onLine) return local("pas de connexion");
  const pool = usable(items, profile);
  try {
    const r = await askStylist({ data: {
      stylist, excludeDresses: profile.excludeDresses,
      message: focus ? `${message}\n(Pièce à mettre en valeur : ${focus})` : message,
      history: history.slice(-8).map((h) => ({ role: h.role, content: h.content.slice(0, 3000) })),
      wardrobe: pool.slice(0, 400).map((i) => ({ id: i.id, d: `${i.name} — ${i.category}/${i.subcategory}, ${i.colorMain}${i.colorsSecondary.length ? " + " + i.colorsSecondary.join("/") : ""}, ${i.pattern}${i.material ? ", " + i.material : ""}${i.fit ? ", " + i.fit : ""}` })),
    } });
    if (!r.ok) return local("IA indisponible");
    const ids = validateIds(r.itemIds, items, profile);
    const rejected = r.itemIds.length - ids.length;
    return { role: "assistant", stylist, content: r.reply, itemIds: ids,
      meta: [r.relay ? `Relais assuré par ${STYLISTS[r.servedBy as StylistId].name}` : "", rejected > 0 ? `${rejected} pièce(s) non vérifiée(s) retirée(s)` : "", "Pièces vérifiées dans votre dressing ✓"].filter(Boolean).join(" · ") };
  } catch { return local("connexion instable"); }
}

function Salon() {
  const { items, profile } = useApp();
  const [tab, setTab] = useState<StylistId | "conseil">("elise");
  const [chats, setChats] = useState<Record<StylistId, Msg[]>>({ elise: [], maya: [], clara: [] });
  const [council, setCouncil] = useState<Msg[] | null>(null);
  const [text, setText] = useState(""), [busy, setBusy] = useState(false), [focus, setFocus] = useState("");
  const pool = usable(items, profile);

  async function send() {
    const msg = text.trim() || (tab === "conseil" ? "Propose-moi une tenue pour mes cours de demain." : "");
    if (!msg) return;
    setBusy(true); setText("");
    if (tab === "conseil") {
      setCouncil(null);
      const res = await Promise.all(STYLIST_IDS.map((s) => consult(s, msg, [], items, profile, focus || undefined)));
      setCouncil(res);
    } else {
      const s = tab, hist = chats[s], user: Msg = { role: "user", content: msg };
      setChats((c) => ({ ...c, [s]: [...hist, user] }));
      const a = await consult(s, msg, hist, items, profile, focus || undefined);
      setChats((c) => ({ ...c, [s]: [...c[s], a] }));
    }
    setBusy(false);
  }
  const Bubble = ({ m }: { m: Msg }) => m.role === "user"
    ? <div className="ml-10 rounded-2xl rounded-br-sm bg-primary p-3 text-sm text-primary-foreground">{m.content}</div>
    : <div className="mr-4 space-y-2 rounded-2xl rounded-bl-sm border bg-card p-3 text-sm">
        {m.stylist && tab === "conseil" && <p className="font-display text-base">{STYLISTS[m.stylist].name}</p>}
        <p className="whitespace-pre-wrap">{m.content}</p>
        {!!m.itemIds?.length && <OutfitStrip ids={m.itemIds} items={items} />}
        {m.meta && <p className="text-[11px] text-muted-foreground">{m.meta}</p>}
      </div>;

  const s = tab !== "conseil" ? STYLISTS[tab] : null;
  return (
    <Page title="Le salon" subtitle="Vos stylistes ne proposent que des pièces de votre dressing.">
      <div className="mb-4 grid grid-cols-4 gap-2">
        {STYLIST_IDS.map((id) => (
          <button key={id} onClick={() => setTab(id)} className={`rounded-2xl border p-2 text-center ${tab === id ? "border-primary bg-secondary" : "bg-card"}`}>
            <span className="mx-auto mb-1 grid h-9 w-9 place-items-center rounded-full bg-primary font-display text-primary-foreground">{STYLISTS[id].emoji}</span>
            <span className="block text-xs font-semibold">{STYLISTS[id].name}</span>
          </button>
        ))}
        <button onClick={() => setTab("conseil")} className={`rounded-2xl border p-2 text-center ${tab === "conseil" ? "border-primary bg-secondary" : "bg-card"}`}>
          <span className="mx-auto mb-1 grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground"><Users className="h-5 w-5" /></span>
          <span className="block text-xs font-semibold">Conseil</span>
        </button>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">{s ? `${s.tagline} · ${s.brain}` : "Conseil de style : les 3 stylistes répondent en parallèle pour comparer leurs visions."}</p>
      <select aria-label="Pièce à mettre en valeur" className="mb-3 h-10 w-full rounded-md border border-input bg-card px-3 text-sm" value={focus} onChange={(e) => setFocus(e.target.value)}>
        <option value="">Aucune pièce imposée</option>
        {pool.map((i) => <option key={i.id} value={i.id}>Mettre en valeur : {i.name}</option>)}
      </select>
      <div className="mb-3 space-y-3">
        {tab === "conseil" ? council?.map((m, k) => <Bubble key={k} m={m} />) : chats[tab].map((m, k) => <Bubble key={k} m={m} />)}
        {busy && <p className="animate-pulse text-sm text-muted-foreground">{tab === "conseil" ? "Les 3 stylistes réfléchissent…" : `${s?.name} réfléchit…`}</p>}
      </div>
      <div className="sticky bottom-20 flex gap-2 rounded-2xl border bg-card p-2 shadow-lg">
        <Textarea rows={1} className="min-h-10 resize-none border-0 shadow-none focus-visible:ring-0" placeholder={tab === "conseil" ? "Ex. une tenue pour le stage de lundi" : `Écrire à ${s?.name}…`} value={text} onChange={(e) => setText(e.target.value)} />
        <Button size="icon" disabled={busy} onClick={send} aria-label="Envoyer"><Send className="h-4 w-4" /></Button>
      </div>
    </Page>
  );
}
