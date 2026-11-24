// Modèle de données V2 (cahier des charges §6.3, §17, §17.1).
// Les types V1 (types.ts) restent utilisés par les écrans pendant la transition.
import type { Item as ItemV1, Profile } from "./types";

export type OutfitRole =
  | "haut" | "bas" | "piece_complete" | "couche" | "chaussure" | "sac" | "bijou" | "accessoire" | "coiffure" | "divers";

interface TaxonomyBase { id: string; label: string; order: number; archived: boolean; custom: boolean; mergedInto?: string }
export interface TaxonomyFamily extends TaxonomyBase { kind: "family" }
export interface TaxonomyCategory extends TaxonomyBase { kind: "category"; parentId: string; role: OutfitRole }
export interface TaxonomySubcategory extends TaxonomyBase { kind: "subcategory"; parentId: string }
export type TaxonomyNode = TaxonomyFamily | TaxonomyCategory | TaxonomySubcategory;

export type FieldSource = "ia" | "utilisatrice" | "migration";
export interface FieldProvenance<T = unknown> { suggested?: T; accepted?: boolean; final: T; confidence?: number; source: FieldSource }
export interface AiAnalysis {
  model: string; analyzedAt: number; status: "en_attente" | "terminee" | "echec" | "refusee";
  confidence?: number; suggestions: Record<string, unknown>; alternatives?: Record<string, unknown[]>;
  fields?: Record<string, FieldProvenance>;
}

export type Season = "saison_seche" | "saison_pluies" | "toutes";
export type Weather = "chaud" | "doux" | "frais" | "pluie";

/** Article validé V2 : compatible avec l'Item V1 (champs V1 conservés), enrichi de champs optionnels. */
export interface Item extends ItemV1 {
  schemaVersion?: 2;
  familyId?: string; categoryId?: string; subcategoryId?: string;
  legacyCategory?: string; legacySubcategory?: string;
  description?: string;
  extraPhotos?: string[]; thumbnail?: string; photoOrigin?: "camera" | "galerie" | "zip" | "aucune"; photoHash?: string;
  silhouette?: string; style?: string[];
  seasons?: Season[]; weather?: Weather[]; formality?: 1 | 2 | 3 | 4 | 5; comfort?: 1 | 2 | 3 | 4 | 5; notes?: string;
  archived?: boolean;
  favorite?: boolean; wearCount?: number; lastWornAt?: string;
  brand?: string; size?: string; price?: number; purchaseDate?: string;
  ai?: AiAnalysis;
}

export interface Draft {
  id: string; status: "brouillon" | "abandonne"; createdAt: number; updatedAt: number;
  data: Partial<Item>; photo?: string; ai?: AiAnalysis; sourceBatch?: string;
}

export interface Outfit {
  id: string; name: string; itemIds: string[]; roles?: Partial<Record<OutfitRole, string[]>>;
  note: string; source: string; favorite: boolean; archived: boolean; variantOf?: string;
  occasionId?: string; createdAt: number; updatedAt: number; legacyPlanDate?: string;
}
export interface CalendarEvent {
  id: string; date: string; outfitId: string; occasionId?: string; status: "planifie" | "annule"; note?: string; createdAt: number;
}
/** Preuve explicite d'un port réel — jamais créée par une planification. */
export interface WearRecord { id: string; date: string; outfitId?: string; itemIds: string[]; eventId?: string; createdAt: number }
export interface Occasion { id: string; label: string; archived: boolean; custom: boolean; order: number }
export interface CorrectionRecord {
  id: string; itemId?: string; draftId?: string; field: string; suggested: unknown; final: unknown;
  action: "acceptee" | "corrigee" | "refusee"; model?: string; createdAt: number;
}
export interface BodyProfile { heightCm?: number; bustCm?: number; waistCm?: number; hipsCm?: number; shoeSize?: string; updatedAt?: number }
export interface RepresentationPreferences { mode: "aucun" | "photo" | "avatar" | "3d" }
export interface Settings {
  theme: Profile["theme"]; mode: Profile["mode"]; language: "fr"; network: "auto" | "economie" | "hors_ligne";
  voice: { input: boolean; output: boolean }; location: { consent: boolean; manualCity?: string };
  privacy: { aiPhotoConsent: boolean; keepConversations: boolean };
}
export interface UserProfile extends Profile {
  schemaVersion?: 2; firstName?: string; city?: string; stylePreferences?: string[];
  body?: BodyProfile; representation?: RepresentationPreferences; settings?: Settings;
}
export interface ConversationMessage { role: "utilisatrice" | "styliste"; stylist?: string; text: string; at: number }
export interface Conversation { id: string; stylist: string; messages: ConversationMessage[]; createdAt: number; updatedAt: number }
