
-- Add video_url column to products for brand ad videos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url text;

-- Create public storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create public storage bucket for product videos (ads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-videos', 'product-videos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies: anyone can read; only admins can write/delete
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view product videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-videos');

CREATE POLICY "Admins can upload product videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-videos' AND public.has_role(auth.uid(), 'admin'));
