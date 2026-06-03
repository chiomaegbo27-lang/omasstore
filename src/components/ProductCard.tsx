import { Plus, Minus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useCart, cartLineId } from "@/lib/cart";
import { formatNGN } from "@/lib/store";
import { toast } from "sonner";
import { ProductMediaCarousel, type MediaItem } from "@/components/ProductMediaCarousel";

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

export interface ProductMedia {
  id: string;
  url: string;
  type: "image" | "video";
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
  texture?: string | null;
  taste?: string | null;
  aroma?: string | null;
  origin?: string | null;
  cooking_notes?: string | null;
  quality_level?: string | null;
  product_variants?: ProductVariant[];
  product_media?: ProductMedia[];
}

export function ProductCard({ p, index = 0 }: { p: Product; index?: number }) {
  const { add, setQty, items } = useCart();

  // Hydrate media if parent didn't include it (e.g. legacy queries)
  const [extraMedia, setExtraMedia] = useState<ProductMedia[] | null>(null);
  useEffect(() => {
    if (p.product_media !== undefined) return;
    supabase.from("product_media").select("*").eq("product_id", p.id).order("sort_order")
      .then(({ data }) => setExtraMedia((data ?? []) as ProductMedia[]));
  }, [p.id, p.product_media]);

  const mediaRows = (p.product_media ?? extraMedia ?? []) as ProductMedia[];
  const media: MediaItem[] = (() => {
    if (mediaRows.length) {
      const posterUrl = p.image_url ?? mediaRows.find((m) => m.type === "image")?.url ?? null;
      return mediaRows.map((m) => ({ url: m.url, type: m.type, poster: m.type === "video" ? posterUrl : null }));
    }
    const items: MediaItem[] = [];
    if (p.image_url) items.push({ url: p.image_url, type: "image" });
    if (p.video_url) items.push({ url: p.video_url, type: "video", poster: p.image_url ?? null });
    return items;
  })();

  const variants = (p.product_variants ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const hasVariants = variants.length > 0;

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

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-soft animate-fade-in"
      style={{ animationDelay: `${Math.min(index * 60, 600)}ms`, animationFillMode: "both" }}
    >
      <div className="relative">
        <ProductMediaCarousel media={media} alt={p.name} fallbackEmoji={p.emoji} rounded="" />
        <span className="absolute left-2 top-2 z-10 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur pointer-events-none">
          {p.category}
        </span>
        {soldOut ? (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground pointer-events-none">
            Sold out
          </span>
        ) : hasVariants ? (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground pointer-events-none">
            {variants.length} options
          </span>
        ) : p.stock <= 5 ? (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground pointer-events-none">
            Only {p.stock} left
          </span>
        ) : null}
      </div>
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
