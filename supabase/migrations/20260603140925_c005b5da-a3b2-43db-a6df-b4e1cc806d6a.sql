
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS review_reminder_sent_at timestamptz;

CREATE TABLE IF NOT EXISTS public.product_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  url text NOT NULL,
  type text NOT NULL CHECK (type IN ('image','video')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_media TO authenticated;
GRANT ALL ON public.product_media TO service_role;

ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product media"
ON public.product_media FOR SELECT
USING (true);

CREATE POLICY "Admins manage product media"
ON public.product_media FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_product_media_product ON public.product_media(product_id, sort_order);
