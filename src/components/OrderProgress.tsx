import { Check, ShoppingCart, CreditCard, Truck, PackageCheck } from "lucide-react";

export type OrderStatus = "pending" | "paid" | "in_delivery" | "delivered";

const STEPS: { key: OrderStatus; label: string; Icon: typeof Check }[] = [
  { key: "pending", label: "Added to cart", Icon: ShoppingCart },
  { key: "paid", label: "Payment received", Icon: CreditCard },
  { key: "in_delivery", label: "Out for delivery", Icon: Truck },
  { key: "delivered", label: "Delivered", Icon: PackageCheck },
];

export function OrderProgress({ status }: { status: OrderStatus }) {
  const activeIdx = STEPS.findIndex((s) => s.key === status);
  const pct = ((activeIdx) / (STEPS.length - 1)) * 100;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="font-display text-base font-bold">Order progress</div>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-secondary-foreground">
          {STEPS[activeIdx]?.label ?? "Pending"}
        </span>
      </div>

      <div className="relative">
        {/* track */}
        <div className="absolute left-4 right-4 top-4 h-1 rounded-full bg-muted" />
        <div
          className="absolute left-4 top-4 h-1 rounded-full bg-gradient-to-r from-primary to-accent transition-all"
          style={{ width: `calc((100% - 2rem) * ${pct / 100})` }}
        />
        <ol className="relative grid grid-cols-4 gap-1">
          {STEPS.map(({ key, label, Icon }, i) => {
            const done = i < activeIdx;
            const current = i === activeIdx;
            return (
              <li key={key} className="flex flex-col items-center text-center">
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full border-2 text-xs transition ${
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : current
                      ? "border-accent bg-accent text-accent-foreground shadow-glow"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <span className={`mt-2 text-[10.5px] leading-tight md:text-xs ${current ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
