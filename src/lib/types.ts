export type Category = "haut" | "bas" | "veste" | "chaussures" | "accessoire" | "robe" | "jupe";
export type Status = "disponible" | "lavage" | "reparation" | "prete" | "valise";
export interface Item {
  id: string;
  name: string;
  category: Category;
  subcategory: string;
  colorMain: string;
  colorsSecondary: string[];
  pattern: string;
  material: string;
  fit: string;
  occasion: string[];
  status: Status;
  location: string;
  photo?: string; // data URL compressée
  createdAt: number;
}
export interface Outfit {
  id: string;
  itemIds: string[];
  note: string;
  source: string;
}
export interface PlanDay {
  date: string; // YYYY-MM-DD
  outfit: Outfit;
}
export interface Profile {
  excludeDresses: boolean;
  theme: ThemeName;
  mode: "clair" | "sombre" | "systeme";
}
export type ThemeName = "chic" | "studio" | "modern";

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "haut", label: "Haut" },
  { value: "bas", label: "Bas" },
  { value: "veste", label: "Veste / superposition" },
  { value: "chaussures", label: "Chaussures" },
  { value: "accessoire", label: "Accessoire" },
  { value: "robe", label: "Robe" },
  { value: "jupe", label: "Jupe" },
];
export const STATUSES: { value: Status; label: string }[] = [
  { value: "disponible", label: "Disponible" },
  { value: "lavage", label: "Au lavage" },
  { value: "reparation", label: "En réparation" },
  { value: "prete", label: "Prêté" },
  { value: "valise", label: "Rangé en valise" },
];
export const SUBCATS: Record<Category, string[]> = {
  haut: ["T-shirt", "Chemise", "Blouse", "Pull", "Débardeur", "Top"],
  bas: ["Pantalon cargo", "Pantalon ample", "Pantalon à pinces", "Jean", "Short"],
  veste: ["Veste", "Cardigan", "Blazer", "Surchemise", "Blouse médicale"],
  chaussures: ["Baskets", "Mocassins", "Sandales", "Ballerines", "Bottines"],
  accessoire: ["Sac", "Ceinture", "Foulard", "Bijou", "Lunettes", "Montre"],
  robe: ["Robe courte", "Robe longue", "Robe pagne"],
  jupe: ["Jupe courte", "Jupe longue", "Jupe pagne"],
};
export const COLORS = [
  "noir", "blanc", "crème", "beige", "camel", "marron", "gris", "bleu marine", "bleu", "bleu ciel",
  "vert", "kaki", "vert olive", "jaune", "moutarde", "orange", "terracotta", "rouge", "bordeaux",
  "rose", "violet", "lavande", "denim",
];
export const PATTERNS = ["uni", "rayé", "carreaux", "fleuri", "wax / pagne", "imprimé", "pois", "texturé"];
export const OCCASIONS = ["cours", "stage / hôpital", "sortie", "église", "maison", "soirée"];
