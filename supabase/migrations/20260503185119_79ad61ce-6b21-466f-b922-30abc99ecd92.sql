
-- Add user_id to orders for logged-in customers
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  phone text,
  address text,
  referral_code text UNIQUE,
  referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  loyalty_points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    UPPER(SUBSTR(MD5(NEW.id::text), 1, 8))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User roles (security best practice: separate table)
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Loyalty transactions ledger
CREATE TABLE public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  points integer NOT NULL,
  type text NOT NULL CHECK (type IN ('earned', 'redeemed', 'referral_bonus')),
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.loyalty_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert transactions" ON public.loyalty_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Referrals
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bonus_awarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "System can insert referrals" ON public.referrals FOR INSERT WITH CHECK (true);

-- Meals catalog
CREATE TABLE public.meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  base_price numeric NOT NULL DEFAULT 0,
  cooking_fee numeric NOT NULL DEFAULT 500,
  packaging_fee numeric NOT NULL DEFAULT 200,
  image_url text,
  emoji text,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view meals" ON public.meals FOR SELECT USING (true);

-- Meal ingredients
CREATE TABLE public.meal_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id uuid NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  unit text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meal_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view ingredients" ON public.meal_ingredients FOR SELECT USING (true);

-- Meal orders
CREATE TABLE public.meal_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  phone text NOT NULL,
  meal_id uuid NOT NULL REFERENCES public.meals(id),
  selected_ingredients jsonb NOT NULL DEFAULT '[]',
  ingredients_cost numeric NOT NULL DEFAULT 0,
  cooking_fee numeric NOT NULL DEFAULT 500,
  packaging_fee numeric NOT NULL DEFAULT 200,
  delivery_fee numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  address text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meal_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create meal orders" ON public.meal_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view own meal orders" ON public.meal_orders FOR SELECT USING (true);

-- Delivery locations for Enugu
CREATE TABLE public.delivery_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  zone text NOT NULL,
  fee numeric NOT NULL DEFAULT 500,
  estimated_time text NOT NULL DEFAULT '30-45 mins',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.delivery_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view locations" ON public.delivery_locations FOR SELECT USING (true);

-- Add description and sensory fields to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS quality_level text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS texture text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS taste text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS aroma text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cooking_notes text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS origin text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pricing_unit text;

-- Add points_used and points_earned to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_used integer NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_earned integer NOT NULL DEFAULT 0;

-- Admin RLS policies: admins can manage products, orders, meals
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage meals" ON public.meals FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage ingredients" ON public.meal_ingredients FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage delivery locations" ON public.delivery_locations FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all loyalty transactions" ON public.loyalty_transactions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all referrals" ON public.referrals FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage meal orders" ON public.meal_orders FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for orders (for admin live tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_orders;
