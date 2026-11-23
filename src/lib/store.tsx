import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import * as db from "./db";
import type { Item, Profile } from "./types";

interface Ctx { ready: boolean; items: Item[]; profile: Profile; refresh: () => Promise<void>; setProfile: (p: Profile) => Promise<void>; }
const C = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [profile, setP] = useState<Profile>(db.DEFAULT_PROFILE);
  const refresh = useCallback(async () => { setItems(await db.listItems()); }, []);
  useEffect(() => { void (async () => { setItems(await db.listItems()); setP(await db.getProfile()); setReady(true); })(); }, []);
  useEffect(() => {
    const el = document.documentElement;
    el.dataset["theme"] = profile.theme;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => el.classList.toggle("dark", profile.mode === "sombre" || (profile.mode === "systeme" && mq.matches));
    apply(); mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [profile.theme, profile.mode]);
  const setProfile = async (p: Profile) => { setP(p); await db.saveProfile(p); };
  return <C.Provider value={{ ready, items, profile, refresh, setProfile }}>{children}</C.Provider>;
}
export function useApp() { const c = useContext(C); if (!c) throw new Error("AppProvider manquant"); return c; }
