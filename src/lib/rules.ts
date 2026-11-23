import type { Item, Outfit, PlanDay, Profile } from "./types";

const NEUTRALS = new Set(["noir", "blanc", "crème", "beige", "camel", "gris", "bleu marine", "denim", "marron", "kaki"]);
// Position sur la roue chromatique (degrés)
const HUE: Record<string, number> = {
  rouge: 0, bordeaux: 350, rose: 330, terracotta: 15, orange: 30, moutarde: 45, jaune: 55, "vert olive": 80,
  vert: 120, "bleu ciel": 200, bleu: 220, violet: 280, lavande: 265,
};

/** Score d'harmonie entre deux couleurs (0 à 3). */
export function colorHarmony(a: string, b: string): number {
  if (NEUTRALS.has(a) || NEUTRALS.has(b)) return 3;
  if (a === b) return 2; // monochrome
  const ha = HUE[a], hb = HUE[b];
  if (ha === undefined || hb === undefined) return 1;
  const d = Math.min(Math.abs(ha - hb), 360 - Math.abs(ha - hb));
  if (d <= 40) return 2.5; // analogues
  if (d >= 150) return 2.2; // complémentaires
  if (d >= 110 && d < 150) return 1.8; // triadiques
  return 0.5;
}

export function isAllowed(i: Item, p: Pick<Profile, "excludeDresses">) {
  if (p.excludeDresses && (i.category === "robe" || i.category === "jupe")) return false;
  return true;
}
export const usable = (items: Item[], p: Pick<Profile, "excludeDresses">) =>
  items.filter((i) => i.status === "disponible" && isAllowed(i, p));

/** Score d'une tenue : harmonie des couleurs + règles de silhouette. */
export function scoreOutfit(parts: Item[]): number {
  let s = 0, n = 0;
  for (let i = 0; i < parts.length; i++)
    for (let j = i + 1; j < parts.length; j++) { s += colorHarmony(parts[i]!.colorMain, parts[j]!.colorMain); n++; }
  let score = n ? s / n : 2;
  const loud = parts.filter((p) => p.pattern !== "uni" && p.pattern !== "texturé").length;
  if (loud > 1) score -= 1; // un seul imprimé fort
  const bas = parts.find((p) => p.category === "bas");
  const haut = parts.find((p) => p.category === "haut");
  const ample = (x?: Item) => !!x && /ample|large|oversize|cargo|pinces|wide/i.test(x.fit + " " + x.subcategory);
  if (ample(bas) && ample(haut)) score -= 0.5; // équilibrer les volumes
  return score;
}

function rng(seed: number) {
  return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
}
const pick = <T,>(arr: T[], r: () => number) => arr[Math.floor(r() * arr.length)];

export interface GenOptions { avoidTops?: Set<string>; avoidCombos?: Set<string>; bottomUse?: Map<string, number>; maxBottomUse?: number; occasion?: string; seed?: number; mustInclude?: string; }

/** Moteur local : compose une tenue uniquement à partir d'articles réels. */
export function generateOutfit(items: Item[], profile: Pick<Profile, "excludeDresses">, o: GenOptions = {}): Outfit | null {
  const pool = usable(items, profile);
  const by = (c: string) => pool.filter((i) => i.category === c);
  const r = rng(o.seed ?? Date.now());
  const tops = by("haut"), bottoms = by("bas"), dresses = [...by("robe")];
  const skirts = by("jupe");
  const allBottoms = [...bottoms, ...skirts];
  let best: { parts: Item[]; score: number } | null = null;
  for (let t = 0; t < 60; t++) {
    let parts: Item[] = [];
    const useDress = dresses.length > 0 && (tops.length === 0 || r() < 0.15);
    if (useDress) parts.push(pick(dresses, r)!);
    else {
      const topC = tops.filter((x) => !o.avoidTops?.has(x.id));
      const botC = allBottoms.filter((x) => (o.bottomUse?.get(x.id) ?? 0) < (o.maxBottomUse ?? Infinity));
      const top = pick(topC.length ? topC : tops, r), bot = pick(botC.length ? botC : allBottoms, r);
      if (!top || !bot) continue;
      if (o.avoidCombos?.has(top.id + "|" + bot.id)) continue;
      parts = [top, bot];
    }
    const veste = by("veste"); if (veste.length && r() < 0.6) parts.push(pick(veste, r)!);
    const shoes = by("chaussures"); if (shoes.length) parts.push(pick(shoes, r)!);
    const acc = by("accessoire"); if (acc.length && r() < 0.7) parts.push(pick(acc, r)!);
    if (o.mustInclude) {
      const m = pool.find((x) => x.id === o.mustInclude);
      if (m) { parts = parts.filter((p) => !sameSlot(p, m)); parts.push(m); }
    }
    let score = scoreOutfit(parts) + r() * 0.3;
    if (o.occasion) score += parts.filter((p) => p.occasion.includes(o.occasion!)).length * 0.2;
    if (!best || score > best.score) best = { parts, score };
  }
  if (!best) return null;
  return { id: crypto.randomUUID().slice(0, 8), itemIds: best.parts.map((p) => p.id), note: explain(best.parts), source: "Moteur local" };
}
function sameSlot(a: Item, b: Item) {
  const slot = (c: string) => (c === "robe" ? "haut" : c === "jupe" ? "bas" : c);
  if (b.category === "robe") return a.category === "haut" || a.category === "bas" || a.category === "jupe" || a.category === "robe";
  return slot(a.category) === slot(b.category);
}
export function explain(parts: Item[]): string {
  const cols = [...new Set(parts.map((p) => p.colorMain))];
  const neutral = cols.filter((c) => NEUTRALS.has(c));
  const base = neutral.length ? `Base neutre (${neutral.join(", ")})` : "Accord de couleurs sur la roue chromatique";
  const accent = cols.filter((c) => !NEUTRALS.has(c));
  return `${base}${accent.length ? ` relevée par ${accent.join(" et ")}` : ""}. Un seul point fort visuel pour une silhouette équilibrée.`;
}

/** 15 jours ouvrés à partir du prochain lundi (ou de la date donnée). */
export function schoolDays(start?: Date): string[] {
  const d = start ? new Date(start) : new Date();
  if (!start) { const add = (8 - d.getDay()) % 7 || 7; d.setDate(d.getDate() + add); }
  const out: string[] = [];
  while (out.length < 15) {
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function planRentree(items: Item[], profile: Pick<Profile, "excludeDresses">, start?: Date, seed = Date.now()): PlanDay[] {
  const days = schoolDays(start);
  const pool = usable(items, profile);
  const nBottoms = pool.filter((i) => i.category === "bas" || i.category === "jupe").length || 1;
  const maxBottomUse = Math.ceil(15 / nBottoms) + 1;
  const combos = new Set<string>(), bottomUse = new Map<string, number>(), recentTops: string[] = [];
  const out: PlanDay[] = [];
  days.forEach((date, k) => {
    const o0 = generateOutfit(items, profile, { avoidCombos: combos, avoidTops: new Set(recentTops.slice(-4)), bottomUse, maxBottomUse, occasion: "cours", seed: seed + k * 7919 });
    // Petit dressing : toutes les combinaisons haut+bas sont épuisées → on autorise
    // la répétition en variant veste/chaussures/accessoires.
    const o2 = o0 ?? generateOutfit(items, profile, { avoidTops: new Set(recentTops.slice(-2)), occasion: "cours", seed: seed + k * 7919 });
    if (!o2) return;
    const o = o2;
    const [a, b] = o.itemIds;
    combos.add(a + "|" + b);
    const bot = pool.find((i) => o.itemIds.includes(i.id) && (i.category === "bas" || i.category === "jupe"));
    if (bot) bottomUse.set(bot.id, (bottomUse.get(bot.id) ?? 0) + 1);
    const top = pool.find((i) => o.itemIds.includes(i.id) && i.category === "haut");
    if (top) recentTops.push(top.id);
    out.push({ date, outfit: o });
  });
  return out;
}

/** Règle de vérité : ne garde que des identifiants existants et disponibles. */
export function validateIds(ids: unknown, items: Item[], profile: Pick<Profile, "excludeDresses">): string[] {
  if (!Array.isArray(ids)) return [];
  const ok = new Map(usable(items, profile).map((i) => [i.id, i]));
  return [...new Set(ids.filter((x): x is string => typeof x === "string" && ok.has(x)))];
}

/** Mode A : quelle pièce chercher dans les valises pour compléter le dressing. */
export function discoverySuggestion(items: Item[]): string {
  const count = (c: string) => items.filter((i) => i.category === c).length;
  if (count("bas") === 0) return "Commencez par un bas polyvalent : votre pantalon à pinces ou votre jean préféré.";
  if (count("haut") < 2) return "Cherchez deux hauts neutres (chemise blanche, t-shirt crème) : ils iront avec presque tout.";
  if (count("chaussures") === 0) return "Photographiez vos chaussures du quotidien (baskets ou mocassins confortables).";
  if (count("veste") === 0) return "Ajoutez une veste ou un cardigan léger pour les amphis climatisés.";
  const cols = new Set(items.map((i) => i.colorMain));
  if (![...cols].some((c) => !NEUTRALS.has(c))) return "Votre dressing est très neutre : cherchez une pièce colorée ou un wax pour une touche afro-chic.";
  if (count("accessoire") === 0) return "Ajoutez un accessoire (ceinture, foulard, sac) pour varier vos tenues sans effort.";
  if (count("bas") < 3) return "Un deuxième ou troisième bas (cargo, ample) multipliera vos combinaisons.";
  return "Votre base est solide ! Ajoutez au fil de l'eau les pièces que vous sortez des valises.";
}
