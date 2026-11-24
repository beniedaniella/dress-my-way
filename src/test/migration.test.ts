import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import { openDB } from "idb";
import { openAppDb } from "@/lib/db";
import { migrateV2, mapLegacyCategory, MIGRATION_KEY, BACKUP_KEY } from "@/lib/migrate";
import { taxonomySeed, OCCASION_SEED } from "@/lib/taxonomy-seed";
import type { Item, PlanDay } from "@/lib/types";

let n = 0;
const name = () => `t-${++n}-${Math.random()}`;
const mk = (id: string, category: Item["category"], subcategory: string): Item => ({ id, name: id, category, subcategory, colorMain: "noir", colorsSecondary: [], pattern: "uni", material: "", fit: "", occasion: ["cours"], status: "disponible", location: "Valise 1", createdAt: 1 });
const day = (date: string, ids: string[]): PlanDay => ({ date, outfit: { id: `o-${date}`, itemIds: ids, note: "n", source: "local" } });

/** Crée une base V1 exactement comme l'ancienne application. */
async function seedV1(db: string, items: Item[], plan: PlanDay[], profile?: object) {
  const d = await openDB(db, 1, { upgrade(x) { x.createObjectStore("items", { keyPath: "id" }); x.createObjectStore("plan", { keyPath: "date" }); x.createObjectStore("kv"); } });
  for (const i of items) await d.put("items", i);
  for (const p of plan) await d.put("plan", p);
  if (profile) await d.put("kv", profile, "profile");
  d.close();
}
const counts = async (d: Awaited<ReturnType<typeof openAppDb>>) => Object.fromEntries(await Promise.all(
  ["items", "plan", "taxonomy", "occasions", "outfits", "calendarEvents", "wearHistory", "drafts", "corrections"].map(async (s) => [s, await d.count(s)])));

describe("migration V2", () => {
  it("base neuve : taxonomie et occasions créées, aucun article", async () => {
    const d = await openAppDb(name());
    await migrateV2(d);
    const c = await counts(d);
    expect(c["taxonomy"]).toBe(taxonomySeed().length);
    expect(c["occasions"]).toBe(6);
    expect(c["items"]).toBe(0);
    expect(await d.count("taxonomy")).toBeGreaterThan(7);
  });

  it("T01 : base V1 existante — articles, profil et plan restent lisibles", async () => {
    const db = name();
    await seedV1(db, [mk("a", "haut", "Chemise"), mk("b", "accessoire", "Sac"), mk("c", "robe", "Robe pagne")], [day("2026-12-01", ["a"]), day("2026-12-02", ["a", "b"])], { excludeDresses: true, theme: "studio", mode: "sombre" });
    const d = await openAppDb(db);
    await migrateV2(d);
    const items = (await d.getAll("items")) as (Item & Record<string, unknown>)[];
    expect(items).toHaveLength(3);
    const a = items.find((i) => i.id === "a")!;
    expect(a.name).toBe("a"); expect(a.location).toBe("Valise 1"); expect(a.category).toBe("haut");
    expect(a["categoryId"]).toBe("cat:hauts"); expect(a["subcategoryId"]).toBe("sub:hauts--chemise"); expect(a["legacyCategory"]).toBe("haut");
    expect(items.find((i) => i.id === "b")!["categoryId"]).toBe("cat:sacs");
    expect(items.find((i) => i.id === "c")!["categoryId"]).toBe("cat:pieces-completes");
    expect(await d.count("plan")).toBe(2);
    const prof = await d.get("kv", "profile");
    expect(prof.theme).toBe("studio"); expect(prof.mode).toBe("sombre"); expect(prof.excludeDresses).toBe(true);
    expect(await d.get("kv", BACKUP_KEY)).toBeTruthy();
  });

  it("ancien plan : N jours → N tenues + N événements planifiés, 0 port", async () => {
    const db = name();
    await seedV1(db, [mk("a", "haut", "T-shirt")], [day("2026-12-01", ["a"]), day("2026-12-02", ["a"]), day("2026-12-03", ["a"])]);
    const d = await openAppDb(db);
    await migrateV2(d);
    expect(await d.count("outfits")).toBe(3);
    const ev = await d.getAll("calendarEvents");
    expect(ev).toHaveLength(3);
    expect(ev.every((e) => e.status === "planifie")).toBe(true);
    expect(await d.count("wearHistory")).toBe(0);
  });

  it("idempotente : deux passages donnent les mêmes nombres", async () => {
    const db = name();
    await seedV1(db, [mk("a", "veste", "Blazer")], [day("2026-12-01", ["a"])]);
    const d = await openAppDb(db);
    await migrateV2(d);
    const first = await counts(d);
    const second = await migrateV2(d);
    expect(second.alreadyDone).toBe(true);
    await d.delete("kv", MIGRATION_KEY); // même si le marqueur disparaît, aucun doublon
    const third = await migrateV2(d);
    expect(third.taxonomyAdded).toBe(0); expect(third.outfitsCreated).toBe(0);
    expect(await counts(d)).toEqual(first);
  });

  it("données partielles : sous-catégorie inconnue gardée en texte, profil absent", async () => {
    const db = name();
    await seedV1(db, [mk("x", "haut", "Kaba spécial")], []);
    const d = await openAppDb(db);
    await migrateV2(d);
    const x = await d.get("items", "x");
    expect(x.categoryId).toBe("cat:hauts"); expect(x.subcategoryId).toBeUndefined(); expect(x.legacySubcategory).toBe("Kaba spécial");
    expect(await d.get("kv", "profile")).toBeUndefined();
  });

  it("échec simulé : rien n'est écrit, migration non marquée", async () => {
    const db = name();
    await seedV1(db, [mk("a", "haut", "Chemise")], [day("2026-12-01", ["a"])]);
    const d = await openAppDb(db);
    await expect(migrateV2(d, { failAt: "items" })).rejects.toThrow();
    expect(await d.get("kv", MIGRATION_KEY)).toBeUndefined();
    expect(await d.count("taxonomy")).toBe(0);
    expect((await d.get("items", "a")).schemaVersion).toBeUndefined();
    expect(await d.count("plan")).toBe(1);
    const ok = await migrateV2(d); // nouvel essai réussi
    expect(ok.itemsUpgraded).toBe(1);
  });

  it("correspondance des accessoires selon le type", () => {
    expect(mapLegacyCategory({ category: "accessoire", subcategory: "Montre" }).categoryId).toBe("cat:bijoux");
    expect(mapLegacyCategory({ category: "accessoire", subcategory: "Ceinture" }).categoryId).toBe("cat:accessoires");
    expect(mapLegacyCategory({ category: "jupe", subcategory: "Jupe longue" }).familyId).toBe("fam:vetements");
    expect(OCCASION_SEED.map((o) => o.label)).toContain("stage / hôpital");
  });
});
