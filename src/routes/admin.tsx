import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatNGN, STORE } from "@/lib/store";
import { toast } from "sonner";
import {
  ShoppingCart, Users, Package, TrendingUp, ChevronDown, 
  Eye, Truck, CheckCircle2, Clock, ChefHat, Star, RefreshCw
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

function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"orders" | "meals" | "customers" | "products">("orders");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [mealOrders, setMealOrders] = useState<MealOrderRow[]>([]);
  const [customers, setCustomers] = useState<{ user_id: string; display_name: string | null; loyalty_points: number; phone: string | null; created_at: string }[]>([]);
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, totalCustomers: 0, avgOrder: 0 });

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) return;
    loadData();
  }, [user, isAdmin, authLoading]);

  const loadData = async () => {
    const [ordersRes, mealOrdersRes, profilesRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("meal_orders").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("profiles").select("user_id, display_name, loyalty_points, phone, created_at").order("created_at", { ascending: false }),
    ]);
    const o = (ordersRes.data ?? []) as unknown as OrderRow[];
    setOrders(o);
    setMealOrders((mealOrdersRes.data ?? []) as MealOrderRow[]);
    setCustomers(profilesRes.data ?? []);
    setStats({
      totalOrders: o.length,
      totalRevenue: o.reduce((s, x) => s + x.total, 0),
      totalCustomers: profilesRes.data?.length ?? 0,
      avgOrder: o.length ? o.reduce((s, x) => s + x.total, 0) / o.length : 0,
    });
  };

  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`Order updated to ${status}`);
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
  };

  const updateMealStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("meal_orders").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`Meal order updated to ${status}`);
    setMealOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
  };

  if (authLoading) return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Loading…</div>;

  if (!user) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Admin Access Required</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please sign in with an admin account.</p>
        <Link to="/login" className="mt-4 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Sign in</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center">
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
    <div className="container mx-auto max-w-6xl px-4 py-6 md:py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
        <button onClick={loadData} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
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
        ].map(({ label, value, icon: I, color }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center gap-2 mb-1">
              <I className={`h-4 w-4 ${color}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <div className="text-xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(["orders", "meals", "customers", "products"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${tab === t ? "bg-primary text-white" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
            {t === "orders" ? "📦 Orders" : t === "meals" ? "🍲 Meal Orders" : t === "customers" ? "👥 Customers" : "📋 Products"}
          </button>
        ))}
      </div>

      {/* Orders tab */}
      {tab === "orders" && (
        <div className="space-y-3">
          {orders.length === 0 ? <p className="text-center text-muted-foreground py-8">No orders yet.</p> : orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
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
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${o.status === s ? "bg-primary text-white" : "border border-border hover:bg-muted"}`}>
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
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${o.status === s ? "bg-primary text-white" : "border border-border hover:bg-muted"}`}>
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
            <div key={c.user_id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
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

      {/* Products tab */}
      {tab === "products" && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">Product management coming soon. Currently manage products through the backend.</p>
        </div>
      )}
    </div>
  );
}
