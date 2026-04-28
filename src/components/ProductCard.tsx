import { Plus } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatNGN } from "@/lib/store";
import { toast } from "sonner";

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  emoji: string | null;
  description: string | null;
  in_stock: boolean;
}

export function ProductCard({ p }: { p: Product }) {
  const { add } = useCart();
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="relative grid aspect-square place-items-center bg-gradient-to-br from-pink-soft to-blue-soft text-6xl">
        <span aria-hidden>{p.emoji ?? "🛒"}</span>
        <span className="absolute left-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur">
          {p.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{p.name}</h3>
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-base font-bold text-primary">{formatNGN(p.price)}</span>
          <button
            onClick={() => { add({ id: p.id, name: p.name, price: p.price, emoji: p.emoji }); toast.success("Added to cart"); }}
            className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground shadow-sm transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
