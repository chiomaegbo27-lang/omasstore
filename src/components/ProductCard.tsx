import { Plus, Minus } from "lucide-react";
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
  stock: number;
  unit: string | null;
  subcategory?: string | null;
  brand?: string | null;
}

export function ProductCard({ p, index = 0 }: { p: Product; index?: number }) {
  const { add, setQty, items } = useCart();
  const inCart = items.find((i) => i.id === p.id);
  const qty = inCart?.qty ?? 0;
  const soldOut = !p.in_stock || p.stock <= 0;
  const remaining = Math.max(0, p.stock - qty);

  const inc = () => {
    if (remaining <= 0) { toast.error("No more stock available"); return; }
    if (qty === 0) {
      add({ id: p.id, name: p.name, price: p.price, emoji: p.emoji, unit: p.unit });
      toast.success(`${p.name} added to cart! 🛒`, { duration: 1500 });
    } else {
      setQty(p.id, qty + 1);
    }
  };
  const dec = () => setQty(p.id, qty - 1);

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-soft animate-fade-in"
      style={{ animationDelay: `${Math.min(index * 60, 600)}ms`, animationFillMode: "both" }}
    >
      <div className="relative grid aspect-square place-items-center bg-gradient-to-br from-pink-soft to-blue-soft text-6xl overflow-hidden">
        <span aria-hidden className="transition-transform duration-300 group-hover:scale-110">{p.emoji ?? "🛒"}</span>
        <span className="absolute left-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur">
          {p.category}
        </span>
        {soldOut ? (
          <span className="absolute right-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground">
            Sold out
          </span>
        ) : p.stock <= 5 ? (
          <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
            Only {p.stock} left
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{p.name}</h3>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          {p.unit ? <span>per {p.unit}</span> : <span />}
          {!soldOut && <span>{p.stock} in stock</span>}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-base font-bold text-primary">{formatNGN(p.price)}</span>
          {soldOut ? (
            <span className="text-xs font-semibold text-muted-foreground">Unavailable</span>
          ) : qty === 0 ? (
            <button
              onClick={inc}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:opacity-90 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          ) : (
            <div className="inline-flex items-center gap-1 rounded-full bg-secondary p-0.5">
              <button
                onClick={dec}
                aria-label="Decrease quantity"
                className="grid h-7 w-7 place-items-center rounded-full bg-card text-foreground shadow-sm transition-all duration-200 active:scale-90"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[1.5rem] text-center text-sm font-bold">{qty}</span>
              <button
                onClick={inc}
                disabled={remaining <= 0}
                aria-label="Increase quantity"
                className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all duration-200 active:scale-90 disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
