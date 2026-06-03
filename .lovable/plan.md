# Plan

## 1. New tiered loyalty rewards (replaces current formula)

Update `src/lib/loyalty.ts` to use a tier table per ₦1,000 block:

| Spend block | Points |
|---|---|
| ₦1,000 | 100 |
| ₦2,000 | 150 |
| ₦3,000 | 250 |
| ₦4,000 | 500 |
| ₦5,000+ | 1,000 (per full ₦5,000 block) |

Logic: full ₦5,000 blocks each award 1,000 pts; remainder uses the ₦1k–₦4k tier table. Example: ₦12,000 → 2×1,000 + ₦2,000 tier (150) = 2,150 pts. Customers can already redeem points at checkout (1pt = ₦1) — keep that intact, just update earning math + the `LOYALTY_TIERS` display constants used on the rewards UI.

## 2. Product media gallery (slider) + video returns to image

- Add a new `product_media` table: `id, product_id, url, type ('image'|'video'), sort_order, created_at`. RLS: anyone read; admins manage. GRANTs as required.
- Keep legacy `image_url` / `video_url` on `products` as a fallback so existing data still renders.
- New `<ProductMediaCarousel>` component (used in `ProductCard` and `product.$id.tsx`):
  - Shows poster image by default; left/right arrows + dot indicators for multi-media.
  - When user clicks a video slide → plays inline; on `ended`, snap back to the first image slide.
  - Reuses shadcn `carousel` (already installed).
- Admin: in product editor, new "Media" panel — add image URL or video URL rows (upload via existing `product-images` / `product-videos` buckets), reorder, delete.

## 3. Rich-text editor for product long-form fields

Install **TipTap** (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-color`, `@tiptap/extension-text-style`, `@tiptap/extension-highlight`, `@tiptap/extension-text-align`, `@tiptap/extension-underline`).

- New `<RichTextEditor value onChange />` component with toolbar: bold/italic/underline, H1/H2/H3, paragraph, bullet/numbered/alphabetical list, text color, highlight color, font size, alignment.
- Used in admin for: `description`, `texture`, `taste`, `aroma`, `origin`, `cooking_notes`, `quality_level`.
- Stored as sanitized HTML in the same existing text columns (no schema change). Render with `dangerouslySetInnerHTML` on `product.$id.tsx`, sanitized via **DOMPurify** (install) and styled with a `prose` block in `styles.css`.

## 4. Customer star-rating selector

Already a numeric input on reviews — replace with an interactive 5-star clickable component on `product.$id.tsx` review form (and reuse on a new general "Review Oma's Store" form linked from past orders).

## 5. Review reminder 24h after delivery (WhatsApp link + email)

- Add `review_reminder_sent_at timestamptz` to `orders`.
- New TanStack server route `src/routes/api/public/hooks/send-review-reminders.ts`:
  - Finds orders with `status='delivered'`, `updated_at < now() - 24h`, `review_reminder_sent_at IS NULL`.
  - For each: build a deep link `https://<site>/order/<id>?review=1` and send a WhatsApp message via `wa.me` link (we'll log + render a one-click "Send reminders" button in admin since automated WhatsApp send requires a paid API). Email via Lovable email infra **only if** the user wants it set up — otherwise we ship the WhatsApp + in-app reminder now and offer email as a follow-up (it requires domain DNS).
  - For now (no email domain set yet): the cron generates reminder rows the admin can one-click WhatsApp from the admin dashboard; we'll wire real auto-sending once an email/WA-API channel is configured. **I'll ask before adding email-domain setup.**
- Add `?review=1` handling on `src/routes/order.$id.tsx`: scrolls to/opens a review prompt with two buttons — "Review the products in this order" (lists each product with inline star form) and "Review Oma's Store" (general review with `product_id=null`).
- Schedule via `pg_cron` hourly calling that route.

## 6. WhatsApp order message — additional notes/instructions

- Add a `notes` textarea on `src/routes/checkout.tsx` (above Place Order).
- Persist on `orders` (new `notes text` column).
- Append the notes to the WhatsApp message body on the confirmation/order page where the `wa.me` link is constructed.

## 7. Database migration (single migration)

```
ALTER TABLE products ADD COLUMN -- (none, HTML stored in existing text cols)
ALTER TABLE orders ADD COLUMN notes text;
ALTER TABLE orders ADD COLUMN review_reminder_sent_at timestamptz;
CREATE TABLE product_media (...); + GRANTs + RLS + policies
```

## 8. Out of scope / asks

- **Email reminders**: need an email domain set up (Lovable Cloud → Emails). Want me to scaffold that now? It adds ~1 DNS step on your side.
- **True automated WhatsApp send**: WhatsApp Business API requires a paid provider (Twilio, 360dialog, etc.). The plan above generates one-click reminder links for you instead; say the word if you want me to wire a provider.

## Files changed

- New: `src/components/ProductMediaCarousel.tsx`, `src/components/RichTextEditor.tsx`, `src/components/StarRating.tsx`, `src/routes/api/public/hooks/send-review-reminders.ts`, one migration.
- Edited: `src/lib/loyalty.ts`, `src/components/ProductCard.tsx`, `src/routes/product.$id.tsx`, `src/routes/admin.tsx`, `src/routes/checkout.tsx`, `src/routes/order.$id.tsx`, `src/routes/index.tsx`, `src/styles.css`, `package.json` (TipTap + DOMPurify).

Approve and I'll implement in one pass. Two quick decisions:
1. Set up email domain now for the 24h reminder emails, or ship WhatsApp + in-app only?
2. OK that automated WhatsApp send needs a paid API later — for now the admin gets one-click "Send reminder" links?
