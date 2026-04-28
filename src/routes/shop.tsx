import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type Product } from "@/components/ProductCard";

export const Route = createFileRoute("/shop")({
  component: Shop,
  head: () => ({ meta: [{ title: "Shop — Oma's Store" }, { name: "description", content: "Browse food, beverages, toiletries and household essentials by category and brand." }] }),
});

type Grouped = Record<string, Record<string, Record<string, Product[]>>>;

function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState<string>("All");
  const [openSub, setOpenSub] = useState<Record<string, boolean>>({});
  const [openBrand, setOpenBrand] = useState<Record<string, boolean>>({});

  useEffect(() => {
    supabase.from("products").select("*").order("category").order("subcategory").order("brand").order("name")
      .then(({ data }) => setProducts((data ?? []) as Product[]));
  }, []);

  const filtered = useMemo(
    () => products.filter((p) => q.trim() === "" || p.name.toLowerCase().includes(q.toLowerCase()) || (p.brand ?? "").toLowerCase().includes(q.toLowerCase())),
    [products, q]
  );

  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((p) => p.category)))], [products]);

  const grouped = useMemo<Grouped>(() => {
    const g: Grouped = {};
    for (const p of filtered) {
      if (activeCat !== "All" && p.category !== activeCat) continue;
      const sub = p.subcategory ?? "Other";
      const brand = p.brand ?? "Other";
      g[p.category] ??= {};
      g[p.category][sub] ??= {};
      g[p.category][sub][brand] ??= [];
      g[p.category][sub][brand].push(p);
    }
    return g;
  }, [filtered, activeCat]);

  const toggleSub = (k: string) => setOpenSub((s) => ({ ...s, [k]: !(s[k] ?? true) }));
  const toggleBrand = (k: string) => setOpenBrand((s) => ({ ...s, [k]: !(s[k] ?? true) }));

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
      <div className="mb-6 space-y-4">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Shop</h1>
          <p className="text-sm text-muted-foreground">Browse by category, sub-category and brand.</p>
        </div>
        <input
          type="search"
          placeholder="Search products or brands…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-full border border-border bg-card px-5 py-3 text-sm outline-none ring-primary/20 focus:ring-2"
        />
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                activeCat === c ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">No products match your search.</p>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([cat, subs]) => (
            <section key={cat}>
              <h2 className="mb-3 font-display text-xl font-bold text-foreground">{cat}</h2>
              <div className="space-y-3">
                {Object.entries(subs).map(([sub, brands]) => {
                  const subKey = `${cat}/${sub}`;
                  const subOpen = openSub[subKey] ?? true;
                  const subCount = Object.values(brands).reduce((n, arr) => n + arr.length, 0);
                  return (
                    <div key={subKey} className="rounded-2xl border border-border bg-card shadow-card">
                      <button
                        onClick={() => toggleSub(subKey)}
                        className="flex w-full items-center justify-between gap-2 rounded-2xl px-4 py-3 text-left hover:bg-muted/40"
                      >
                        <span className="flex items-center gap-2 font-semibold">
                          {subOpen ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-primary" />}
                          {sub}
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">{subCount}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">{Object.keys(brands).length} brand{Object.keys(brands).length > 1 ? "s" : ""}</span>
                      </button>
                      {subOpen && (
                        <div className="space-y-3 px-3 pb-4">
                          {Object.entries(brands).map(([brand, list]) => {
                            const brandKey = `${subKey}/${brand}`;
                            const brandOpen = openBrand[brandKey] ?? true;
                            return (
                              <div key={brandKey} className="rounded-xl bg-gradient-to-r from-pink-soft/40 to-blue-soft/40 p-3">
                                <button
                                  onClick={() => toggleBrand(brandKey)}
                                  className="mb-2 flex w-full items-center justify-between text-left"
                                >
                                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    {brandOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                    {brand}
                                    <span className="text-[11px] font-normal text-muted-foreground">({list.length})</span>
                                  </span>
                                </button>
                                {brandOpen && (
                                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                    {list.map((p) => <ProductCard key={p.id} p={p} />)}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
