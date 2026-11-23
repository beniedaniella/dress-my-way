import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, FileArchive, Images, PenLine } from "lucide-react";
import { toast } from "sonner";
import { Page } from "@/components/Page";
import { ItemForm, blankItem } from "@/components/ItemForm";
import { Progress } from "@/components/ui/progress";
import { saveItem, uid } from "@/lib/db";
import { compressImage, guessColor } from "@/lib/image";
import { useApp } from "@/lib/store";
import type { Item } from "@/lib/types";

export const Route = createFileRoute("/ajouter")({
  head: () => ({ meta: [
    { title: "Ajouter des vêtements — Dress My Way" },
    { name: "description", content: "Photographiez, importez depuis la galerie ou un ZIP pour cataloguer vos vêtements." },
    { property: "og:title", content: "Ajouter des vêtements — Dress My Way" },
    { property: "og:description", content: "Photo, galerie ou archive ZIP : cataloguez vite." },
  ] }),
  component: Ajouter,
});

function Ajouter() {
  const { refresh } = useApp();
  const nav = useNavigate();
  const [queue, setQueue] = useState<Item[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const cam = useRef<HTMLInputElement>(null), gal = useRef<HTMLInputElement>(null), zip = useRef<HTMLInputElement>(null);

  async function processBlobs(blobs: Blob[]) {
    setProgress({ done: 0, total: blobs.length });
    const out: Item[] = [];
    for (let k = 0; k < blobs.length; k++) {
      try {
        const photo = await compressImage(blobs[k]!);
        const item = blankItem(uid(), photo, await guessColor(photo));
        item.status = "disponible";
        await saveItem(item); // sauvegarde immédiate en brouillon
        out.push(item);
      } catch { toast.error(`Image ${k + 1} illisible, ignorée`); }
      setProgress({ done: k + 1, total: blobs.length });
      await new Promise((r) => setTimeout(r, 0)); // laisse respirer l'interface
    }
    setProgress(null);
    await refresh();
    if (out.length) toast.success(`${out.length} photo(s) ajoutée(s). Complétez les fiches ci-dessous.`);
    setQueue((q) => [...q, ...out]);
  }
  async function onZip(f: File) {
    const JSZip = (await import("jszip")).default;
    const z = await JSZip.loadAsync(f);
    const entries = Object.values(z.files).filter((e) => !e.dir && /\.(jpe?g|png|webp|heic|gif)$/i.test(e.name) && !e.name.startsWith("__MACOSX"));
    if (!entries.length) { toast.error("Aucune photo trouvée dans ce ZIP"); return; }
    const blobs: Blob[] = [];
    for (const e of entries) blobs.push(await e.async("blob"));
    await processBlobs(blobs);
  }

  const current = queue[0];
  if (current) return (
    <Page title="Compléter la fiche" subtitle={`${queue.length} fiche(s) à vérifier`}>
      <ItemForm key={current.id} initial={current} saveLabel={queue.length > 1 ? "Enregistrer et suivante" : "Enregistrer"}
        onCancel={() => setQueue((q) => q.slice(1))}
        onSave={async (i) => { await saveItem(i); await refresh(); setQueue((q) => q.slice(1)); toast.success(`« ${i.name} » enregistré`); }} />
      <p className="mt-3 text-center text-xs text-muted-foreground">« Annuler » garde la photo dans le dressing ; vous pourrez compléter la fiche plus tard.</p>
    </Page>
  );

  const Btn = ({ icon: I, t, d, on }: { icon: typeof Camera; t: string; d: string; on: () => void }) => (
    <button onClick={on} className="flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left shadow-sm active:scale-[0.99]">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><I className="h-6 w-6" /></span>
      <span><span className="block font-semibold">{t}</span><span className="text-sm text-muted-foreground">{d}</span></span>
    </button>
  );
  return (
    <Page title="Ajouter" subtitle="Les photos sont compressées sur votre téléphone avant d'être enregistrées.">
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files && processBlobs([...e.target.files])} />
      <input ref={gal} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && processBlobs([...e.target.files])} />
      <input ref={zip} type="file" accept=".zip,application/zip" hidden onChange={(e) => e.target.files?.[0] && onZip(e.target.files[0])} />
      {progress ? (
        <div className="rounded-2xl border bg-card p-5"><p className="mb-3 font-medium">Traitement {progress.done}/{progress.total}…</p><Progress value={(progress.done / progress.total) * 100} /></div>
      ) : (
        <div className="space-y-3">
          <Btn icon={Camera} t="Prendre une photo" d="Ouvre l'appareil photo" on={() => cam.current?.click()} />
          <Btn icon={Images} t="Choisir dans la galerie" d="Sélection multiple possible" on={() => gal.current?.click()} />
          <Btn icon={FileArchive} t="Importer une archive ZIP" d="Catalogue des dizaines de photos d'un coup" on={() => zip.current?.click()} />
          <Btn icon={PenLine} t="Sans photo" d="Créer une fiche manuellement" on={() => setQueue([blankItem(uid())])} />
          <button className="w-full pt-2 text-sm text-muted-foreground underline" onClick={() => nav({ to: "/dressing" })}>Voir mon dressing</button>
        </div>
      )}
    </Page>
  );
}
