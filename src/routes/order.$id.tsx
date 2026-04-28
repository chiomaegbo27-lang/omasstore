import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { STORE, formatNGN, ZONES, type Zone } from "@/lib/store";
import { OrderProgress, type OrderStatus } from "@/components/OrderProgress";
import { toast } from "sonner";

interface Order {
  id: string;
  customer_name: string;
  phone: string;
  address: string | null;
  fulfillment: string;
  zone: string | null;
  delivery_fee: number;
  subtotal: number;
  total: number;
  items: { id: string; name: string; price: number; qty: number }[];
  status: OrderStatus;
  created_at: string;
}

export const Route = createFileRoute("/order/$id")({
  component: OrderPage,
  head: () => ({ meta: [{ title: "Order Confirmation — Oma's Store" }] }),
});

function OrderPage() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("orders").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      setOrder(data as Order | null);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="container mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">Loading order…</div>;
  if (!order) return <div className="container mx-auto max-w-2xl px-4 py-16 text-center"><h1 className="font-display text-2xl font-bold">Order not found</h1><Link to="/" className="mt-4 inline-flex text-primary underline">Go home</Link></div>;

  const itemsText = order.items.map((i) => `• ${i.name} × ${i.qty} — ${formatNGN(i.price * i.qty)}`).join("\n");
  const fulfillmentText = order.fulfillment === "delivery"
    ? `Delivery (${ZONES[order.zone as Zone]?.label.split("—")[0].trim()})\nAddress: ${order.address}`
    : "Pickup at store";

  const waMessage =
`Hello ${STORE.name}, I'd like to confirm my order #${order.id.slice(0, 8).toUpperCase()}.

👤 Name: ${order.customer_name}
📱 Phone: ${order.phone}
📦 ${fulfillmentText}

🛒 Items:
${itemsText}

Subtotal: ${formatNGN(order.subtotal)}
Delivery: ${formatNGN(order.delivery_fee)}
TOTAL: ${formatNGN(order.total)}

I will send proof of payment shortly. Thank you!`;

  const waLink = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(waMessage)}`;

  const copy = (val: string, label: string) => {
    navigator.clipboard.writeText(val).then(() => toast.success(`${label} copied`));
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
      {/* Success header */}
      <div className="mb-6 rounded-2xl border border-border bg-gradient-to-br from-pink-soft to-blue-soft p-6 text-center shadow-card">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-7 w-7" />
        </div>
        <h1 className="font-display text-2xl font-bold">Order placed!</h1>
        <p className="mt-1 text-sm text-muted-foreground">Order ID: <span className="font-mono font-semibold">#{order.id.slice(0, 8).toUpperCase()}</span></p>
      </div>

      {/* Progress tracker */}
      <div className="mb-6">
        <OrderProgress status={(order.status ?? "pending") as OrderStatus} />
      </div>


      {/* Bank details */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-secondary-foreground"><Building2 className="h-5 w-5" /></span>
          <div>
            <div className="font-display text-lg font-bold">Pay via Bank Transfer</div>
            <div className="text-xs text-muted-foreground">Send {formatNGN(order.total)} to the account below</div>
          </div>
        </div>
        <div className="space-y-2 rounded-xl bg-muted/60 p-4 text-sm">
          <BankRow label="Bank" value={STORE.bank.bankName} onCopy={() => copy(STORE.bank.bankName, "Bank")} />
          <BankRow label="Account Number" value={STORE.bank.accountNumber} mono onCopy={() => copy(STORE.bank.accountNumber, "Account number")} />
          <BankRow label="Account Name" value={STORE.bank.accountName} onCopy={() => copy(STORE.bank.accountName, "Account name")} />
          <BankRow label="Amount" value={formatNGN(order.total)} highlight onCopy={() => copy(String(order.total), "Amount")} />
        </div>
        <p className="mt-3 rounded-lg bg-secondary/60 p-3 text-center text-sm font-medium text-secondary-foreground">
          📲 Click the WhatsApp button below to confirm your order and send proof of payment.
        </p>
      </div>

      {/* WhatsApp CTA */}
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-whatsapp px-6 py-4 text-base font-bold text-whatsapp-foreground shadow-glow transition hover:opacity-95 active:scale-[0.98]"
      >
        <MessageCircle className="h-5 w-5" /> Send Order via WhatsApp
      </a>

      {/* Summary */}
      <div className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="mb-3 font-display text-base font-bold">Order details</div>
        <div className="space-y-1 text-sm">
          {order.items.map((i) => (
            <div key={i.id} className="flex justify-between"><span className="text-muted-foreground">{i.name} × {i.qty}</span><span>{formatNGN(i.price * i.qty)}</span></div>
          ))}
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-muted-foreground"><span>Subtotal</span><span>{formatNGN(order.subtotal)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>{order.fulfillment === "delivery" ? `Delivery (Zone ${order.zone})` : "Pickup"}</span><span>{formatNGN(order.delivery_fee)}</span></div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><span>Total</span><span className="text-primary">{formatNGN(order.total)}</span></div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          {order.fulfillment === "delivery" ? <><strong className="text-foreground">Delivery to:</strong> {order.address}</> : <><strong className="text-foreground">Pickup at:</strong> {STORE.address}</>}
        </div>
      </div>

      <Link to="/shop" className="mt-6 block text-center text-sm font-semibold text-primary hover:underline">← Continue shopping</Link>
    </div>
  );
}

function BankRow({ label, value, mono, highlight, onCopy }: { label: string; value: string; mono?: boolean; highlight?: boolean; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`${mono ? "font-mono " : ""}${highlight ? "text-primary " : ""}font-semibold`}>{value}</span>
        <button onClick={onCopy} className="grid h-7 w-7 place-items-center rounded-md border border-border bg-card hover:bg-muted" aria-label={`Copy ${label}`}>
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
