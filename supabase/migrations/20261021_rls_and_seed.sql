-- ==============================================================================
-- CHOCOMINO ROW LEVEL SECURITY (RLS) POLICIES & SEED DATA
-- Version: 1.0 (21/10/2026)
-- Target: Supabase (PostgreSQL)
-- ==============================================================================

-- 1. ROW LEVEL SECURITY (RLS) POLICIES
-- Cho phép khách vãng lai (khách mua hàng không cần đăng ký) xem sản phẩm & danh mục

-- 1.1 Categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active categories" ON categories;
CREATE POLICY "Public read active categories" ON categories
  FOR SELECT USING (is_active = true);

-- 1.2 Products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active products" ON products;
CREATE POLICY "Public read active products" ON products
  FOR SELECT USING (is_active = true AND deleted_at IS NULL);

-- 1.3 Product Variants
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active variants" ON product_variants;
CREATE POLICY "Public read active variants" ON product_variants
  FOR SELECT USING (is_active = true);

-- 1.4 Product Media
ALTER TABLE product_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read product media" ON product_media;
CREATE POLICY "Public read product media" ON product_media
  FOR SELECT USING (true);

-- 1.5 Settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read settings" ON settings;
CREATE POLICY "Public read settings" ON settings
  FOR SELECT USING (true);

-- 1.6 Orders & Items (Tra cứu đơn hàng)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read orders" ON orders;
CREATE POLICY "Public read orders" ON orders
  FOR SELECT USING (true);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read order_items" ON order_items;
CREATE POLICY "Public read order_items" ON order_items
  FOR SELECT USING (true);

-- 1.7 Permissions on RPC Functions
GRANT EXECUTE ON FUNCTION create_order_atomic(JSONB, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cancel_expired_qr_orders() TO anon, authenticated;

-- ==============================================================================
-- 2. SEED INITIAL SAMPLE SQUISHY PRODUCTS
-- ==============================================================================

DO $$
DECLARE
  v_cat_banh UUID;
  v_cat_meo UUID;
  v_cat_trai_cay UUID;
  v_cat_pre UUID;
  v_prod_1 UUID;
  v_prod_2 UUID;
  v_prod_3 UUID;
  v_prod_4 UUID;
BEGIN
  -- 2.1 Insert Categories
  INSERT INTO categories (name, slug, sort_order)
  VALUES ('Squishy Bánh Ngọt', 'banh-ngot', 1)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_cat_banh;

  INSERT INTO categories (name, slug, sort_order)
  VALUES ('Squishy Động Vật', 'dong-vat', 2)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_cat_meo;

  INSERT INTO categories (name, slug, sort_order)
  VALUES ('Squishy Trái Cây', 'trai-cay', 3)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_cat_trai_cay;

  INSERT INTO categories (name, slug, sort_order)
  VALUES ('Pre-order Đặt Trước', 'pre-order', 4)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_cat_pre;

  -- 2.2 Insert Product 1: Bánh Mì Nướng Bơ
  INSERT INTO products (category_id, name, slug, description, is_active, is_featured)
  VALUES (
    v_cat_banh,
    'Squishy Bánh Mì Nướng Bơ Mềm Mịn Choco',
    'squishy-banh-mi-nuong-bo-mem-min-choco',
    'Squishy bánh mì nướng bơ siêu chậm tăng (slow rising), có mùi thơm vani dịu ngọt, kích thước 10cm cầm cực kỳ êm tay. Thích hợp xả stress và làm quà tặng dễ thương!',
    true,
    true
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_prod_1;

  INSERT INTO product_variants (product_id, name, sku, price, compare_price, stock_qty, status, weight_kg, sort_order)
  VALUES
    (v_prod_1, 'Vị Socola', 'SQ-BM-CHOCO', 45000, 55000, 25, 'in_stock', 0.150, 1),
    (v_prod_1, 'Vị Dâu Tây', 'SQ-BM-STRAW', 45000, 55000, 18, 'in_stock', 0.150, 2),
    (v_prod_1, 'Vị Bơ Sữa', 'SQ-BM-BUTTER', 48000, 60000, 0, 'out_of_stock', 0.150, 3)
  ON CONFLICT (sku) DO NOTHING;

  INSERT INTO product_media (product_id, type, url, sort_order, is_primary)
  VALUES (v_prod_1, 'image', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', 1, true);

  -- 2.3 Insert Product 2: Mèo Béo Bánh Bao
  INSERT INTO products (category_id, name, slug, description, is_active, is_featured)
  VALUES (
    v_cat_meo,
    'Squishy Mèo Béo Bánh Bao Cute',
    'squishy-meo-beo-banh-bao-cute',
    'Squishy mèo ú mập mạp bồng bềnh như bánh bao mới hấp, chất liệu foam bóp siêu đàn hồi, đàn hồi cực chậm giúp thư giãn cổ tay và giảm căng thẳng tức thì.',
    true,
    true
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_prod_2;

  INSERT INTO product_variants (product_id, name, sku, price, compare_price, stock_qty, status, weight_kg, sort_order)
  VALUES
    (v_prod_2, 'Mèo Trắng Đốm', 'SQ-CAT-WHITE', 65000, 75000, 30, 'in_stock', 0.180, 1),
    (v_prod_2, 'Mèo Hồng Mơ Mộng', 'SQ-CAT-PINK', 65000, 75000, 12, 'in_stock', 0.180, 2)
  ON CONFLICT (sku) DO NOTHING;

  INSERT INTO product_media (product_id, type, url, sort_order, is_primary)
  VALUES (v_prod_2, 'image', 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=600&auto=format&fit=crop&q=80', 1, true);

  -- 2.4 Insert Product 3: Dâu Tây Khổng Lồ
  INSERT INTO products (category_id, name, slug, description, is_active, is_featured)
  VALUES (
    v_cat_trai_cay,
    'Squishy Quả Dâu Tây Khổng Lồ Kem Sữa',
    'squishy-qua-dau-tay-khong-lo-kem-sua',
    'Quả dâu tây hồng pastel đáng yêu phủ kem vani, độ mềm 10/10, thơm ngát mùi dâu ngọt ngào. Kích thước 12cm cực đại.',
    true,
    true
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_prod_3;

  INSERT INTO product_variants (product_id, name, sku, price, compare_price, stock_qty, status, weight_kg, sort_order)
  VALUES
    (v_prod_3, 'Dâu Hồng Pastel', 'SQ-STRAW-PINK', 52000, 65000, 15, 'in_stock', 0.200, 1)
  ON CONFLICT (sku) DO NOTHING;

  INSERT INTO product_media (product_id, type, url, sort_order, is_primary)
  VALUES (v_prod_3, 'image', 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&auto=format&fit=crop&q=80', 1, true);

  -- 2.5 Insert Product 4: Donut Cầu Vồng Pre-order
  INSERT INTO products (category_id, name, slug, description, is_active, is_featured)
  VALUES (
    v_cat_pre,
    'Squishy Bánh Donut Cầu Vồng Thỏ Ngọc [Pre-order]',
    'squishy-banh-donut-cau-vong-tho-ngoc-preorder',
    'Bản giới hạn Limited Edition: Chiếc donut tai thỏ dễ thương phủ cốm 7 màu. Sản phẩm đặt trước độc quyền từ xưởng, trả trước bằng chuyển khoản QR.',
    true,
    false
  )
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_prod_4;

  INSERT INTO product_variants (product_id, name, sku, price, compare_price, stock_qty, status, preorder_eta, preorder_limit, weight_kg, sort_order)
  VALUES
    (v_prod_4, 'Cầu Vồng Tươi Sáng', 'SQ-PRE-DONUT', 79000, 95000, 0, 'preorder', '2026-11-15', 50, 0.160, 1)
  ON CONFLICT (sku) DO NOTHING;

  INSERT INTO product_media (product_id, type, url, sort_order, is_primary)
  VALUES (v_prod_4, 'image', 'https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?w=600&auto=format&fit=crop&q=80', 1, true);

END $$;
