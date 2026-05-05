import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { CartProvider } from "@/lib/cart";
import { AuthProvider } from "@/lib/auth";
import { Header } from "@/components/Header";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { Toaster } from "@/components/ui/sonner";
import { STORE } from "@/lib/store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-95">
          Back home
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${STORE.name} — Groceries & Essentials Delivered in Enugu` },
      { name: "description", content: "Order garri, rice, noodles, drinks, and household essentials from Oma's Store. Fast WhatsApp ordering and same-day delivery in Enugu." },
      { name: "theme-color", content: "#ffffff" },
      { property: "og:title", content: `${STORE.name} — Groceries delivered in Enugu` },
      { property: "og:description", content: "Order garri, rice, noodles, drinks, and household essentials from Oma's Store. Fast WhatsApp ordering and same-day delivery in Enugu." },
      { property: "og:type", content: "website" },
      { title: "Lovable App" },
      { property: "og:title", content: "Lovable App" },
      { name: "twitter:title", content: "Lovable App" },
      { name: "twitter:description", content: "Order garri, rice, noodles, drinks, and household essentials from Oma's Store. Fast WhatsApp ordering and same-day delivery in Enugu." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/08c30a18-1a79-44a4-852f-719da083d194/id-preview-254e0544--6f318707-c0e4-4988-8d44-2eb646b1dada.lovable.app-1777834780904.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/08c30a18-1a79-44a4-852f-719da083d194/id-preview-254e0544--6f318707-c0e4-4988-8d44-2eb646b1dada.lovable.app-1777834780904.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1"><Outlet /></main>
        <footer className="border-t border-border bg-muted/40">
          <div className="container mx-auto max-w-6xl px-4 py-8 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {STORE.name} • {STORE.address}
          </div>
        </footer>
        <WhatsAppFab />
        <Toaster position="top-center" />
      </div>
    </CartProvider>
  );
}
