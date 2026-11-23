import type { Item } from "@/lib/types";
import { Shirt } from "lucide-react";
export function ItemThumb({ item, className = "" }: { item: Item; className?: string }) {
  return item.photo
    ? <img src={item.photo} alt={item.name} loading="lazy" className={`aspect-square w-full rounded-xl object-cover bg-muted ${className}`} />
    : <div className={`grid aspect-square w-full place-items-center rounded-xl bg-muted text-muted-foreground ${className}`}><Shirt className="h-8 w-8" /></div>;
}
export function OutfitStrip({ ids, items }: { ids: string[]; items: Item[] }) {
  const parts = ids.map((id) => items.find((i) => i.id === id)).filter((x): x is Item => !!x);
  return (
    <div className="grid grid-cols-4 gap-2">
      {parts.map((p) => (
        <div key={p.id} className="min-w-0">
          <ItemThumb item={p} />
          <p className="mt-1 truncate text-[11px] text-muted-foreground">{p.name}</p>
        </div>
      ))}
    </div>
  );
}
