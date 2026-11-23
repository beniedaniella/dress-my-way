import { openDB, type IDBPDatabase } from "idb";
import type { Item, PlanDay, Profile } from "./types";

let dbp: Promise<IDBPDatabase> | null = null;
function db() {
  if (!dbp) {
    dbp = openDB("dress-my-way", 1, {
      upgrade(d) {
        d.createObjectStore("items", { keyPath: "id" });
        d.createObjectStore("plan", { keyPath: "date" });
        d.createObjectStore("kv");
      },
    });
    if (navigator.storage?.persist) void navigator.storage.persist();
  }
  return dbp;
}
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
