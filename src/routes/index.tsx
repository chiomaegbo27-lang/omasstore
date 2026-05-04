import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Truck, ShieldCheck, Clock, ChefHat, Star, Phone, MessageCircle } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type Product } from "@/components/ProductCard";
import { STORE } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: `${STORE.name} — Groceries & Essentials Delivered in Enugu` },
      { name: "description", content: "Garri, rice, noodles, drinks & household essentials. Order via WhatsApp, pay on delivery zones across Enugu." },
    ],
  }),
});

function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    supabase.from("products").select("*").eq("in_stock", true).limit(8)
      .then(({ data }) => setFeatured((data ?? []) as Product[]));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden animate-fade-in" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-2 md:items-center md:py-20">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground animate-fade-in" style={{ animationDelay: "100ms" }}>
              🛵 Same-day delivery in Enugu
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl animate-fade-in" style={{ animationDelay: "200ms" }}>
              Your everyday store, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">just a tap away.</span>
            </h1>
            <p className="max-w-md text-base text-muted-foreground md:text-lg animate-fade-in" style={{ animationDelay: "300ms" }}>{STORE.tagline}</p>
            <div className="flex flex-wrap gap-3 animate-fade-in" style={{ animationDelay: "400ms" }}>
              <Link to="/shop" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-all duration-200 hover:opacity-95 hover:scale-105 active:scale-95">
                Shop Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/meals" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold transition-all duration-200 hover:bg-muted hover:scale-105 active:scale-95">
                <ChefHat className="h-4 w-4" /> Order a Meal
              </Link>
            </div>
            {/* Quick order buttons */}
            <div className="flex items-center gap-4 pt-2 animate-fade-in" style={{ animationDelay: "500ms" }}>
              <a href={`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent("Hello, I'd like to place an order!")}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-whatsapp px-5 py-2.5 text-sm font-semibold text-whatsapp-foreground shadow-sm transition-all duration-200 hover:scale-105 active:scale-95">
                <MessageCircle className="h-4 w-4" /> WhatsApp Order
              </a>
              <a href={`tel:${STORE.phone}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:bg-muted hover:scale-105 active:scale-95">
                <Phone className="h-4 w-4" /> Call to Order
              </a>
            </div>
          </div>
          <div className="relative animate-fade-in" style={{ animationDelay: "300ms" }}>
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-pink-soft to-blue-soft blur-2xl" />
            <img src={heroImg} alt="Basket of fresh Nigerian groceries" width={1280} height={896} className="relative mx-auto w-full max-w-md rounded-[2rem] shadow-glow transition-transform duration-500 hover:scale-[1.02]" />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-border bg-background">
        <div className="container mx-auto grid max-w-6xl grid-cols-4 gap-2 px-4 py-5 text-center text-xs sm:text-sm">
          {[
            { icon: Truck, t: "Fast delivery", s: "From ₦300" },
            { icon: ShieldCheck, t: "Genuine items", s: "Quality guaranteed" },
            { icon: Clock, t: "Open daily", s: "8am – 8pm" },
            { icon: Star, t: "Earn points", s: "On orders ₦6k+" },
          ].map(({ icon: I, t, s }, idx) => (
            <div key={t} className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-center sm:gap-2 animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
              <I className="h-5 w-5 text-primary" />
              <div className="leading-tight"><div className="font-semibold">{t}</div><div className="text-muted-foreground">{s}</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">Featured today</h2>
            <p className="text-sm text-muted-foreground">Hand-picked essentials at fair prices.</p>
          </div>
          <Link to="/shop" className="text-sm font-semibold text-primary transition hover:underline hover:scale-105">See all →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
          {featured.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
        </div>
      </section>

      {/* Meals CTA */}
      <section className="bg-gradient-to-br from-pink-soft to-blue-soft">
        <div className="container mx-auto max-w-6xl px-4 py-12 text-center md:py-16">
          <ChefHat className="mx-auto h-10 w-10 text-accent mb-3" />
          <h2 className="font-display text-2xl font-bold md:text-3xl">Can't cook? Let us do it!</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Choose a meal, pick your ingredients, and we'll prepare it fresh. Pickup or delivery!</p>
          <Link to="/meals" className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-white shadow-soft transition-all duration-200 hover:opacity-95 hover:scale-105 active:scale-95">
            Order a Custom Meal <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
