import type { Occasion, OutfitRole, TaxonomyNode } from "./types-v2";

// Taxonomie initiale (Annexe A). Identifiants fixes : ne jamais les renommer.
type Cat = [id: string, label: string, role: OutfitRole, subs: string[]];
const FAMILIES: [id: string, label: string, cats: Cat[]][] = [
  ["vetements", "Vêtements", [
    ["hauts", "Hauts", "haut", ["T-shirt", "Chemise", "Blouse", "Top", "Débardeur", "Pull", "Sweat", "Hoodie", "Polo", "Tunique", "Body"]],
    ["bas", "Bas", "bas", ["Jean", "Pantalon", "Pantalon cargo", "Pantalon ample", "Pantalon à pinces", "Jogging", "Legging", "Short"]],
    ["jupes", "Jupes", "bas", ["Jupe courte", "Jupe longue", "Jupe pagne"]],
    ["pieces-completes", "Pièces complètes", "piece_complete", ["Robe courte", "Robe longue", "Robe pagne", "Combinaison", "Ensemble"]],
    ["couches", "Couches", "couche", ["Veste", "Cardigan", "Blazer", "Surchemise", "Blouse médicale", "Trench", "Manteau", "Parka", "Imperméable"]],
  ]],
  ["chaussures", "Chaussures", [["chaussures", "Chaussures", "chaussure", ["Baskets", "Talons", "Escarpins", "Sandales", "Bottes", "Bottines", "Mocassins", "Ballerines", "Chaussures plates", "Chaussures formelles", "Tongs"]]]],
  ["sacs", "Sacs", [["sacs", "Sacs", "sac", ["Sac", "Sac à main", "Sac à dos", "Sac de cours", "Pochette", "Sac de voyage", "Bandoulière"]]]],
  ["bijoux", "Bijoux", [["bijoux", "Bijoux", "bijou", ["Bijou", "Collier", "Bracelet", "Bague", "Boucles d'oreilles", "Broche", "Montre", "Chevillière"]]]],
  ["accessoires", "Accessoires", [["accessoires", "Accessoires", "accessoire", ["Ceinture", "Foulard", "Écharpe", "Chapeau", "Lunettes", "Accessoire cheveux", "Divers"]]]],
  ["cheveux", "Cheveux", [["coiffures", "Coiffures et perruques", "coiffure", ["Perruque", "Tresses", "Nattes", "Locks", "Coupe", "Coiffure", "Inspiration coiffure"]]]],
  ["divers", "Autres / Divers", [["divers", "Divers", "divers", ["Tenue traditionnelle", "Uniforme", "Costume", "Vêtement de spectacle", "Élément atypique"]]]],
];

export const slug = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const subId = (catId: string, label: string) => `${catId}--${slug(label)}`;

export function taxonomySeed(): TaxonomyNode[] {
  const out: TaxonomyNode[] = [];
  FAMILIES.forEach(([fid, flabel, cats], fi) => {
    out.push({ kind: "family", id: `fam:${fid}`, label: flabel, order: fi, archived: false, custom: false });
    cats.forEach(([cid, clabel, role, subs], ci) => {
      out.push({ kind: "category", id: `cat:${cid}`, parentId: `fam:${fid}`, label: clabel, role, order: ci, archived: false, custom: false });
      subs.forEach((s, si) => out.push({ kind: "subcategory", id: `sub:${subId(cid, s)}`, parentId: `cat:${cid}`, label: s, order: si, archived: false, custom: false }));
    });
  });
  return out;
}

export const OCCASION_SEED: Occasion[] = ["cours", "stage / hôpital", "sortie", "église", "maison", "soirée"]
  .map((label, order) => ({ id: `occ:${slug(label)}`, label, order, archived: false, custom: false }));
