import { createFileRoute } from "@tanstack/react-router";

/**
 * Cron-triggered endpoint: finds orders delivered >=24h ago that haven't
 * received a review reminder yet, and marks them so the admin dashboard can
 * surface a one-click WhatsApp "review reminder" button.
 *
 * (We mark + return the list rather than send WhatsApp directly because
 * automated WhatsApp send requires a paid Business API provider — the admin
 * UI provides one-click wa.me links instead.)
 */
export const Route = createFileRoute("/api/public/hooks/send-review-reminders")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: due, error } = await supabaseAdmin
          .from("orders")
          .select("id, customer_name, phone, total")
          .eq("status", "delivered")
          .is("review_reminder_sent_at", null)
          .lt("created_at", cutoff)
          .limit(100);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }

        const ids = (due ?? []).map((o) => o.id);
        if (ids.length) {
          await supabaseAdmin
            .from("orders")
            .update({ review_reminder_sent_at: new Date().toISOString() })
            .in("id", ids);
        }

        return new Response(JSON.stringify({ marked: ids.length, orders: due }), {
          headers: { "Content-Type": "application/json" },
        });
      },
      GET: async () => new Response("OK"),
    },
  },
});
