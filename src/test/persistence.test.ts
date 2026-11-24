import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import { openAppDb } from "@/lib/db";

describe("persistance des nouveaux magasins", () => {
  it("chaque magasin V2 relit ses données après réouverture", async () => {
    const db = "persist-test";
    const recs: [string, Record<string, unknown>][] = [
      ["taxonomy", { id: "cat:perso", kind: "category", parentId: "fam:divers", label: "Perso", role: "divers", order: 9, archived: false, custom: true }],
      ["drafts", { id: "d1", status: "brouillon", createdAt: 1, updatedAt: 1, data: { name: "Chemise" } }],
      ["outfits", { id: "o1", name: "Lundi", itemIds: ["a"], note: "", source: "manuel", favorite: true, archived: false, createdAt: 1, updatedAt: 1 }],
      ["calendarEvents", { id: "e1", date: "2026-12-01", outfitId: "o1", status: "planifie", createdAt: 1 }],
      ["wearHistory", { id: "w1", date: "2026-12-01", outfitId: "o1", itemIds: ["a"], createdAt: 1 }],
      ["corrections", { id: "c1", itemId: "a", field: "subcategory", suggested: "Chemise", final: "Blouse", action: "corrigee", createdAt: 1 }],
      ["occasions", { id: "occ:mariage", label: "mariage", archived: false, custom: true, order: 7 }],
    ];
    const d = await openAppDb(db);
    for (const [s, v] of recs) await d.put(s, v);
    d.close();
    const d2 = await openAppDb(db);
    for (const [s, v] of recs) expect(await d2.get(s, v["id"] as string)).toEqual(v);
    expect(await d2.getAllFromIndex("calendarEvents", "date", "2026-12-01")).toHaveLength(1);
    expect(await d2.count("items")).toBe(0);
  });
});
