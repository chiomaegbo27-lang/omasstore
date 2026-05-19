import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatNGN, STORE } from "@/lib/store";
import { toast } from "sonner";
import {
  ShoppingCart, Users, Package, TrendingUp,
  Truck, CheckCircle2, Clock, Star, RefreshCw,
  Plus, Pencil, Trash2, Save, X, BarChart3, Calendar, MessageSquare
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin Dashboard — Oma's Store" }] }),
});

type OrderRow = {
  id: string; customer_name: string; phone: string; total: number; status: string;
  fulfillment: string; zone: string | null; address: string | null; created_at: string;
  items: { name: string; qty: number; price: number }[];
};

type MealOrderRow = {
  id: string; customer_name: string; phone: string; total: number; status: string;
  created_at: string; meal_id: string;
};

type ProductRow = {
  id: string; name: string; description: string | null; price: number; category: string;
  emoji: string | null; in_stock: boolean; stock: number; unit: string | null;
  subcategory: string | null; brand: string | null; image_url: string | null;
  video_url: string | null;
  texture: string | null; taste: string | null; aroma: string | null;
  cooking_notes: string | null; origin: string | null; pricing_unit: string | null;
  quality_level: string | null;
};

const emptyProduct: Omit<ProductRow, "id"> = {
  name: "", description: "", price: 0, category: "", emoji: "🛒",
  in_stock: true, stock: 20, unit: null, subcategory: null, brand: null,
  image_url: null, video_url: null, texture: null, taste: null, aroma: null,
  cooking_notes: null, origin: null, pricing_unit: null, quality_level: null,
};

async function uploadFile(bucket: string, file: File): Promise<string | null> {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) { toast.error(error.message); return null; }
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

type VariantRow = {
  id: string; product_id: string; unit: string; measurement: string | null;
  price: number; stock: number; is_default: boolean; sort_order: number;
};

type ReviewRow = {
  id: string; product_id: string | null; customer_name: string; rating: number;
  comment: string; is_approved: boolean; created_at: string;
  products?: { name: string } | null;
};

function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"orders" | "meals" | "customers" | "products" | "reviews" | "sales">("orders");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [mealOrders, setMealOrders] = useState<MealOrderRow[]>([]);
  const [customers, setCustomers] = useState<{ user_id: string; display_name: string | null; loyalty_points: number; phone: string | null; created_at: string }[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [variantsByProduct, setVariantsByProduct] = useState<Record<string, VariantRow[]>>({});
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, totalCustomers: 0, avgOrder: 0 });
  const [editingProduct, setEditingProduct] = useState<(Partial<ProductRow> & { isNew?: boolean }) | null>(null);

  useEffect(() => {
    if (authLoading || !user || !isAdmin) return;
    loadData();
  }, [user, isAdmin, authLoading]);

  const loadData = async () => {
    const [ordersRes, mealOrdersRes, profilesRes, productsRes, variantsRes, reviewsRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("meal_orders").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("profiles").select("user_id, display_name, loyalty_points, phone, created_at").order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("category").order("name"),
      supabase.from("product_variants").select("*").order("sort_order"),
      supabase.from("reviews").select("*, products(name)").order("created_at", { ascending: false }).limit(200),
    ]);
    const o = (ordersRes.data ?? []) as unknown as OrderRow[];
    setOrders(o);
    setMealOrders((mealOrdersRes.data ?? []) as MealOrderRow[]);
    setCustomers(profilesRes.data ?? []);
    setProducts((productsRes.data ?? []) as ProductRow[]);
    const vmap: Record<string, VariantRow[]> = {};
    for (const v of (variantsRes.data ?? []) as VariantRow[]) {
      (vmap[v.product_id] ??= []).push(v);
    }
    setVariantsByProduct(vmap);
    setReviews((reviewsRes.data ?? []) as unknown as ReviewRow[]);
    setStats({
      totalOrders: o.length,
      totalRevenue: o.reduce((s, x) => s + x.total, 0),
      totalCustomers: profilesRes.data?.length ?? 0,
      avgOrder: o.length ? o.reduce((s, x) => s + x.total, 0) / o.length : 0,
    });
  };

  // Sales analytics
  const salesData = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const thisMonth = now.toISOString().slice(0, 7);
    const thisYear = now.getFullYear().toString();

    let dayTotal = 0, dayCount = 0;
    let monthTotal = 0, monthCount = 0;
    let yearTotal = 0, yearCount = 0;

    for (const o of orders) {
      const d = o.created_at.slice(0, 10);
      const m = o.created_at.slice(0, 7);
      const y = o.created_at.slice(0, 4);
      if (d === today) { dayTotal += o.total; dayCount++; }
      if (m === thisMonth) { monthTotal += o.total; monthCount++; }
      if (y === thisYear) { yearTotal += o.total; yearCount++; }
    }
    return { dayTotal, dayCount, monthTotal, monthCount, yearTotal, yearCount };
  }, [orders]);

  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`Order → ${status}`);
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
  };

  const updateMealStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("meal_orders").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`Meal order → ${status}`);
    setMealOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
  };

  const saveProduct = async () => {
    if (!editingProduct || !editingProduct.name || !editingProduct.category) {
      toast.error("Name and category are required"); return;
    }
    const { isNew, id, created_at, ...data } = editingProduct as any;
    if (isNew) {
      const { error } = await supabase.from("products").insert(data);
      if (error) { toast.error(error.message); return; }
      toast.success("Product added!");
    } else {
      const { error } = await supabase.from("products").update(data).eq("id", id);
      if (error) { toast.error(error.message); return; }
      toast.success("Product updated!");
    }
    setEditingProduct(null);
    loadData();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product? Its variants will also be removed.")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Product deleted");
    loadData();
  };

  const addVariant = async (productId: string) => {
    const unit = prompt("Unit (e.g. cup, bag, painter, sachet, 75cl bottle, piece, tuber)")?.trim();
    if (!unit) return;
    const measurement = prompt("Measurement label (optional, e.g. 75cl, 50kg) — leave blank to skip")?.trim() || null;
    const priceStr = prompt("Price in ₦")?.trim();
    if (!priceStr) return;
    const price = Number(priceStr);
    if (!Number.isFinite(price) || price < 0) { toast.error("Invalid price"); return; }
    const stockStr = prompt("Stock available")?.trim() || "0";
    const stock = Math.max(0, Math.floor(Number(stockStr) || 0));
    const existing = variantsByProduct[productId] ?? [];
    const sort_order = existing.length;
    const is_default = existing.length === 0;
    const { error } = await supabase.from("product_variants").insert({
      product_id: productId, unit, measurement, price, stock, is_default, sort_order,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Variant added");
    loadData();
  };

  const updateVariant = async (id: string, patch: Partial<VariantRow>) => {
    const { error } = await supabase.from("product_variants").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    loadData();
  };

  const deleteVariant = async (id: string) => {
    if (!confirm("Delete this variant?")) return;
    const { error } = await supabase.from("product_variants").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Variant deleted");
    loadData();
  };

  const setReviewApproved = async (id: string, is_approved: boolean) => {
    const { error } = await supabase.from("reviews").update({ is_approved }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setReviews((p) => p.map((r) => r.id === id ? { ...r, is_approved } : r));
  };
  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setReviews((p) => p.filter((r) => r.id !== id));
    toast.success("Review deleted");
  };

  if (authLoading) return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground animate-fade-in">Loading…</div>;

  if (!user) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center animate-fade-in">
        <h1 className="font-display text-2xl font-bold">Admin Access Required</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please sign in with an admin account.</p>
        <Link to="/login" className="mt-4 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Sign in</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center animate-fade-in">
        <h1 className="font-display text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your account doesn't have admin privileges.</p>
        <Link to="/" className="mt-4 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Go home</Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    paid: "bg-blue-100 text-blue-700",
    in_delivery: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    preparing: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 md:py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
        <button onClick={loadData} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition active:scale-95">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
        {[
          { label: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, color: "text-primary" },
          { label: "Revenue", value: formatNGN(stats.totalRevenue), icon: TrendingUp, color: "text-green-600" },
          { label: "Customers", value: stats.totalCustomers, icon: Users, color: "text-accent" },
          { label: "Avg Order", value: formatNGN(stats.avgOrder), icon: Package, color: "text-blue-600" },
        ].map(({ label, value, icon: I, color }, idx) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-card transition hover:shadow-soft" style={{ animationDelay: `${idx * 80}ms` }}>
            <div className="flex items-center gap-2 mb-1">
              <I className={`h-4 w-4 ${color}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <div className="text-xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {([
          { key: "orders" as const, label: "📦 Orders" },
          { key: "meals" as const, label: "🍲 Meals" },
          { key: "customers" as const, label: "👥 Customers" },
          { key: "products" as const, label: "📋 Products" },
          { key: "reviews" as const, label: "⭐ Reviews" },
          { key: "sales" as const, label: "📊 Sales" },
        ]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition active:scale-95 ${tab === t.key ? "bg-primary text-white" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders tab */}
      {tab === "orders" && (
        <div className="space-y-3">
          {orders.length === 0 ? <p className="text-center text-muted-foreground py-8">No orders yet.</p> : orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-border bg-card p-4 shadow-card transition hover:shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                  <span className="font-mono text-sm font-semibold">#{o.id.slice(0, 8).toUpperCase()}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusColors[o.status] ?? "bg-gray-100"}`}>{o.status}</span>
              </div>
              <div className="text-sm"><strong>{o.customer_name}</strong> • {o.phone}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {o.items?.map((i) => `${i.name} ×${i.qty}`).join(", ")}
              </div>
              <div className="text-sm font-bold text-primary mt-1">{formatNGN(o.total)} • {o.fulfillment}{o.zone ? ` (Zone ${o.zone})` : ""}</div>
              {o.address && <div className="text-xs text-muted-foreground mt-1">📍 {o.address}</div>}
              <div className="flex flex-wrap gap-2 mt-3">
                {["pending", "paid", "in_delivery", "delivered"].map((s) => (
                  <button key={s} onClick={() => updateOrderStatus(o.id, s)} disabled={o.status === s}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${o.status === s ? "bg-primary text-white" : "border border-border hover:bg-muted"}`}>
                    {s === "pending" && <Clock className="inline h-3 w-3 mr-1" />}
                    {s === "paid" && <CheckCircle2 className="inline h-3 w-3 mr-1" />}
                    {s === "in_delivery" && <Truck className="inline h-3 w-3 mr-1" />}
                    {s === "delivered" && <Package className="inline h-3 w-3 mr-1" />}
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Meal orders tab */}
      {tab === "meals" && (
        <div className="space-y-3">
          {mealOrders.length === 0 ? <p className="text-center text-muted-foreground py-8">No meal orders yet.</p> : mealOrders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm font-semibold">#{o.id.slice(0, 8).toUpperCase()}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusColors[o.status] ?? "bg-gray-100"}`}>{o.status}</span>
              </div>
              <div className="text-sm"><strong>{o.customer_name}</strong> • {o.phone}</div>
              <div className="text-sm font-bold text-primary mt-1">{formatNGN(o.total)}</div>
              <div className="flex flex-wrap gap-2 mt-3">
                {["pending", "preparing", "in_delivery", "delivered"].map((s) => (
                  <button key={s} onClick={() => updateMealStatus(o.id, s)} disabled={o.status === s}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${o.status === s ? "bg-primary text-white" : "border border-border hover:bg-muted"}`}>
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customers tab */}
      {tab === "customers" && (
        <div className="space-y-2">
          {customers.length === 0 ? <p className="text-center text-muted-foreground py-8">No customers yet.</p> : customers.map((c) => (
            <div key={c.user_id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card transition hover:shadow-soft">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-sm font-bold">
                {(c.display_name ?? "?")?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{c.display_name ?? "Unknown"}</div>
                <div className="text-xs text-muted-foreground">{c.phone ?? "No phone"} • Joined {new Date(c.created_at).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 text-accent" />
                <span className="font-bold">{c.loyalty_points}</span>
                <span className="text-xs text-muted-foreground">pts</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Products tab with editor */}
      {tab === "products" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{products.length} products</span>
            <button onClick={() => setEditingProduct({ ...emptyProduct, isNew: true })}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-95 active:scale-95">
              <Plus className="h-4 w-4" /> Add Product
            </button>
          </div>

          {/* Product editor modal */}
          {editingProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setEditingProduct(null)}>
              <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-glow" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-bold">{editingProduct.isNew ? "Add Product" : "Edit Product"}</h3>
                  <button onClick={() => setEditingProduct(null)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"><X className="h-4 w-4" /></button>
                </div>
                <div className="space-y-3">
                  <PField label="Name" value={editingProduct.name ?? ""} onChange={(v) => setEditingProduct({ ...editingProduct, name: v })} />
                  <PField label="Category" value={editingProduct.category ?? ""} onChange={(v) => setEditingProduct({ ...editingProduct, category: v })} placeholder="e.g. Grains, Beverages, Toiletries" />
                  <PField label="Subcategory" value={editingProduct.subcategory ?? ""} onChange={(v) => setEditingProduct({ ...editingProduct, subcategory: v || null })} placeholder="e.g. Rice, Soft drinks" />
                  <PField label="Brand" value={editingProduct.brand ?? ""} onChange={(v) => setEditingProduct({ ...editingProduct, brand: v || null })} placeholder="e.g. Indomie, Close-Up" />
                  <div className="grid grid-cols-2 gap-3">
                    <PField label="Price (₦)" value={String(editingProduct.price ?? 0)} onChange={(v) => setEditingProduct({ ...editingProduct, price: Number(v) || 0 })} type="number" />
                    <PField label="Stock" value={String(editingProduct.stock ?? 20)} onChange={(v) => setEditingProduct({ ...editingProduct, stock: Number(v) || 0 })} type="number" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <PField label="Unit" value={editingProduct.unit ?? ""} onChange={(v) => setEditingProduct({ ...editingProduct, unit: v || null })} placeholder="e.g. bag, cup, pack" />
                    <PField label="Emoji" value={editingProduct.emoji ?? ""} onChange={(v) => setEditingProduct({ ...editingProduct, emoji: v || null })} placeholder="🍚" />
                  </div>
                  <PField label="Description" value={editingProduct.description ?? ""} onChange={(v) => setEditingProduct({ ...editingProduct, description: v || null })} />
                  <PField label="Taste" value={editingProduct.taste ?? ""} onChange={(v) => setEditingProduct({ ...editingProduct, taste: v || null })} placeholder="e.g. Sweet, Savoury" />
                  <PField label="Aroma" value={editingProduct.aroma ?? ""} onChange={(v) => setEditingProduct({ ...editingProduct, aroma: v || null })} placeholder="e.g. Rich, Smoky" />
                  <PField label="Texture" value={editingProduct.texture ?? ""} onChange={(v) => setEditingProduct({ ...editingProduct, texture: v || null })} placeholder="e.g. Smooth, Crunchy" />
                  <PField label="Origin" value={editingProduct.origin ?? ""} onChange={(v) => setEditingProduct({ ...editingProduct, origin: v || null })} placeholder="e.g. Abakaliki, Foreign" />
                  <PField label="Cooking notes" value={editingProduct.cooking_notes ?? ""} onChange={(v) => setEditingProduct({ ...editingProduct, cooking_notes: v || null })} placeholder="e.g. Cook for 30 mins" />
                  <PField label="Quality level" value={editingProduct.quality_level ?? ""} onChange={(v) => setEditingProduct({ ...editingProduct, quality_level: v || null })} placeholder="e.g. Premium, Standard" />

                  {/* Product image upload */}
                  <div>
                    <span className="mb-1 block text-xs font-semibold text-muted-foreground">Product Image</span>
                    {editingProduct.image_url && (
                      <img src={editingProduct.image_url} alt="preview" className="mb-2 h-24 w-24 rounded-lg object-cover border border-border" />
                    )}
                    <input type="file" accept="image/*" onChange={async (e) => {
                      const f = e.target.files?.[0]; if (!f) return;
                      const url = await uploadFile("product-images", f);
                      if (url) { setEditingProduct({ ...editingProduct, image_url: url }); toast.success("Image uploaded"); }
                    }} className="block w-full text-xs" />
                  </div>

                  {/* Brand advert video upload */}
                  <div>
                    <span className="mb-1 block text-xs font-semibold text-muted-foreground">Brand Advert Video (optional)</span>
                    {editingProduct.video_url && (
                      <video src={editingProduct.video_url} className="mb-2 h-24 rounded-lg border border-border" controls />
                    )}
                    <input type="file" accept="video/*" onChange={async (e) => {
                      const f = e.target.files?.[0]; if (!f) return;
                      if (f.size > 50 * 1024 * 1024) { toast.error("Video must be under 50MB"); return; }
                      toast.info("Uploading video…");
                      const url = await uploadFile("product-videos", f);
                      if (url) { setEditingProduct({ ...editingProduct, video_url: url }); toast.success("Video uploaded"); }
                    }} className="block w-full text-xs" />
                  </div>

                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={editingProduct.in_stock ?? true} onChange={(e) => setEditingProduct({ ...editingProduct, in_stock: e.target.checked })} className="accent-primary" />
                    <span className="text-sm">In stock</span>
                  </div>
                  <button onClick={saveProduct}
                    className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:opacity-95 active:scale-95">
                    <Save className="inline h-4 w-4 mr-1.5" />
                    {editingProduct.isNew ? "Add Product" : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Product list with inline variants */}
          <div className="space-y-3">
            {products.map((p) => {
              const vs = variantsByProduct[p.id] ?? [];
              return (
                <div key={p.id} className="rounded-2xl border border-border bg-card p-3 shadow-card transition hover:shadow-soft">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.emoji ?? "🛒"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.category}{p.brand ? ` › ${p.brand}` : ""}{p.subcategory ? ` › ${p.subcategory}` : ""} {vs.length === 0 ? `• ${formatNGN(p.price)} • Stock: ${p.stock}` : `• ${vs.length} variant${vs.length > 1 ? "s" : ""}`}</div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditingProduct(p)} title="Edit product" className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-muted transition active:scale-95">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteProduct(p.id)} title="Delete product" className="grid h-8 w-8 place-items-center rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition active:scale-95">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Variants */}
                  <div className="mt-3 rounded-xl bg-muted/30 p-2">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Units & prices</span>
                      <button onClick={() => addVariant(p.id)} className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:opacity-95 active:scale-95">
                        <Plus className="h-3 w-3" /> Add unit
                      </button>
                    </div>
                    {vs.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground italic">No variants — uses the product price/stock above. Add units like cup, bag, painter, 75cl bottle, sachet, piece, tuber, etc.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {vs.map((v) => (
                          <div key={v.id} className="flex flex-wrap items-center gap-1.5 text-xs">
                            <input defaultValue={v.measurement ?? ""} placeholder="size (75cl)" onBlur={(e) => { const val = e.target.value.trim() || null; if (val !== v.measurement) updateVariant(v.id, { measurement: val }); }} className="w-20 rounded-md border border-border bg-background px-1.5 py-1" />
                            <input defaultValue={v.unit} onBlur={(e) => { const val = e.target.value.trim(); if (val && val !== v.unit) updateVariant(v.id, { unit: val }); }} className="w-24 rounded-md border border-border bg-background px-1.5 py-1 font-semibold" />
                            <span className="text-muted-foreground">₦</span>
                            <input type="number" defaultValue={v.price} onBlur={(e) => { const val = Number(e.target.value); if (Number.isFinite(val) && val !== Number(v.price)) updateVariant(v.id, { price: val }); }} className="w-24 rounded-md border border-border bg-background px-1.5 py-1" />
                            <span className="text-muted-foreground">stock</span>
                            <input type="number" defaultValue={v.stock} onBlur={(e) => { const val = Math.max(0, Math.floor(Number(e.target.value) || 0)); if (val !== v.stock) updateVariant(v.id, { stock: val }); }} className="w-16 rounded-md border border-border bg-background px-1.5 py-1" />
                            <label className="inline-flex items-center gap-1 text-[11px]">
                              <input type="checkbox" defaultChecked={v.is_default} onChange={(e) => updateVariant(v.id, { is_default: e.target.checked })} className="accent-primary" />
                              default
                            </label>
                            <button onClick={() => deleteVariant(v.id)} className="ml-auto grid h-7 w-7 place-items-center rounded-md text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <p className="text-[10px] text-muted-foreground italic mt-1">Edits save when you click out of the field.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews tab */}
      {tab === "reviews" && (
        <div className="space-y-3">
          {reviews.length === 0 ? <p className="text-center text-muted-foreground py-8">No reviews yet.</p> : reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-sm">{r.customer_name}</span>
                  {r.products?.name && <span className="text-xs text-muted-foreground"> · {r.products.name}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((n) => (
                      <Star key={n} className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.is_approved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {r.is_approved ? "approved" : "hidden"}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm">{r.comment}</p>
              <div className="mt-2 text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setReviewApproved(r.id, !r.is_approved)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted">
                  <MessageSquare className="inline h-3 w-3 mr-1" /> {r.is_approved ? "Hide" : "Approve"}
                </button>
                <button onClick={() => deleteReview(r.id)} className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10">
                  <Trash2 className="inline h-3 w-3 mr-1" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sales tab */}
      {tab === "sales" && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid gap-4 md:grid-cols-3">
            <SalesCard icon={Calendar} label="Today" total={salesData.dayTotal} count={salesData.dayCount} color="text-primary" />
            <SalesCard icon={BarChart3} label="This Month" total={salesData.monthTotal} count={salesData.monthCount} color="text-accent" />
            <SalesCard icon={TrendingUp} label="This Year" total={salesData.yearTotal} count={salesData.yearCount} color="text-green-600" />
          </div>

          {/* Recent orders breakdown */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="font-display text-lg font-bold mb-4">Recent Sales</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {orders.slice(0, 20).map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
                  <div>
                    <span className="text-sm font-semibold">{o.customer_name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[o.status] ?? "bg-gray-100"}`}>{o.status}</span>
                    <span className="text-sm font-bold text-primary">{formatNGN(o.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" />
    </label>
  );
}

function SalesCard({ icon: I, label, total, count, color }: { icon: typeof Calendar; label: string; total: number; count: number; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card transition hover:shadow-soft">
      <div className="flex items-center gap-2 mb-3">
        <I className={`h-5 w-5 ${color}`} />
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <div className="text-2xl font-bold">{formatNGN(total)}</div>
      <div className="text-xs text-muted-foreground mt-1">{count} order{count !== 1 ? "s" : ""}</div>
    </div>
  );
}
