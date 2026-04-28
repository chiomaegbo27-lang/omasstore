import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatNGN } from "@/lib/store";

export const Route = createFileRoute("/cart")({
  component: CartPage,
  head: () => ({ meta: [{ title: "Your Cart — Oma's Store" }] }),
});

function CartPage() {
  const { items, setQty, remove, subtotal, clear } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-secondary text-secondary-foreground">
          <ShoppingBag className="h-7 w-7" />
        </div>
        <h1 className="font-display text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">Add some essentials to get started.</p>
        <Link to="/shop" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-95">
          Go shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
      <h1 className="mb-6 font-display text-3xl font-bold">Your cart</h1>
      <div className="space-y-3">
        {items.map((i) => (
          <div key={i.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-pink-soft to-blue-soft text-3xl">
              {i.emoji ?? "🛒"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{i.name}</div>
              <div className="text-sm text-primary">
                {formatNGN(i.price)}{i.unit ? <span className="text-xs text-muted-foreground"> / {i.unit}</span> : null}
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-border">
              <button onClick={() => setQty(i.id, i.qty - 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted" aria-label="Decrease">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-semibold">{i.qty}</span>
              <button onClick={() => setQty(i.id, i.qty + 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted" aria-label="Increase">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <button onClick={() => remove(i.id)} className="grid h-9 w-9 place-items-center rounded-full text-destructive hover:bg-destructive/10" aria-label="Remove">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Subtotal</span><span>{formatNGN(subtotal)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
          <span>Delivery</span><span>Calculated at checkout</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-lg font-bold">
          <span>Total</span><span className="text-primary">{formatNGN(subtotal)}</span>
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link to="/checkout" className="flex-1 rounded-full bg-primary px-6 py-3 text-center text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95">
            Proceed to checkout
          </Link>
          <button onClick={clear} className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-muted">
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
