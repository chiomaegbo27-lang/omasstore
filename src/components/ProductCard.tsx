import { Plus, Minus, Play, Pause } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useCart, cartLineId } from "@/lib/cart";
import { formatNGN } from "@/lib/store";
import { toast } from "sonner";

export interface ProductVariant {
  id: string;
  product_id: string;
  unit: string;
  measurement: string | null;
  price: number;
  stock: number;
  is_default: boolean;
  sort_order: number;
}

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
  image_url?: string | null;
  video_url?: string | null;
  product_variants?: ProductVariant[];
}

export function ProductCard({ p, index = 0 }: { p: Product; index?: number }) {
  const { add, setQty, items } = useCart();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const variants = (p.product_variants ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const hasVariants = variants.length > 0;

  // Single-unit quick add (no variants)
  const lineId = cartLineId(p.id, null);
  const inCart = items.find((i) => i.id === lineId);
  const qty = inCart?.qty ?? 0;
  const soldOut = hasVariants
    ? variants.every((v) => v.stock <= 0)
    : !p.in_stock || p.stock <= 0;
  const remaining = hasVariants ? 0 : Math.max(0, p.stock - qty);

  const minPrice = hasVariants
    ? variants.reduce((m, v) => Math.min(m, Number(v.price)), Infinity)
    : p.price;

  const inc = () => {
    if (remaining <= 0) { toast.error("No more stock available"); return; }
    if (qty === 0) {
      add({
        id: lineId, productId: p.id, variantId: null,
        name: p.name, price: p.price, emoji: p.emoji, unit: p.unit, image_url: p.image_url,
      });
      toast.success(`${p.name} added to cart! 🛒`, { duration: 1500 });
    } else {
      setQty(lineId, qty + 1);
    }
  };
  const dec = () => setQty(lineId, qty - 1);

  const toggleVideo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const v = videoRef.current; if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-soft animate-fade-in"
      style={{ animationDelay: `${Math.min(index * 60, 600)}ms`, animationFillMode: "both" }}
    >
      <Link
        to="/product/$id"
        params={{ id: p.id }}
        className="relative grid aspect-square place-items-center bg-gradient-to-br from-pink-soft to-blue-soft overflow-hidden text-left"
        aria-label={p.name}
      >
        {p.video_url ? (
          <>
            <video
              ref={videoRef}
              src={p.video_url}
              poster={p.image_url ?? undefined}
              preload="metadata"
              playsInline
              onEnded={() => setPlaying(false)}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={toggleVideo}
              aria-label={playing ? "Pause advert" : "Play advert"}
              className="absolute inset-0 grid place-items-center bg-black/0 hover:bg-black/20 transition"
            >
              <span className={`grid h-10 w-10 place-items-center rounded-full bg-white/95 text-primary shadow transition ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}>
                {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </span>
            </button>
          </>
        ) : p.image_url ? (
          <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
        ) : (
          <span aria-hidden className="text-6xl transition-transform duration-300 group-hover:scale-110">{p.emoji ?? "🛒"}</span>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur">
          {p.category}
        </span>
        {soldOut ? (
          <span className="absolute right-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground">
            Sold out
          </span>
        ) : hasVariants ? (
          <span className="absolute right-2 top-2 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
            {variants.length} options
          </span>
        ) : p.stock <= 5 ? (
          <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
            Only {p.stock} left
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link to="/product/$id" params={{ id: p.id }} className="line-clamp-2 text-sm font-semibold leading-snug hover:text-primary transition">
          {p.name}
        </Link>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          {p.brand ? <span className="truncate">{p.brand}</span> : <span />}
          {!soldOut && !hasVariants && <span>{p.stock} in stock</span>}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-base font-bold text-primary">
            {hasVariants ? <>from {formatNGN(minPrice)}</> : formatNGN(p.price)}
          </span>
          {soldOut ? (
            <span className="text-xs font-semibold text-muted-foreground">Unavailable</span>
          ) : hasVariants ? (
            <Link
              to="/product/$id"
              params={{ id: p.id }}
              className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Choose
            </Link>
          ) : qty === 0 ? (
            <button
              onClick={inc}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:opacity-90 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          ) : (
            <div className="inline-flex items-center gap-1 rounded-full bg-secondary p-0.5">
              <button onClick={dec} aria-label="Decrease quantity" className="grid h-7 w-7 place-items-center rounded-full bg-card text-foreground shadow-sm transition-all duration-200 active:scale-90">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[1.5rem] text-center text-sm font-bold">{qty}</span>
              <button onClick={inc} disabled={remaining <= 0} aria-label="Increase quantity" className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all duration-200 active:scale-90 disabled:opacity-40">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
