import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatNGN, STORE } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Check, ChevronDown, Plus, Minus, MessageCircle, ChefHat } from "lucide-react";

export const Route = createFileRoute("/meals")({
  component: MealsPage,
  head: () => ({ meta: [{ title: "Custom Meals — Oma's Store" }, { name: "description", content: "Order freshly prepared Nigerian meals with custom ingredients." }] }),
});

interface Meal { id: string; name: string; description: string | null; cooking_fee: number; packaging_fee: number; emoji: string | null; is_available: boolean; }
interface Ingredient { id: string; meal_id: string; name: string; price: number; unit: string | null; is_default: boolean; }
interface DeliveryLoc { id: string; name: string; zone: string; fee: number; estimated_time: string; }

function MealsPage() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [locations, setLocations] = useState<DeliveryLoc[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [locationId, setLocationId] = useState("");
  const [wantDelivery, setWantDelivery] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("meals").select("*").eq("is_available", true),
      supabase.from("meal_ingredients").select("*"),
      supabase.from("delivery_locations").select("*").order("name"),
    ]).then(([m, i, l]) => {
      setMeals((m.data ?? []) as Meal[]);
      setIngredients((i.data ?? []) as Ingredient[]);
      setLocations((l.data ?? []) as DeliveryLoc[]);
    });
  }, []);

  const meal = meals.find((m) => m.id === selectedMeal);
  const mealIngredients = ingredients.filter((i) => i.meal_id === selectedMeal);
  const selectedLoc = locations.find((l) => l.id === locationId);
  const deliveryFee = wantDelivery && selectedLoc ? selectedLoc.fee : 0;

  const ingredientsCost = useMemo(() =>
    Object.entries(selectedIngredients).reduce((sum, [id, qty]) => {
      const ing = ingredients.find((i) => i.id === id);
      return sum + (ing ? ing.price * qty : 0);
    }, 0), [selectedIngredients, ingredients]);

  const total = ingredientsCost + (meal?.cooking_fee ?? 0) + (meal?.packaging_fee ?? 0) + deliveryFee;

  // Auto-select default ingredients when meal changes
  useEffect(() => {
    if (!selectedMeal) return;
    const defaults: Record<string, number> = {};
    mealIngredients.filter((i) => i.is_default).forEach((i) => { defaults[i.id] = 1; });
    setSelectedIngredients(defaults);
  }, [selectedMeal]);

  const toggleIngredient = (id: string) => {
    setSelectedIngredients((prev) => {
      const copy = { ...prev };
      if (copy[id]) { delete copy[id]; } else { copy[id] = 1; }
      return copy;
    });
  };

  const setIngQty = (id: string, qty: number) => {
    setSelectedIngredients((prev) => {
      const copy = { ...prev };
      if (qty <= 0) delete copy[id]; else copy[id] = qty;
      return copy;
    });
  };

  const handleOrder = async () => {
    if (!meal || !name.trim() || !phone.trim() || Object.keys(selectedIngredients).length === 0) {
      toast.error("Please fill all required fields and select at least one ingredient.");
      return;
    }
    setLoading(true);
    const selIngList = Object.entries(selectedIngredients).map(([id, qty]) => {
      const ing = ingredients.find((i) => i.id === id)!;
      return { id, name: ing.name, price: ing.price, qty, unit: ing.unit };
    });

    try {
      const { error } = await supabase.from("meal_orders").insert({
        user_id: user?.id ?? null,
        customer_name: name.trim(),
        phone: phone.trim(),
        meal_id: meal.id,
        selected_ingredients: selIngList,
        ingredients_cost: ingredientsCost,
        cooking_fee: meal.cooking_fee,
        packaging_fee: meal.packaging_fee,
        delivery_fee: deliveryFee,
        total,
        address: wantDelivery ? address.trim() : null,
      });
      setLoading(false);
      if (error) {
        console.error("Meal order error:", error);
        toast.error(error.message || "Failed to place order");
        return;
      }
      setSubmitted(true);
    } catch (e: any) {
      setLoading(false);
      console.error("Meal order exception:", e);
      toast.error(e?.message || "Something went wrong");
    }
  };

  const waMessage = meal ? `Hello ${STORE.name}, I'd like to order a custom meal:\n\n🍲 ${meal.name}\n👤 ${name}\n📱 ${phone}\n\nIngredients:\n${Object.entries(selectedIngredients).map(([id, qty]) => {
    const ing = ingredients.find((i) => i.id === id);
    return `• ${ing?.name} ×${qty} — ${formatNGN((ing?.price ?? 0) * qty)}`;
  }).join("\n")}\n\nIngredients: ${formatNGN(ingredientsCost)}\nCooking: ${formatNGN(meal.cooking_fee)}\nPackaging: ${formatNGN(meal.packaging_fee)}\nDelivery: ${formatNGN(deliveryFee)}\nTOTAL: ${formatNGN(total)}` : "";

  if (submitted) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary text-white"><Check className="h-7 w-7" /></div>
        <h1 className="font-display text-2xl font-bold">Meal Order Placed!</h1>
        <p className="mt-2 text-sm text-muted-foreground">Send your order details via WhatsApp to confirm.</p>
        <a href={`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(waMessage)}`} target="_blank" rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-whatsapp px-6 py-3 text-sm font-bold text-white">
          <MessageCircle className="h-4 w-4" /> Send via WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold md:text-4xl flex items-center gap-2"><ChefHat className="h-8 w-8 text-accent" /> Custom Meals</h1>
        <p className="text-sm text-muted-foreground">Pick a meal, choose your ingredients, and we'll cook it fresh for you.</p>
      </div>

      {/* Meal selection */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 mb-6">
        {meals.map((m) => (
          <button key={m.id} onClick={() => setSelectedMeal(m.id)}
            className={`rounded-2xl border p-4 text-center transition ${selectedMeal === m.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:bg-muted/40"}`}>
            <span className="text-3xl">{m.emoji}</span>
            <div className="mt-1 text-sm font-semibold">{m.name}</div>
            <div className="text-[11px] text-muted-foreground">Cook: {formatNGN(m.cooking_fee)}</div>
          </button>
        ))}
      </div>

      {meal && (
        <div className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
            {/* Ingredients */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h2 className="mb-3 font-display text-lg font-bold">Choose Ingredients</h2>
              <div className="space-y-2">
                {mealIngredients.map((ing) => {
                  const qty = selectedIngredients[ing.id] ?? 0;
                  const selected = qty > 0;
                  return (
                    <div key={ing.id} className={`flex items-center gap-3 rounded-xl border p-3 transition ${selected ? "border-primary bg-primary/5" : "border-border"}`}>
                      <button onClick={() => toggleIngredient(ing.id)}
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border transition ${selected ? "border-primary bg-primary text-white" : "border-border"}`}>
                        {selected && <Check className="h-3.5 w-3.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">{ing.name} {ing.is_default && <span className="text-[10px] text-muted-foreground">(default)</span>}</div>
                        <div className="text-xs text-muted-foreground">{formatNGN(ing.price)}{ing.unit ? ` / ${ing.unit}` : ""}</div>
                      </div>
                      {selected && (
                        <div className="inline-flex items-center gap-1 rounded-full bg-secondary p-0.5">
                          <button onClick={() => setIngQty(ing.id, qty - 1)} className="grid h-7 w-7 place-items-center rounded-full bg-card shadow-sm"><Minus className="h-3 w-3" /></button>
                          <span className="w-6 text-center text-sm font-bold">{qty}</span>
                          <button onClick={() => setIngQty(ing.id, qty + 1)} className="grid h-7 w-7 place-items-center rounded-full bg-primary text-white shadow-sm"><Plus className="h-3 w-3" /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer info */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
              <h2 className="font-display text-lg font-bold">Your Details</h2>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required
                className="w-full rounded-xl border border-border bg-background py-3 px-4 text-sm outline-none focus:border-primary" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" inputMode="tel" required
                className="w-full rounded-xl border border-border bg-background py-3 px-4 text-sm outline-none focus:border-primary" />
              <div className="grid grid-cols-2 gap-2">
                {[true, false].map((v) => (
                  <button key={String(v)} onClick={() => setWantDelivery(v)}
                    className={`rounded-xl border p-3 text-left text-sm transition ${wantDelivery === v ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted"}`}>
                    <div className="font-semibold">{v ? "Delivery" : "Pickup"}</div>
                  </button>
                ))}
              </div>
              {wantDelivery && (
                <>
                  <select value={locationId} onChange={(e) => setLocationId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background py-3 px-4 text-sm outline-none focus:border-primary">
                    <option value="">Select delivery area</option>
                    {locations.map((l) => <option key={l.id} value={l.id}>{l.name} — {formatNGN(l.fee)} ({l.estimated_time})</option>)}
                  </select>
                  <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address" rows={2}
                    className="w-full rounded-xl border border-border bg-background py-3 px-4 text-sm outline-none focus:border-primary resize-none" />
                </>
              )}
            </div>
          </div>

          {/* Cost summary */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card md:sticky md:top-20 md:self-start">
            <h2 className="font-display text-lg font-bold mb-3">{meal.emoji} {meal.name}</h2>
            {meal.description && <p className="text-sm text-muted-foreground mb-3">{meal.description}</p>}
            <div className="space-y-1.5 text-sm">
              {Object.entries(selectedIngredients).map(([id, qty]) => {
                const ing = ingredients.find((i) => i.id === id);
                if (!ing) return null;
                return <div key={id} className="flex justify-between"><span className="text-muted-foreground">{ing.name} ×{qty}</span><span>{formatNGN(ing.price * qty)}</span></div>;
              })}
            </div>
            <div className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Ingredients</span><span>{formatNGN(ingredientsCost)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Cooking</span><span>{formatNGN(meal.cooking_fee)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Packaging</span><span>{formatNGN(meal.packaging_fee)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span>{formatNGN(deliveryFee)}</span></div>
              <div className="flex justify-between border-t border-border pt-2 text-lg font-bold"><span>Total</span><span className="text-primary">{formatNGN(total)}</span></div>
            </div>
            <button onClick={handleOrder} disabled={loading || !name.trim() || !phone.trim() || Object.keys(selectedIngredients).length === 0}
              className="mt-4 w-full rounded-full bg-accent px-6 py-3 text-sm font-bold text-white shadow-soft transition hover:opacity-95 disabled:opacity-50">
              {loading ? "Placing…" : "Place Meal Order"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
