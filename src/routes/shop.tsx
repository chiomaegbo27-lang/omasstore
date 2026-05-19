import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type Product } from "@/components/ProductCard";

export const Route = createFileRoute("/shop")({
  component: Shop,
  head: () => ({ meta: [{ title: "Shop — Oma's Store" }, { name: "description", content: "Browse food, beverages, toiletries and household essentials by category, brand and unit." }] }),
});

type Grouped = Record<string, Record<string, Record<string, Product[]>>>;

function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState<string>("All");
  const [openBrand, setOpenBrand] = useState<Record<string, boolean>>({});
  const [openSub, setOpenSub] = useState<Record<string, boolean>>({});

  useEffect(() => {
    supabase
      .from("products")
      .select("*, product_variants(*)")
      .order("category").order("brand").order("subcategory").order("name")
      .then(({ data }) => setProducts((data ?? []) as Product[]));
  }, []);

  const filtered = useMemo(
    () => products.filter((p) => q.trim() === "" || p.name.toLowerCase().includes(q.toLowerCase()) || (p.brand ?? "").toLowerCase().includes(q.toLowerCase())),
    [products, q]
  );

  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((p) => p.category)))], [products]);

  // Category → Brand → Subcategory → Product
  const grouped = useMemo<Grouped>(() => {
    const g: Grouped = {};
    for (const p of filtered) {
      if (activeCat !== "All" && p.category !== activeCat) continue;
      const brand = p.brand ?? "Other";
      const sub = p.subcategory ?? "Other";
      g[p.category] ??= {};
      g[p.category][brand] ??= {};
      g[p.category][brand][sub] ??= [];
      g[p.category][brand][sub].push(p);
    }
    return g;
  }, [filtered, activeCat]);

  const toggleBrand = (k: string) => setOpenBrand((s) => ({ ...s, [k]: !(s[k] ?? true) }));
  const toggleSub = (k: string) => setOpenSub((s) => ({ ...s, [k]: !(s[k] ?? true) }));

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
      <div className="mb-6 space-y-4">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Shop</h1>
          <p className="text-sm text-muted-foreground">Browse by category, brand and sub-category. Pick your unit on each product.</p>
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
          {Object.entries(grouped).map(([cat, brands]) => (
            <section key={cat}>
              <h2 className="mb-3 font-display text-xl font-bold text-foreground">{cat}</h2>
              <div className="space-y-3">
                {Object.entries(brands).map(([brand, subs]) => {
                  const brandKey = `${cat}/${brand}`;
                  const brandOpen = openBrand[brandKey] ?? true;
                  const brandCount = Object.values(subs).reduce((n, arr) => n + arr.length, 0);
                  return (
                    <div key={brandKey} className="rounded-2xl border border-border bg-card shadow-card">
                      <button
                        onClick={() => toggleBrand(brandKey)}
                        className="flex w-full items-center justify-between gap-2 rounded-2xl px-4 py-3 text-left hover:bg-muted/40"
                      >
                        <span className="flex items-center gap-2 font-semibold">
                          {brandOpen ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-primary" />}
                          {brand}
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">{brandCount}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">{Object.keys(subs).length} type{Object.keys(subs).length > 1 ? "s" : ""}</span>
                      </button>
                      {brandOpen && (
                        <div className="space-y-3 px-3 pb-4">
                          {Object.entries(subs).map(([sub, list]) => {
                            const subKey = `${brandKey}/${sub}`;
                            const subOpen = openSub[subKey] ?? true;
                            return (
                              <div key={subKey} className="rounded-xl bg-gradient-to-r from-pink-soft/40 to-blue-soft/40 p-3">
                                <button
                                  onClick={() => toggleSub(subKey)}
                                  className="mb-2 flex w-full items-center justify-between text-left"
                                >
                                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    {subOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                    {sub}
                                    <span className="text-[11px] font-normal text-muted-foreground">({list.length})</span>
                                  </span>
                                </button>
                                {subOpen && (
                                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                    {list.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
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
