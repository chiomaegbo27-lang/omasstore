
## Goals

1. Show description, taste, aroma, texture, origin on the product (currently saved but never rendered).
2. Let each product have multiple **selectable units** (kg, bag, painter, cup, sachet, piece, tuber, bottle, sachet-water, pack, carton, crate, etc.) — each with its own price, stock, and optional measurement (e.g. "75cl"). Admin manages these.
3. Browsing flow: **Category → Brand → Subcategory → Product → pick a unit** (e.g. Water → Aquafina → Bottle Water → choose 75cl bottle / pack of 12 / carton).
4. Videos play **inline inside the product container** (no full-screen modal).
5. **Reviews**: customers leave a rating + comment on a product; latest/top reviews surface on the homepage.

## Database changes (one migration)

- New table `product_variants`:
  - `product_id` (uuid, ref products), `unit` (text, e.g. "bag", "cup", "75cl bottle"), `measurement` (text, optional, e.g. "75cl", "50kg"), `price` (numeric), `stock` (int), `is_default` (bool), `sort_order` (int).
  - RLS: anyone can `SELECT`; admins manage.
- New table `reviews`:
  - `product_id` (uuid, nullable — null = store-wide review), `user_id` (uuid), `customer_name` (text), `rating` (int 1–5), `comment` (text), `is_approved` (bool default true), `created_at`.
  - RLS: anyone can `SELECT` approved reviews; authenticated users can insert their own; admins can manage all.
- (No destructive changes to `products` — keep current `price`/`stock`/`unit` as legacy fallback for products without variants yet.)

## Frontend

### Product detail route — `src/routes/product.$id.tsx` (new)
- Hero with image OR **inline video player** (no modal — replaces the image area when a video exists, with a play overlay).
- Title, category > brand > subcategory breadcrumb.
- Full sections: Description, Texture, Taste, Aroma, Origin, Cooking notes, Quality level — each rendered only if present.
- **Unit selector**: chips showing each variant (e.g. "Cup — ₦300", "Painter — ₦2,500", "Bag — ₦60,000") with stock & measurement. Selecting one updates the price + +/- controls. Adds to cart as `{productId, variantId, unit, measurement, price}`.
- Reviews list + "Write a review" form (rating stars + comment) for signed-in users.

### ProductCard (`src/components/ProductCard.tsx`)
- Card becomes a link to the detail page.
- If product has variants: show "from ₦X" (min variant price) + "X options".
- If product has a video: render small inline `<video>` preview (muted, controls on click) inside the image area instead of opening a modal.
- Keep quick-add `+/-` only when product has a single unit (no variants) — otherwise show "Choose options" button linking to detail page.

### Cart (`src/lib/cart.tsx`)
- `CartItem` gains `variantId?`, `measurement?`. Cart key becomes `${productId}:${variantId ?? "default"}` so the same product with different units are separate lines.
- Stock checks use the variant's stock.

### Shop page
- Restructure grouping to: **Category → Brand → Subcategory → Product cards** (currently Category → Subcategory → Brand). Matches the requested "Water → Aquafina → Bottle Water" flow.

### Admin (`src/routes/admin.tsx`)
- Product editor gains a **Variants** section: list current variants with edit/delete; "Add variant" form (unit, measurement, price, stock, default). Saves to `product_variants`.
- New "Reviews" tab: list all reviews, approve/unapprove, delete.

### Homepage (`src/routes/index.tsx`)
- Add "What customers are saying" section pulling latest 6 approved reviews (name, stars, comment, product name).

## Technical notes

- All queries client-side via existing `supabase` client (RLS-safe).
- Variants fetched alongside products: `select("*, product_variants(*)")`.
- Cart migration: existing carts in `localStorage` stay valid (variantId undefined = legacy single-price product).
- Reviews insert requires auth — show "Sign in to review" CTA otherwise.
- Video inline: `<video src controls preload="metadata" poster={image_url}>` inside the card/detail image area; remove the full-screen modal in `ProductCard`.

## Out of scope (ask if you want these later)

- Per-variant images/videos (variants share product media).
- Admin moderation queue beyond approve toggle.
- Review photos.
