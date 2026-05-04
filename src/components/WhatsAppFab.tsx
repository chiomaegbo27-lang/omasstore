import { STORE } from "@/lib/store";
import { MessageCircle, Phone } from "lucide-react";

export function WhatsAppFab() {
  const waHref = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(`Hello ${STORE.name}, I'd like to place an order.`)}`;
  const callHref = `tel:${STORE.phone}`;
  
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3">
      <a
        href={callHref}
        aria-label="Call to order"
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition hover:scale-110 active:scale-95 animate-fade-in"
        style={{ animationDelay: "200ms" }}
      >
        <Phone className="h-5 w-5" />
      </a>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Order on WhatsApp"
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-glow transition hover:scale-110 active:scale-95 animate-fade-in"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
}
