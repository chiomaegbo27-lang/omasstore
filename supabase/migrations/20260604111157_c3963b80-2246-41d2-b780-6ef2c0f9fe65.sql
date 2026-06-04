ALTER TABLE public.product_media
  ADD CONSTRAINT product_media_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
NOTIFY pgrst, 'reload schema';