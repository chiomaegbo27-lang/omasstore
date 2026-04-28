
-- Products table (publicly readable)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL,
  emoji TEXT,
  image_url TEXT,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);

-- Orders table (publicly insertable, no auth needed for guest checkout)
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  fulfillment TEXT NOT NULL,
  zone TEXT,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  items JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);

-- Seed products
INSERT INTO public.products (name, description, price, category, emoji) VALUES
('Garri (Yellow) - 5kg', 'Premium yellow garri, 5kg bag', 4500, 'Food', '🌽'),
('Rice (Foreign) - 5kg', 'Long grain parboiled rice', 8500, 'Food', '🍚'),
('Indomie Noodles (Carton)', 'Chicken flavor, 40 packs', 9500, 'Food', '🍜'),
('Indomie Noodles (Pack)', 'Single pack, chicken flavor', 350, 'Food', '🍜'),
('Fresh Pepper - 1 paint', 'Red rodo pepper, fresh', 2000, 'Food', '🌶️'),
('Spaghetti - Power Pasta', '500g pack', 800, 'Food', '🍝'),
('Bottled Water - 75cl (Pack of 12)', 'Eva table water', 1800, 'Beverages', '💧'),
('Coca-Cola 50cl (Pack of 12)', 'Chilled soft drink', 4200, 'Beverages', '🥤'),
('Five Alive Juice 1L', 'Citrus burst juice', 1500, 'Beverages', '🧃'),
('Hollandia Yoghurt 1L', 'Strawberry yoghurt', 1800, 'Beverages', '🥛'),
('Close-Up Toothpaste', 'Red gel, 140g', 1200, 'Household Items', '🪥'),
('Premier Toilet Paper (4 rolls)', '2-ply soft tissue', 900, 'Household Items', '🧻'),
('Omo Detergent - 900g', 'Multi-active soap powder', 2500, 'Household Items', '🧼'),
('Hypo Bleach - 1L', 'Disinfectant bleach', 1100, 'Household Items', '🧴'),
('Morning Fresh Dishwash 750ml', 'Lemon scent', 1800, 'Household Items', '🍋');
