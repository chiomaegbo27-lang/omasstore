import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatNGN } from "@/lib/store";
import { LOYALTY_TIERS } from "@/lib/loyalty";
import { Gift, ShoppingBag, Copy, Star, Package } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  component: AccountPage,
  head: () => ({ meta: [{ title: "My Account — Oma's Store" }] }),
});

interface OrderSummary {
  id: string;
  total: number;
  status: string;
  created_at: string;
  items: { name: string; qty: number }[];
}

function AccountPage() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [transactions, setTransactions] = useState<{ points: number; type: string; description: string | null; created_at: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("orders").select("id, total, status, created_at, items").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => setOrders((data ?? []) as OrderSummary[]));
    supabase.from("loyalty_transactions").select("points, type, description, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setTransactions(data ?? []));
  }, [user]);

  if (loading) return <div className="container mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">Loading…</div>;

  if (!user) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Sign in to view your account</h1>
        <Link to="/login" className="mt-4 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Sign in</Link>
      </div>
    );
  }

  const copyRef = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast.success("Referral code copied!");
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
      <h1 className="mb-6 font-display text-3xl font-bold">My Account</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Profile card */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-lg font-bold text-white">
              {(profile?.display_name ?? user.email)?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="font-semibold">{profile?.display_name ?? "Customer"}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
          </div>
          <button onClick={signOut} className="mt-2 w-full rounded-xl border border-border py-2 text-sm font-semibold hover:bg-muted">
            Sign out
          </button>
        </div>

        {/* Loyalty card */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-pink-soft to-blue-soft p-5 shadow-card">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-accent" />
            <span className="font-display text-lg font-bold">Loyalty Points</span>
          </div>
          <div className="mt-2 text-4xl font-extrabold text-primary">{profile?.loyalty_points ?? 0}</div>
          <div className="text-xs text-muted-foreground">= {formatNGN(profile?.loyalty_points ?? 0)} discount value</div>
          <div className="mt-3 space-y-1">
            {LOYALTY_TIERS.map((t) => (
              <div key={t.min} className="text-[11px] text-muted-foreground">{t.label}</div>
            ))}
          </div>
        </div>

        {/* Referral */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <span className="font-display font-bold">Refer & Earn</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Share your code. When friends sign up & order, you both earn bonus points!</p>
          {profile?.referral_code && (
            <button onClick={copyRef} className="mt-3 flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-mono font-bold">
              {profile.referral_code} <Copy className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Points history */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-5 w-5 text-primary" />
            <span className="font-display font-bold">Points History</span>
          </div>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="max-h-40 space-y-1.5 overflow-y-auto text-sm">
              {transactions.map((t, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-muted-foreground">{t.description ?? t.type}</span>
                  <span className={t.type === "redeemed" ? "text-destructive" : "text-primary"}>
                    {t.type === "redeemed" ? "-" : "+"}{Math.abs(t.points)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Orders */}
      <div className="mt-6">
        <h2 className="mb-3 font-display text-xl font-bold">Order History</h2>
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No orders yet.</p>
            <Link to="/shop" className="mt-3 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Start shopping</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <Link key={o.id} to="/order/$id" params={{ id: o.id }}
                className="block rounded-2xl border border-border bg-card p-4 shadow-card transition hover:shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold">#{o.id.slice(0, 8).toUpperCase()}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    o.status === "delivered" ? "bg-green-100 text-green-700" :
                    o.status === "in_delivery" ? "bg-blue-100 text-blue-700" :
                    o.status === "paid" ? "bg-yellow-100 text-yellow-700" :
                    "bg-secondary text-secondary-foreground"
                  }`}>{o.status}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {o.items?.map((i: { name: string; qty: number }) => `${i.name} ×${i.qty}`).join(", ")}
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</span>
                  <span className="font-bold text-primary">{formatNGN(o.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
