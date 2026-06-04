
-- 1. Orders: restrict SELECT to owner + admin; keep INSERT open for guest checkout
DROP POLICY IF EXISTS "Anyone can view orders" ON public.orders;
CREATE POLICY "Users view own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. Meal orders: same pattern
DROP POLICY IF EXISTS "Anyone can view own meal orders" ON public.meal_orders;
CREATE POLICY "Users view own meal orders" ON public.meal_orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. Profiles: restrict SELECT to owner + admin
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4. Safe RPCs so guests can still look up their specific order/meal order by id
CREATE OR REPLACE FUNCTION public.get_order_by_id(_id uuid)
RETURNS SETOF public.orders
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.orders WHERE id = _id LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_order_by_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_by_id(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_meal_order_by_id(_id uuid)
RETURNS SETOF public.meal_orders
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.meal_orders WHERE id = _id LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_meal_order_by_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_meal_order_by_id(uuid) TO anon, authenticated;

-- 5. Loyalty transactions: restrict INSERT to authenticated users inserting for themselves
DROP POLICY IF EXISTS "System can insert transactions" ON public.loyalty_transactions;
CREATE POLICY "Users insert own loyalty transactions" ON public.loyalty_transactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 6. Referrals: restrict INSERT to authenticated, referred_id must be self
DROP POLICY IF EXISTS "System can insert referrals" ON public.referrals;
CREATE POLICY "Users insert own referral" ON public.referrals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = referred_id);

-- 7. Realtime: remove orders/meal_orders from broadcast publication (not used in client)
ALTER PUBLICATION supabase_realtime DROP TABLE public.orders;
ALTER PUBLICATION supabase_realtime DROP TABLE public.meal_orders;

-- 8. Storage: stop allowing anonymous listing of product buckets (files still served via public URL)
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product videos" ON storage.objects;

-- 9. Lock down SECURITY DEFINER helper functions exposed via PostgREST
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
