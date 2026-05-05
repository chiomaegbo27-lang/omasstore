import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatNGN } from "@/lib/store";
import { calculatePointsEarned, pointsToNaira } from "@/lib/loyalty";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  component: Checkout,
  head: () => ({ meta: [{ title: "Checkout — Oma's Store" }] }),
});

interface DeliveryLoc { id: string; name: string; zone: string; fee: number; estimated_time: string; }

function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("delivery");
  const [locationId, setLocationId] = useState("");
  const [locations, setLocations] = useState<DeliveryLoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);

  useEffect(() => {
    supabase.from("delivery_locations").select("*").order("name").then(({ data }) => {
      setLocations((data ?? []) as DeliveryLoc[]);
    });
  }, []);

  // Pre-fill from profile
  useEffect(() => {
    if (profile) {
      if (profile.display_name) setName(profile.display_name);
      if (profile.phone) setPhone(profile.phone);
      if (profile.address) setAddress(profile.address);
    }
  }, [profile]);

  const selectedLoc = locations.find((l) => l.id === locationId);
  const deliveryFee = fulfillment === "delivery" && selectedLoc ? selectedLoc.fee : 0;
  const pointsDiscount = pointsToNaira(pointsToUse);
  const total = Math.max(0, subtotal + deliveryFee - pointsDiscount);
  const pointsEarned = calculatePointsEarned(total);
  const maxPoints = Math.min(profile?.loyalty_points ?? 0, subtotal + deliveryFee);

  const canSubmit = useMemo(() => {
    if (items.length === 0) return false;
    if (!name.trim() || !phone.trim()) return false;
    if (fulfillment === "delivery" && (!address.trim() || !locationId)) return false;
    return true;
  }, [items, name, phone, address, fulfillment, locationId]);

  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Nothing to checkout</h1>
        <Link to="/shop" className="mt-4 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Go to shop</Link>
      </div>
    );
  }

  async function placeOrder() {
    if (!canSubmit) return;
    setLoading(true);
    const payload = {
      customer_name: name.trim(),
      phone: phone.trim(),
      address: fulfillment === "delivery" ? address.trim() : null,
      fulfillment,
      zone: fulfillment === "delivery" && selectedLoc ? selectedLoc.zone : null,
      delivery_fee: deliveryFee,
      subtotal,
      total,
      points_used: pointsToUse,
      points_earned: pointsEarned,
      user_id: user?.id ?? null,
      items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
    };
    const { data, error } = await supabase.from("orders").insert(payload).select("id").maybeSingle();
    setLoading(false);
    if (error || !data) {
      toast.error("Could not place order. Please try again.");
      return;
    }
    clear();
    navigate({ to: "/order/$id", params: { id: data.id } });
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
      <h1 className="mb-6 font-display text-3xl font-bold">Checkout</h1>

      <div className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
        {/* Form */}
        <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card">
          <Field label="Full name">
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. Adaeze Okeke" />
          </Field>
          <Field label="Phone number">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className="input" placeholder="e.g. 0803 123 4567" />
          </Field>

          <div>
            <div className="mb-2 text-sm font-semibold">How would you like to receive your order?</div>
            <div className="grid grid-cols-2 gap-2">
              {(["pickup", "delivery"] as const).map((opt) => (
                <button key={opt} type="button" onClick={() => setFulfillment(opt)}
                  className={`rounded-xl border p-3 text-left text-sm transition ${fulfillment === opt ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-background hover:bg-muted"}`}>
                  <div className="font-semibold capitalize">{opt}</div>
                  <div className="text-xs text-muted-foreground">{opt === "pickup" ? "Free • Ekulu West GRA" : "Choose your area"}</div>
                </button>
              ))}
            </div>
          </div>

          {fulfillment === "delivery" && (
            <>
              <Field label="Delivery area">
                <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="input">
                  <option value="">Select your area</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} • {l.zone} — {formatNGN(l.fee)} ({l.estimated_time})</option>
                  ))}
                </select>
              </Field>
              <Field label="Delivery address">
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="input resize-none" placeholder="House no, street, area, landmark" />
              </Field>
            </>
          )}

          {/* Loyalty points */}
          {user && (profile?.loyalty_points ?? 0) > 0 && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold">Use Loyalty Points</span>
                <span className="text-xs text-muted-foreground">({profile?.loyalty_points} pts = {formatNGN(profile?.loyalty_points ?? 0)})</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="range" min={0} max={maxPoints} value={pointsToUse} onChange={(e) => setPointsToUse(Number(e.target.value))}
                  className="flex-1 accent-accent" />
                <span className="text-sm font-bold text-accent">{pointsToUse} pts</span>
              </div>
              {pointsToUse > 0 && <div className="mt-1 text-xs text-accent">-{formatNGN(pointsDiscount)} discount</div>}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-card md:sticky md:top-20 md:self-start">
          <div className="font-display text-lg font-bold">Order summary</div>
          <div className="space-y-1.5 text-sm">
            {items.map((i) => (
              <div key={i.id} className="flex justify-between gap-2">
                <span className="truncate text-muted-foreground">{i.name} × {i.qty}</span>
                <span>{formatNGN(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 border-t border-border pt-3 text-sm">
            <Row label="Subtotal" value={formatNGN(subtotal)} />
            <Row label={fulfillment === "delivery" ? `Delivery (${selectedLoc?.name ?? "—"})` : "Pickup"} value={formatNGN(deliveryFee)} />
            {selectedLoc && <div className="text-xs text-muted-foreground">Est. {selectedLoc.estimated_time}</div>}
            {pointsToUse > 0 && <Row label="Points discount" value={`-${formatNGN(pointsDiscount)}`} />}
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
              <span>Total</span><span className="text-primary">{formatNGN(total)}</span>
            </div>
            {pointsEarned > 0 && (
              <div className="flex items-center gap-1 text-xs text-accent">
                <Star className="h-3 w-3" /> You'll earn {pointsEarned} points
              </div>
            )}
          </div>
          <button disabled={!canSubmit || loading} onClick={placeOrder}
            className="mt-2 w-full rounded-full bg-accent px-6 py-3 text-sm font-bold text-accent-foreground shadow-soft transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Placing order…" : "Place order"}
          </button>
          <p className="text-center text-xs text-muted-foreground">Payment via bank transfer on next step.</p>
          {!user && (
            <Link to="/login" className="block text-center text-xs text-primary hover:underline">
              Sign in to earn loyalty points →
            </Link>
          )}
        </div>
      </div>

      <style>{`.input{display:block;width:100%;border-radius:.75rem;border:1px solid var(--color-border);background:var(--color-background);padding:.7rem .9rem;font-size:.875rem;outline:none}.input:focus{border-color:var(--color-primary);box-shadow:0 0 0 3px oklch(0.55 0.2 255 / 0.15)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-muted-foreground"><span>{label}</span><span className="text-foreground">{value}</span></div>;
}
