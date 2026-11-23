import { describe, it, expect } from "vitest";
import { planRentree, validateIds, generateOutfit, schoolDays } from "@/lib/rules";
import type { Item } from "@/lib/types";

const mk = (id: string, category: Item["category"], colorMain = "noir", status: Item["status"] = "disponible"): Item => ({
  id, name: id, category, subcategory: "", colorMain, colorsSecondary: [], pattern: "uni", material: "", fit: "", occasion: ["cours"], status, location: "", createdAt: 0,
});
const wardrobe = [
  mk("h1", "haut", "blanc"), mk("h2", "haut", "crème"), mk("h3", "haut", "bleu"), mk("h4", "haut", "rose"), mk("h5", "haut", "noir"), mk("h6", "haut", "vert"),
  mk("b1", "bas", "beige"), mk("b2", "bas", "denim"), mk("b3", "bas", "kaki"),
  mk("s1", "chaussures", "blanc"), mk("r1", "robe", "rouge"), mk("w1", "haut", "jaune", "lavage"),
];
const p = { excludeDresses: true };

describe("règles Dress My Way", () => {
  it("génère 15 tenues sur 15 jours ouvrés", () => {
    const plan = planRentree(wardrobe, p, new Date("2026-11-30"), 42);
    expect(plan).toHaveLength(15);
    expect(plan.every((d) => ![0, 6].includes(new Date(d.date).getDay()))).toBe(true);
  });
  it("aucune combinaison haut+bas répétée dans les 15 tenues", () => {
    const plan = planRentree(wardrobe, p, new Date("2026-11-30"), 7);
    const combos = plan.map((d) => d.outfit.itemIds.slice(0, 2).join("|"));
    expect(new Set(combos).size).toBe(15);
  });
  it("exclut robes et articles au lavage", () => {
    const plan = planRentree(wardrobe, p, new Date("2026-11-30"), 3);
    const ids = plan.flatMap((d) => d.outfit.itemIds);
    expect(ids).not.toContain("r1");
    expect(ids).not.toContain("w1");
  });
  it("petit dressing (2 hauts, 2 bas) : 15 tenues quand même", () => {
    const small = [mk("h1", "haut", "blanc"), mk("h2", "haut", "noir"), mk("b1", "bas", "beige"), mk("b2", "bas", "denim")];
    expect(planRentree(small, p, new Date("2026-11-30"), 5)).toHaveLength(15);
  });
  it("rejette les identifiants inventés par une IA", () => {
    expect(validateIds(["h1", "inventé", "r1", "w1", "b2"], wardrobe, p)).toEqual(["h1", "b2"]);
  });
  it("le moteur local n'utilise que des articles réels", () => {
    const o = generateOutfit(wardrobe, p, { seed: 1 });
    const ids = new Set(wardrobe.map((i) => i.id));
    expect(o!.itemIds.every((id) => ids.has(id))).toBe(true);
  });
  it("schoolDays saute le week-end", () => {
    expect(schoolDays(new Date("2026-11-30")).slice(4, 6)).toEqual(["2026-12-04", "2026-12-07"]);
  });
});
