import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Plus, Minus, Play, Pause, Star, Send, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart, cartLineId } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatNGN } from "@/lib/store";
import { toast } from "sonner";
import type { Product, ProductVariant } from "@/components/ProductCard";

export const Route = createFileRoute("/product/$id")({
  component: ProductDetail,
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

function ProductDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { items, add, setQty } = useCart();

  const [p, setP] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const load = async () => {
    setLoading(true);
    const [pr, rr] = await Promise.all([
      supabase.from("products").select("*, product_variants(*)").eq("id", id).maybeSingle(),
      supabase.from("reviews").select("*").eq("product_id", id).eq("is_approved", true).order("created_at", { ascending: false }).limit(50),
    ]);
    const prod = pr.data as Product | null;
    setP(prod);
    setReviews((rr.data ?? []) as Review[]);
    if (prod?.product_variants?.length) {
      const def = prod.product_variants.find((v) => v.is_default) ?? prod.product_variants[0];
      setSelectedVariantId(def.id);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

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

  const toggleVideo = () => {
    const v = videoRef.current; if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

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
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-pink-soft to-blue-soft shadow-card">
          {p.video_url ? (
            <>
              <video
                ref={videoRef}
                src={p.video_url}
                poster={p.image_url ?? undefined}
                preload="metadata"
                playsInline
                controls={playing}
                onEnded={() => setPlaying(false)}
                className="h-full w-full object-cover"
              />
              {!playing && (
                <button onClick={toggleVideo} aria-label="Play advert" className="absolute inset-0 grid place-items-center bg-black/10 hover:bg-black/20 transition">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-primary shadow-glow">
                    <Play className="h-7 w-7 ml-1" />
                  </span>
                </button>
              )}
            </>
          ) : p.image_url ? (
            <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-8xl">{p.emoji ?? "🛒"}</div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">
            {p.category}{p.brand ? ` › ${p.brand}` : ""}{p.subcategory ? ` › ${p.subcategory}` : ""}
          </div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">{p.name}</h1>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Stars value={avgRating} />
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

          {/* Description sections */}
          <div className="space-y-3 pt-2">
            {p.description && <Info label="Description">{p.description}</Info>}
            {p.texture && <Info label="Texture">{p.texture}</Info>}
            {p.taste && <Info label="Taste">{p.taste}</Info>}
            {p.aroma && <Info label="Aroma">{p.aroma}</Info>}
            {p.origin && <Info label="Origin">{p.origin}</Info>}
            {p.cooking_notes && <Info label="Cooking notes">{p.cooking_notes}</Info>}
            {p.quality_level && <Info label="Quality level">{p.quality_level}</Info>}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-bold mb-4">Reviews</h2>

        {user ? (
          <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="mb-2 text-sm font-semibold">Write a review</div>
            <div className="mb-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                  <Star className={`h-6 w-6 transition ${n <= rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                </button>
              ))}
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
                <Stars value={r.rating} />
                <p className="mt-2 text-sm">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-4 w-4 ${n <= Math.round(value) ? "fill-accent text-accent" : "text-muted-foreground/40"}`} />
      ))}
    </div>
  );
}
