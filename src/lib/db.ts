import { openDB, type IDBPDatabase } from "idb";
import type { Item, PlanDay, Profile } from "./types";
import { migrateV2 } from "./migrate";

export const DB_NAME = "dress-my-way";
export const DB_VERSION = 2;

/** Ouvre la base et crée les magasins manquants. Ne supprime ni ne vide jamais un magasin existant. */
export function openAppDb(name = DB_NAME) {
  return openDB(name, DB_VERSION, {
    upgrade(d, oldVersion) {
      if (oldVersion < 1) {
        d.createObjectStore("items", { keyPath: "id" });
        d.createObjectStore("plan", { keyPath: "date" });
        d.createObjectStore("kv");
      }
      if (oldVersion < 2) {
        d.createObjectStore("taxonomy", { keyPath: "id" }).createIndex("parentId", "parentId");
        d.createObjectStore("drafts", { keyPath: "id" }).createIndex("status", "status");
        d.createObjectStore("outfits", { keyPath: "id" });
        const ev = d.createObjectStore("calendarEvents", { keyPath: "id" });
        ev.createIndex("date", "date"); ev.createIndex("outfitId", "outfitId");
        const w = d.createObjectStore("wearHistory", { keyPath: "id" });
        w.createIndex("date", "date"); w.createIndex("outfitId", "outfitId");
        d.createObjectStore("corrections", { keyPath: "id" }).createIndex("itemId", "itemId");
        d.createObjectStore("occasions", { keyPath: "id" });
      }
    },
  });
}

let dbp: Promise<IDBPDatabase> | null = null;
function db() {
  if (!dbp) {
    dbp = openAppDb().then(async (d) => {
      // En cas d'échec, les données d'origine restent intactes et la migration sera retentée au prochain démarrage.
      await migrateV2(d).catch((e) => console.error("Migration V2 échouée", e));
      return d;
    });
    if (navigator.storage?.persist) void navigator.storage.persist();
  }
  return dbp;
}

// Accès génériques aux nouveaux magasins V2.
export type V2Store = "taxonomy" | "drafts" | "outfits" | "calendarEvents" | "wearHistory" | "corrections" | "occasions";
export async function listStore<T>(store: V2Store): Promise<T[]> { return (await (await db()).getAll(store)) as T[]; }
export async function getRecord<T>(store: V2Store, id: string): Promise<T | undefined> { return (await (await db()).get(store, id)) as T | undefined; }
export async function putRecord<T>(store: V2Store, value: T) { await (await db()).put(store, value); }
export async function deleteRecord(store: V2Store, id: string) { await (await db()).delete(store, id); }
export const uid = () => crypto.randomUUID().slice(0, 8);

export async function listItems(): Promise<Item[]> {
  const all = (await (await db()).getAll("items")) as Item[];
  return all.sort((a, b) => b.createdAt - a.createdAt);
}
export async function saveItem(i: Item) { await (await db()).put("items", i); }
export async function deleteItem(id: string) { await (await db()).delete("items", id); }
export async function listPlan(): Promise<PlanDay[]> {
  return ((await (await db()).getAll("plan")) as PlanDay[]).sort((a, b) => a.date.localeCompare(b.date));
}
export async function savePlan(days: PlanDay[]) {
  const d = await db();
  const tx = d.transaction("plan", "readwrite");
  await tx.store.clear();
  for (const day of days) await tx.store.put(day);
  await tx.done;
}
export async function savePlanDay(day: PlanDay) { await (await db()).put("plan", day); }

export const DEFAULT_PROFILE: Profile = { excludeDresses: true, theme: "chic", mode: "systeme" };
export async function getProfile(): Promise<Profile> {
  return { ...DEFAULT_PROFILE, ...((await (await db()).get("kv", "profile")) ?? {}) };
}
export async function saveProfile(p: Profile) { await (await db()).put("kv", p, "profile"); }

export async function exportAll() {
  return { app: "dress-my-way", version: 1, exportedAt: new Date().toISOString(), items: await listItems(), plan: await listPlan(), profile: await getProfile() };
}
export async function importAll(data: { items?: Item[]; plan?: PlanDay[]; profile?: Profile }) {
  const d = await db();
  for (const i of data.items ?? []) await d.put("items", i);
  for (const p of data.plan ?? []) await d.put("plan", p);
  if (data.profile) await d.put("kv", data.profile, "profile");
}
