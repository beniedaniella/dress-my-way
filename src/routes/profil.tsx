import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Page } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { exportAll, importAll } from "@/lib/db";
import { useApp } from "@/lib/store";
import type { Profile, ThemeName } from "@/lib/types";

export const Route = createFileRoute("/profil")({
  head: () => ({ meta: [
    { title: "Profil et réglages — Dress My Way" },
    { name: "description", content: "Thèmes, préférences de style et sauvegarde de vos données." },
    { property: "og:title", content: "Profil et réglages — Dress My Way" },
    { property: "og:description", content: "Thèmes, préférences et sauvegarde." },
  ] }),
  component: Profil,
});
const THEMES: { id: ThemeName; name: string; sw: string[] }[] = [
  { id: "chic", name: "Chic Editorial", sw: ["#f6efe3", "#d9c3a5", "#b5654a", "#5a3a28"] },
  { id: "studio", name: "Colorful Studio", sw: ["#d9cdf3", "#f5c9d6", "#f08a6c", "#f7e6a1"] },
  { id: "modern", name: "Modern Closet", sw: ["#ffffff", "#dfe6f2", "#1f3f8a", "#0e1b3d"] },
];
function Profil() {
  const { profile, setProfile, refresh } = useApp();
  const file = useRef<HTMLInputElement>(null);
  const set = (p: Partial<Profile>) => setProfile({ ...profile, ...p });
  async function doExport() {
    const blob = new Blob([JSON.stringify(await exportAll())], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `dress-my-way-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    toast.success("Sauvegarde téléchargée");
  }
  async function doImport(f: File) {
    try { const d = JSON.parse(await f.text()); if (d.app !== "dress-my-way") throw 0; await importAll(d); await refresh(); if (d.profile) await setProfile(d.profile); toast.success(`${d.items?.length ?? 0} pièce(s) restaurée(s)`); }
    catch { toast.error("Fichier de sauvegarde invalide"); }
  }
  return (
    <Page title="Profil" subtitle="Vos données restent sur ce téléphone.">
      <h2 className="mb-2 text-lg">Thème</h2>
      <div className="mb-4 space-y-2">
        {THEMES.map((t) => (
          <button key={t.id} onClick={() => set({ theme: t.id })} className={`flex w-full items-center justify-between rounded-2xl border bg-card p-3 ${profile.theme === t.id ? "border-primary ring-2 ring-ring" : ""}`}>
            <span className="font-medium">{t.name}</span>
            <span className="flex">{t.sw.map((c) => <span key={c} className="-ml-1 h-6 w-6 rounded-full border-2 border-card" style={{ background: c }} />)}</span>
          </button>
        ))}
      </div>
      <div className="mb-6 grid grid-cols-3 gap-2">
        {(["clair", "sombre", "systeme"] as const).map((m) => (
          <Button key={m} variant={profile.mode === m ? "default" : "outline"} onClick={() => set({ mode: m })}>{m === "systeme" ? "Système" : m === "clair" ? "Clair" : "Sombre"}</Button>
        ))}
      </div>
      <h2 className="mb-2 text-lg">Préférences de style</h2>
      <label className="mb-6 flex items-center justify-between rounded-2xl border bg-card p-3">
        <span><span className="block font-medium">Exclure robes et jupes</span><span className="text-xs text-muted-foreground">Focus pantalons, vestes, chemises et superpositions</span></span>
        <Switch checked={profile.excludeDresses} onCheckedChange={(v) => set({ excludeDresses: v })} />
      </label>
      <h2 className="mb-2 text-lg">Sauvegarde</h2>
      <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={doExport}><Download className="mr-1 h-4 w-4" />Exporter (JSON)</Button>
        <Button variant="outline" onClick={() => file.current?.click()}><Upload className="mr-1 h-4 w-4" />Restaurer</Button>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">Pour installer l'application : ouvrez-la dans Chrome sur Android, menu ⋮ → « Ajouter à l'écran d'accueil ».</p>
    </Page>
  );
}
