-- ==============================================================================
-- CHOCOMINO PRODUCT MANAGEMENT & RPC MIGRATION
-- Version: 1.0 (21/10/2026)
-- Target: Supabase (PostgreSQL)
-- ==============================================================================

-- 1. RLS POLICIES FOR PRODUCTS, VARIANTS, MEDIA
DROP POLICY IF EXISTS "Allow insert products" ON products;
CREATE POLICY "Allow insert products" ON products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update products" ON products;
CREATE POLICY "Allow update products" ON products FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow insert product_variants" ON product_variants;
CREATE POLICY "Allow insert product_variants" ON product_variants FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update product_variants" ON product_variants;
CREATE POLICY "Allow update product_variants" ON product_variants FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow insert product_media" ON product_media;
CREATE POLICY "Allow insert product_media" ON product_media FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update product_media" ON product_media;
CREATE POLICY "Allow update product_media" ON product_media FOR UPDATE USING (true);

-- 2. ATOMIC PRODUCT CREATION RPC
CREATE OR REPLACE FUNCTION create_product_atomic(
  p_product JSONB,
  p_variants JSONB,
  p_media JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
  v_category_id UUID;
  v_name TEXT;
  v_slug TEXT;
  v_description TEXT;
  v_is_featured BOOLEAN;
  v_variant JSONB;
  v_media JSONB;
  v_variant_status VARCHAR(50);
  v_stock INT;
BEGIN
  -- Extract product fields
  IF (p_product->>'category_id') IS NOT NULL AND (p_product->>'category_id') != '' THEN
    v_category_id := (p_product->>'category_id')::UUID;
  ELSE
    v_category_id := NULL;
  END IF;

  v_name := p_product->>'name';
  v_slug := p_product->>'slug';
  v_description := p_product->>'description';
  v_is_featured := COALESCE((p_product->>'is_featured')::BOOLEAN, false);

  IF v_name IS NULL OR TRIM(v_name) = '' THEN
    RAISE EXCEPTION 'Tên sản phẩm không được để trống';
  END IF;

  IF v_slug IS NULL OR TRIM(v_slug) = '' THEN
    -- Generate basic slug from name
    v_slug := LOWER(REGEXP_REPLACE(v_name, '[^a-zA-Z0-9]+', '-', 'g'));
  END IF;

  -- Ensure slug uniqueness
  IF EXISTS (SELECT 1 FROM products WHERE slug = v_slug) THEN
    v_slug := v_slug || '-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6);
  END IF;

  -- Insert Product
  INSERT INTO products (
    category_id,
    name,
    slug,
    description,
    is_active,
    is_featured
  ) VALUES (
    v_category_id,
    v_name,
    v_slug,
    v_description,
    true,
    v_is_featured
  )
  RETURNING id INTO v_product_id;

  -- Insert Variants
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants)
  LOOP
    v_stock := COALESCE((v_variant->>'stock_qty')::INT, 0);
    IF (v_variant->>'status') IS NOT NULL AND (v_variant->>'status') != '' THEN
      v_variant_status := v_variant->>'status';
    ELSE
      v_variant_status := CASE WHEN v_stock > 0 THEN 'in_stock' ELSE 'out_of_stock' END;
    END IF;

    INSERT INTO product_variants (
      product_id,
      name,
      sku,
      price,
      compare_price,
      stock_qty,
      status,
      preorder_eta,
      weight_kg,
      sort_order,
      is_active
    ) VALUES (
      v_product_id,
      COALESCE(v_variant->>'name', 'Tiêu chuẩn'),
      v_variant->>'sku',
      COALESCE((v_variant->>'price')::INT, 0),
      (v_variant->>'compare_price')::INT,
      v_stock,
      v_variant_status,
      v_variant->>'preorder_eta',
      COALESCE((v_variant->>'weight_kg')::NUMERIC, 0.200),
      COALESCE((v_variant->>'sort_order')::INT, 0),
      true
    );
  END LOOP;

  -- Insert Media
  FOR v_media IN SELECT * FROM jsonb_array_elements(p_media)
  LOOP
    INSERT INTO product_media (
      product_id,
      type,
      url,
      sort_order,
      is_primary
    ) VALUES (
      v_product_id,
      COALESCE(v_media->>'type', 'image'),
      v_media->>'url',
      COALESCE((v_media->>'sort_order')::INT, 0),
      COALESCE((v_media->>'is_primary')::BOOLEAN, false)
    );
  END LOOP;

  -- Return Result
  RETURN jsonb_build_object(
    'success', true,
    'product_id', v_product_id,
    'slug', v_slug
  );
END;
$$;

GRANT EXECUTE ON FUNCTION create_product_atomic(JSONB, JSONB, JSONB) TO anon, authenticated, service_role;
