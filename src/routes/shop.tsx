import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type Product } from "@/components/ProductCard";

const CATEGORIES = ["All", "Food", "Beverages", "Household Items"] as const;

export const Route = createFileRoute("/shop")({
  component: Shop,
  head: () => ({ meta: [{ title: "Shop — Oma's Store" }, { name: "description", content: "Browse food, beverages and household essentials at Oma's Store, Enugu." }] }),
});

function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.from("products").select("*").order("category").order("name")
      .then(({ data }) => setProducts((data ?? []) as Product[]));
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) =>
      (cat === "All" || p.category === cat) &&
      (q.trim() === "" || p.name.toLowerCase().includes(q.toLowerCase()))
    );
  }, [products, cat, q]);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
      <div className="mb-6 space-y-4">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Shop</h1>
          <p className="text-sm text-muted-foreground">Everyday essentials, all in one place.</p>
        </div>
        <input
          type="search"
          placeholder="Search products…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-full border border-border bg-card px-5 py-3 text-sm outline-none ring-primary/20 focus:ring-2"
        />
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                cat === c ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">No products match your search.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
          {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
