import type { IDBPDatabase } from "idb";
import type { Item as ItemV1, PlanDay } from "./types";
import type { CalendarEvent, Item, Outfit, TaxonomyNode, UserProfile } from "./types-v2";
import { OCCASION_SEED, slug, subId, taxonomySeed } from "./taxonomy-seed";

export const MIGRATION_KEY = "migration:v2";
export const BACKUP_KEY = "backup:pre-v2";
const STORES = ["items", "plan", "kv", "taxonomy", "drafts", "outfits", "calendarEvents", "wearHistory", "corrections", "occasions"] as const;

/** Correspondance V1 → identifiants V2. Le texte d'origine est toujours conservé. */
export function mapLegacyCategory(it: Pick<ItemV1, "category" | "subcategory">): { familyId: string; categoryId: string; subcategoryId?: string } {
  const s = slug(it.subcategory || "");
  let cat: string;
  switch (it.category) {
    case "haut": cat = "hauts"; break;
    case "bas": cat = "bas"; break;
    case "jupe": cat = "jupes"; break;
    case "robe": cat = "pieces-completes"; break;
    case "veste": cat = "couches"; break;
    case "chaussures": cat = "chaussures"; break;
    case "accessoire": cat = s === "sac" ? "sacs" : s === "bijou" || s === "montre" ? "bijoux" : "accessoires"; break;
    default: cat = "divers";
  }
  const fam = ["hauts", "bas", "jupes", "pieces-completes", "couches"].includes(cat) ? "vetements" : cat === "coiffures" ? "cheveux" : cat;
  const known = new Set(taxonomySeed().map((n) => n.id));
  const sid = `sub:${subId(cat, it.subcategory || "")}`;
  return { familyId: `fam:${fam}`, categoryId: `cat:${cat}`, ...(s && known.has(sid) ? { subcategoryId: sid } : {}) };
}

export interface MigrationReport { alreadyDone: boolean; taxonomyAdded: number; occasionsAdded: number; itemsUpgraded: number; outfitsCreated: number; eventsCreated: number }

/** Migration V2 idempotente, dans une seule transaction : en cas d'erreur, rien n'est écrit. */
export async function migrateV2(d: IDBPDatabase, opts: { failAt?: string } = {}): Promise<MigrationReport> {
  const r: MigrationReport = { alreadyDone: false, taxonomyAdded: 0, occasionsAdded: 0, itemsUpgraded: 0, outfitsCreated: 0, eventsCreated: 0 };
  const tx = d.transaction([...STORES], "readwrite");
  const st = (n: (typeof STORES)[number]) => tx.objectStore(n);
  try {
    if (await st("kv").get(MIGRATION_KEY)) { await tx.done; return { ...r, alreadyDone: true }; }
    const items = (await st("items").getAll()) as Item[];
    const plan = (await st("plan").getAll()) as PlanDay[];
    const profile = (await st("kv").get("profile")) as UserProfile | undefined;
    // 1. Sauvegarde de secours (jamais écrasée si elle existe déjà).
    if (!(await st("kv").get(BACKUP_KEY))) await st("kv").put({ at: new Date().toISOString(), items, plan, profile: profile ?? null }, BACKUP_KEY);
    if (opts.failAt === "backup") throw new Error("échec simulé");
    // 2-3. Taxonomie et occasions : seulement les identifiants absents.
    for (const n of taxonomySeed()) if (!(await st("taxonomy").get(n.id))) { await st("taxonomy").put(n as TaxonomyNode); r.taxonomyAdded++; }
    for (const o of OCCASION_SEED) if (!(await st("occasions").get(o.id))) { await st("occasions").put(o); r.occasionsAdded++; }
    if (opts.failAt === "taxonomy") throw new Error("échec simulé");
    // 4. Articles : enrichissement, aucun champ V1 retiré.
    for (const it of items) {
      if (it.schemaVersion === 2) continue;
      const m = mapLegacyCategory(it);
      await st("items").put({ ...it, ...m, schemaVersion: 2, legacyCategory: it.category, legacySubcategory: it.subcategory, archived: it.archived ?? false, favorite: it.favorite ?? false, wearCount: it.wearCount ?? 0 } satisfies Item);
      r.itemsUpgraded++;
    }
    if (opts.failAt === "items") throw new Error("échec simulé");
    // 5. Ancien plan → tenues + événements planifiés. Jamais d'historique porté.
    for (const day of plan) {
      const oid = `out:plan-${day.date}`, eid = `evt:plan-${day.date}`;
      if (!(await st("outfits").get(oid))) {
        const now = Date.now();
        await st("outfits").put({ id: oid, name: `Tenue du ${day.date}`, itemIds: day.outfit.itemIds, note: day.outfit.note, source: day.outfit.source, favorite: false, archived: false, occasionId: "occ:cours", createdAt: now, updatedAt: now, legacyPlanDate: day.date } satisfies Outfit);
        r.outfitsCreated++;
      }
      if (!(await st("calendarEvents").get(eid))) {
        await st("calendarEvents").put({ id: eid, date: day.date, outfitId: oid, occasionId: "occ:cours", status: "planifie", createdAt: Date.now() } satisfies CalendarEvent);
        r.eventsCreated++;
      }
    }
    // 6. Profil : champs optionnels seulement s'il existe.
    if (profile && profile.schemaVersion !== 2) {
      await st("kv").put({ ...profile, schemaVersion: 2, body: profile.body ?? {}, representation: profile.representation ?? { mode: "aucun" } } satisfies UserProfile, "profile");
    }
    await st("kv").put({ at: new Date().toISOString(), ...r }, MIGRATION_KEY);
    await tx.done;
    return r;
  } catch (e) {
    try { tx.abort(); } catch { /* déjà terminée */ }
    await tx.done.catch(() => {});
    throw e;
  }
}
