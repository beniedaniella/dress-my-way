import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Page } from "@/components/Page";
import { ItemForm } from "@/components/ItemForm";
import { Button } from "@/components/ui/button";
import { deleteItem, saveItem } from "@/lib/db";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/article/$id")({
  head: () => ({ meta: [
    { title: "Fiche article — Dress My Way" },
    { name: "description", content: "Modifier la fiche d'un vêtement." },
    { property: "og:title", content: "Fiche article — Dress My Way" },
    { property: "og:description", content: "Modifier la fiche d'un vêtement." },
  ] }),
  component: Article,
});
function Article() {
  const { id } = Route.useParams();
  const { items, ready, refresh } = useApp();
  const nav = useNavigate();
  const it = items.find((i) => i.id === id);
  if (!ready) return <Page title="Chargement…"><span /></Page>;
  if (!it) return <Page title="Introuvable"><p>Cet article n'existe plus.</p></Page>;
  return (
    <Page title={it.name || "Article"} subtitle={`Identifiant : ${it.id}`}>
      <ItemForm initial={it} onCancel={() => nav({ to: "/dressing" })} onSave={async (i) => { await saveItem(i); await refresh(); toast.success("Fiche mise à jour"); nav({ to: "/dressing" }); }} />
      <Button variant="ghost" className="mt-4 w-full text-destructive" onClick={async () => { if (!confirm("Supprimer cet article ?")) return; await deleteItem(it.id); await refresh(); toast.success("Article supprimé"); nav({ to: "/dressing" }); }}>Supprimer l'article</Button>
    </Page>
  );
}
