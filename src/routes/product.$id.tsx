import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Minus, Send, ShoppingCart, Star as StarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart, cartLineId } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatNGN } from "@/lib/store";
import { toast } from "sonner";
import type { Product, ProductVariant } from "@/components/ProductCard";
import { ProductMediaCarousel, type MediaItem } from "@/components/ProductMediaCarousel";
import { StarRating } from "@/components/StarRating";
import DOMPurify from "dompurify";

export const Route = createFileRoute("/product/$id")({
  component: ProductDetail,
  validateSearch: (s: Record<string, unknown>) => ({ review: s.review === "1" || s.review === 1 ? "1" : undefined }),
  head: () => ({ meta: [{ title: "Product — Oma's Store" }] }),
});

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
  user_id: string | null;
}

interface ProductMedia {
  id: string;
  url: string;
  type: "image" | "video";
  sort_order: number;
}

function ProductDetail() {
  const { id } = Route.useParams();
  const search = useSearch({ from: "/product/$id" });
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { items, add, setQty } = useCart();

  const [p, setP] = useState<(Product & { product_media?: ProductMedia[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const [pr, rr] = await Promise.all([
      supabase.from("products").select("*, product_variants(*), product_media(*)").eq("id", id).maybeSingle(),
      supabase.from("reviews").select("*").eq("product_id", id).eq("is_approved", true).order("created_at", { ascending: false }).limit(50),
    ]);
    const prod = pr.data as (Product & { product_media?: ProductMedia[] }) | null;
    setP(prod);
    setReviews((rr.data ?? []) as Review[]);
    if (prod?.product_variants?.length) {
      const def = prod.product_variants.find((v) => v.is_default) ?? prod.product_variants[0];
      setSelectedVariantId(def.id);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  // Auto-focus review form when arriving from a "leave a review" reminder link
  useEffect(() => {
    if (search.review === "1" && !loading) {
      setTimeout(() => {
        document.getElementById("review-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 200);
    }
  }, [search.review, loading]);

  const variants = useMemo(
    () => (p?.product_variants ?? []).slice().sort((a, b) => a.sort_order - b.sort_order),
    [p],
  );
  const variant: ProductVariant | undefined = variants.find((v) => v.id === selectedVariantId);
  const hasVariants = variants.length > 0;

  const activePrice = variant ? Number(variant.price) : p?.price ?? 0;
  const activeStock = variant ? variant.stock : p?.stock ?? 0;
  const activeUnit = variant ? variant.unit : p?.unit ?? null;
  const activeMeasurement = variant ? variant.measurement : null;
  const soldOut = hasVariants ? activeStock <= 0 : !p?.in_stock || (p?.stock ?? 0) <= 0;

  const lineId = p ? cartLineId(p.id, variant?.id ?? null) : "";
  const inCart = items.find((i) => i.id === lineId);
  const qty = inCart?.qty ?? 0;
  const remaining = Math.max(0, activeStock - qty);

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  // Build the media gallery: prefer product_media rows, fall back to legacy fields.
  const mediaItems: MediaItem[] = useMemo(() => {
    if (!p) return [];
    const rows = (p.product_media ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
    if (rows.length) {
      const poster = p.image_url ?? rows.find((r) => r.type === "image")?.url ?? null;
      return rows.map((r) => ({ url: r.url, type: r.type, poster: r.type === "video" ? poster : null }));
    }
    const items: MediaItem[] = [];
    if (p.image_url) items.push({ url: p.image_url, type: "image" });
    if (p.video_url) items.push({ url: p.video_url, type: "video", poster: p.image_url ?? null });
    return items;
  }, [p]);

  const inc = () => {
    if (!p) return;
    if (remaining <= 0) { toast.error("No more stock available"); return; }
    if (qty === 0) {
      add({
        id: lineId, productId: p.id, variantId: variant?.id ?? null,
        name: variant ? `${p.name} (${variant.measurement ? `${variant.measurement} ` : ""}${variant.unit})` : p.name,
        price: activePrice, emoji: p.emoji, unit: activeUnit, measurement: activeMeasurement, image_url: p.image_url,
      });
      toast.success("Added to cart! 🛒", { duration: 1500 });
    } else {
      setQty(lineId, qty + 1);
    }
  };
  const dec = () => setQty(lineId, qty - 1);

  const submitReview = async () => {
    if (!user) { toast.error("Please sign in to leave a review"); return; }
    if (!comment.trim()) { toast.error("Please write something"); return; }
    if (comment.trim().length > 1000) { toast.error("Comment too long (max 1000 chars)"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      product_id: id,
      user_id: user.id,
      customer_name: profile?.display_name ?? user.email ?? "Customer",
      rating, comment: comment.trim(),
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Thanks for your review!");
    setComment(""); setRating(5);
    load();
  };

  if (loading) return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Loading…</div>;
  if (!p) return (
    <div className="container mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-bold">Product not found</h1>
      <Link to="/shop" className="mt-4 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Back to shop</Link>
    </div>
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 md:py-10 animate-fade-in">
      <button onClick={() => navigate({ to: "/shop" })} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to shop
      </button>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Media */}
        <div className="border border-border rounded-2xl overflow-hidden shadow-card">
          <ProductMediaCarousel media={mediaItems} alt={p.name} fallbackEmoji={p.emoji} />
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">
            {p.category}{p.brand ? ` › ${p.brand}` : ""}{p.subcategory ? ` › ${p.subcategory}` : ""}
          </div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">{p.name}</h1>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <StarRating value={Math.round(avgRating)} readOnly size={16} />
              <span className="font-semibold">{avgRating.toFixed(1)}</span>
              <span className="text-muted-foreground">({reviews.length} review{reviews.length > 1 ? "s" : ""})</span>
            </div>
          )}
          <div className="text-3xl font-bold text-primary">
            {formatNGN(activePrice)}
            {activeUnit && <span className="ml-1 text-sm font-normal text-muted-foreground">/ {activeMeasurement ? `${activeMeasurement} ` : ""}{activeUnit}</span>}
          </div>

          {/* Variant selector */}
          {hasVariants && (
            <div>
              <div className="mb-2 text-sm font-semibold">Choose unit</div>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const active = v.id === selectedVariantId;
                  const out = v.stock <= 0;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      disabled={out}
                      className={`rounded-xl border px-3 py-2 text-left text-sm transition ${active ? "border-primary bg-primary/5 ring-2 ring-primary" : "border-border bg-card hover:bg-muted"} ${out ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="font-semibold">
                        {v.measurement ? `${v.measurement} ` : ""}{v.unit}
                      </div>
                      <div className="text-xs text-primary font-bold">{formatNGN(v.price)}</div>
                      <div className="text-[10px] text-muted-foreground">{out ? "Sold out" : `${v.stock} left`}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add to cart */}
          <div className="flex items-center gap-3">
            {soldOut ? (
              <span className="rounded-full bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive">Sold out</span>
            ) : qty === 0 ? (
              <button onClick={inc} className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-accent-foreground shadow-soft hover:opacity-95 active:scale-95 transition">
                <ShoppingCart className="h-4 w-4" /> Add to cart
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary p-1">
                <button onClick={dec} className="grid h-9 w-9 place-items-center rounded-full bg-card shadow-sm active:scale-90"><Minus className="h-4 w-4" /></button>
                <span className="min-w-[2rem] text-center font-bold">{qty}</span>
                <button onClick={inc} disabled={remaining <= 0} className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm active:scale-90 disabled:opacity-40"><Plus className="h-4 w-4" /></button>
              </div>
            )}
            {qty > 0 && (
              <Link to="/cart" className="text-sm font-semibold text-primary hover:underline">View cart →</Link>
            )}
          </div>

          {/* Description sections (rich HTML, sanitized) */}
          <div className="space-y-3 pt-2">
            <RichInfo label="Description" html={p.description} />
            <RichInfo label="Texture" html={p.texture} />
            <RichInfo label="Taste" html={p.taste} />
            <RichInfo label="Aroma" html={p.aroma} />
            <RichInfo label="Origin" html={p.origin} />
            <RichInfo label="Cooking notes" html={p.cooking_notes} />
            <RichInfo label="Quality level" html={p.quality_level} />
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-10" id="reviews">
        <h2 className="font-display text-xl font-bold mb-4">Reviews</h2>

        {user ? (
          <div id="review-form" className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="mb-2 text-sm font-semibold">Write a review</div>
            <div className="mb-3">
              <StarRating value={rating} onChange={setRating} size={28} />
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              placeholder="Share your experience…"
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
            />
            <button onClick={submitReview} disabled={submitting}
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95 active:scale-95 disabled:opacity-50 transition">
              <Send className="h-4 w-4" /> {submitting ? "Posting…" : "Post review"}
            </button>
          </div>
        ) : (
          <div className="mb-6 rounded-2xl border border-border bg-card p-4 text-sm">
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link> to leave a review.
          </div>
        )}

        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{r.customer_name}</span>
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <StarRating value={r.rating} readOnly size={16} />
                <p className="mt-2 text-sm">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RichInfo({ label, html }: { label: string; html: string | null | undefined }) {
  if (!html || !html.trim() || html.trim() === "<p></p>") return null;
  const clean = DOMPurify.sanitize(html);
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="rich-html text-sm" dangerouslySetInnerHTML={{ __html: clean }} />
    </div>
  );
}
