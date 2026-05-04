import { Link } from "@tanstack/react-router";
import { ShoppingBag, Store, User, ChefHat, Shield, Phone, MessageCircle } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { STORE } from "@/lib/store";

export function Header() {
  const { count } = useCart();
  const { user, isAdmin, loading } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2 transition hover:opacity-80">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-secondary-foreground">
            <Store className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <div className="font-display text-base font-bold">{STORE.name}</div>
            <div className="hidden text-[11px] text-muted-foreground sm:block">Enugu • Same-day delivery</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link to="/shop" activeProps={{ className: "text-primary" }} className="hidden rounded-lg px-3 py-2 text-foreground/75 transition hover:text-foreground sm:block">
            Shop
          </Link>
          <Link to="/meals" activeProps={{ className: "text-primary" }} className="hidden rounded-lg px-2.5 py-2 text-foreground/75 transition hover:text-foreground sm:flex items-center gap-1">
            <ChefHat className="h-4 w-4" /> <span className="hidden md:inline">Meals</span>
          </Link>
          {/* Quick contact icons */}
          <a href={`tel:${STORE.phone}`} className="hidden md:grid h-8 w-8 place-items-center rounded-lg text-foreground/60 transition hover:text-primary hover:bg-muted" aria-label="Call">
            <Phone className="h-4 w-4" />
          </a>
          <a href={`https://wa.me/${STORE.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hidden md:grid h-8 w-8 place-items-center rounded-lg text-foreground/60 transition hover:text-whatsapp hover:bg-muted" aria-label="WhatsApp">
            <MessageCircle className="h-4 w-4" />
          </a>
          {isAdmin && (
            <Link to="/admin" activeProps={{ className: "text-primary" }} className="rounded-lg px-2.5 py-2 text-foreground/75 transition hover:text-foreground flex items-center gap-1">
              <Shield className="h-4 w-4" />
            </Link>
          )}
          {!loading && (
            user ? (
              <Link to="/account" activeProps={{ className: "text-primary" }} className="rounded-lg px-2.5 py-2 text-foreground/75 transition hover:text-foreground">
                <User className="h-4 w-4" />
              </Link>
            ) : (
              <Link to="/login" className="rounded-lg px-3 py-2 text-foreground/75 transition hover:text-foreground text-xs sm:text-sm">
                Sign in
              </Link>
            )
          )}
          <Link
            to="/cart"
            activeProps={{ className: "text-primary" }}
            className="relative inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-primary-foreground shadow-sm transition-all duration-200 hover:opacity-95 hover:scale-105 active:scale-95"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="ml-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-foreground animate-scale-in">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
