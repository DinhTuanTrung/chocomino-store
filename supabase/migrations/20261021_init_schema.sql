-- ==============================================================================
-- CHOCOMINO E-COMMERCE DATABASE INITIALIZATION SCHEMA
-- Version: 1.0 (Aligns with SRS v0.3 & Decisions 21/10/2026)
-- Target: Supabase (PostgreSQL 15+)
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Enums
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'new',
    'confirmed',
    'awaiting_stock',
    'packing',
    'shipping',
    'completed',
    'cancelled',
    'return_requested',
    'return_approved',
    'return_rejected',
    'returned',
    'refunded'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'unpaid',
    'awaiting',
    'paid',
    'expired',
    'needs_review',
    'refund_pending',
    'refunded'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'cod',
    'bank_qr'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE variant_status AS ENUM (
    'in_stock',
    'out_of_stock',
    'preorder'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE media_type AS ENUM (
    'image',
    'video'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'owner',
    'staff'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. Core Tables

-- 3.1 Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(280) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  sku VARCHAR(80) UNIQUE,
  price INT NOT NULL CHECK (price >= 0),
  compare_price INT CHECK (compare_price IS NULL OR compare_price >= price),
  stock_qty INT NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  status variant_status NOT NULL DEFAULT 'in_stock',
  preorder_eta DATE,
  preorder_limit INT,
  weight_kg NUMERIC(6, 3) NOT NULL DEFAULT 0.200 CHECK (weight_kg > 0),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 Product Media
CREATE TABLE IF NOT EXISTS product_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type media_type NOT NULL DEFAULT 'image',
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.5 Customers (Lightweight CRM based on Phone Number)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  first_source VARCHAR(80),
  total_orders INT NOT NULL DEFAULT 0,
  total_spent BIGINT NOT NULL DEFAULT 0,
  note TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.6 Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE, -- e.g. CM7K2P9Q
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150) NOT NULL,
  address_province VARCHAR(100) NOT NULL,
  address_ward VARCHAR(100) NOT NULL,
  address_detail TEXT NOT NULL,
  note TEXT,
  is_preorder BOOLEAN NOT NULL DEFAULT false,
  status order_status NOT NULL DEFAULT 'new',
  payment_method payment_method NOT NULL DEFAULT 'cod',
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  subtotal INT NOT NULL CHECK (subtotal >= 0),
  shipping_fee INT NOT NULL DEFAULT 18000 CHECK (shipping_fee >= 0),
  total INT NOT NULL CHECK (total >= 0),
  source VARCHAR(80), -- utm_source or direct
  cancel_reason TEXT,
  internal_note TEXT,
  expires_at TIMESTAMPTZ, -- 15 mins for bank_qr
  idempotency_key VARCHAR(100) UNIQUE,
  anonymized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.7 Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name_snapshot VARCHAR(255) NOT NULL,
  variant_name_snapshot VARCHAR(150) NOT NULL,
  unit_price INT NOT NULL CHECK (unit_price >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  line_total INT NOT NULL CHECK (line_total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.8 Order Status History
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status order_status,
  to_status order_status NOT NULL,
  changed_by VARCHAR(100) DEFAULT 'system',
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.9 Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method payment_method NOT NULL,
  amount INT NOT NULL CHECK (amount > 0),
  status payment_status NOT NULL DEFAULT 'awaiting',
  paid_at TIMESTAMPTZ,
  bank_tx_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.10 Bank Transactions (SePay Webhook & Reconciliation)
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_tx_id VARCHAR(120) NOT NULL UNIQUE,
  account_number VARCHAR(50) NOT NULL,
  amount INT NOT NULL,
  content TEXT NOT NULL,
  matched_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  raw_payload JSONB,
  status VARCHAR(30) NOT NULL DEFAULT 'unmatched', -- unmatched, matched, invalid_amount, ignored
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.11 Shipments (SPX mass order processing)
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  carrier VARCHAR(50) NOT NULL DEFAULT 'SPX',
  tracking_code VARCHAR(100),
  status VARCHAR(50) DEFAULT 'created',
  label_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.12 Return Requests
CREATE TABLE IF NOT EXISTS return_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, resolved
  customer_reason TEXT NOT NULL,
  customer_description TEXT,
  photos TEXT[] DEFAULT '{}',
  video_url TEXT,
  shop_note TEXT,
  resolved_by VARCHAR(100),
  resolution VARCHAR(50), -- refund, exchange, rejected
  refund_amount INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 3.13 Stock Movements (Inventory Audit Trail)
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  change_qty INT NOT NULL,
  reason VARCHAR(50) NOT NULL, -- order, cancel, manual, restock
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  user_id UUID,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.14 Notifications Log
CREATE TABLE IF NOT EXISTS notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel VARCHAR(30) NOT NULL, -- telegram, email
  recipient VARCHAR(150) NOT NULL,
  template VARCHAR(80) NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending', -- pending, sent, failed
  error TEXT,
  attempts INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.15 Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(150) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.16 Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100),
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.17 Settings (Key-Value)
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(80) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Seed Initial Settings
INSERT INTO settings (key, value, description) VALUES
('shipping', '{"ship_hcm": 18000, "ship_other": 22000, "free_ship_threshold": null}', 'Cấu hình phí vận chuyển')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO settings (key, value, description) VALUES
('bank_account', '{"bank_name": "Techcombank", "account_number": "", "account_holder": "TRUNG", "qr_timeout_minutes": 15}', 'Thông tin tài khoản nhận tiền Techcombank')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO settings (key, value, description) VALUES
('shop_info', '{"name": "chocomino", "phone": "", "address": "Đ. Số 2/38/32 Bình Đường 1, Khu Phố, Dĩ An, Hồ Chí Minh, Việt Nam", "email": ""}', 'Thông tin liên hệ cửa hàng')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO settings (key, value, description) VALUES
('spx_config', '{"default_weight_kg": 0.200, "partial_delivery": "N", "allow_test": "N", "allow_inspect": "N", "high_value": "N", "payment_role": "Người gửi trả"}', 'Giá trị mặc định xuất đơn SPX')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 5. Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_orders_code ON orders(code);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_provider_tx_id ON bank_transactions(provider_tx_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- 6. Atomic Checkout Function (Prevents Race Condition / Overselling)
CREATE OR REPLACE FUNCTION create_order_atomic(
  p_order JSONB,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_order_code TEXT;
  v_item RECORD;
  v_variant RECORD;
  v_subtotal INT := 0;
  v_shipping_fee INT;
  v_total INT;
  v_is_preorder BOOLEAN := false;
  v_customer_id UUID;
BEGIN
  -- 1. Extract Order Code and Shipping Fee
  v_order_code := p_order->>'code';
  v_shipping_fee := (p_order->>'shipping_fee')::INT;

  -- 2. Upsert Customer Record
  INSERT INTO customers (phone, name, email, first_source, total_orders)
  VALUES (
    p_order->>'phone',
    p_order->>'customer_name',
    p_order->>'email',
    p_order->>'source',
    1
  )
  ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    email = COALESCE(EXCLUDED.email, customers.email),
    total_orders = customers.total_orders + 1,
    updated_at = NOW()
  RETURNING id INTO v_customer_id;

  -- 3. Lock Variants and Validate Stock
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    variant_id UUID,
    quantity INT,
    unit_price INT
  )
  LOOP
    -- Lock row with FOR UPDATE
    SELECT id, product_id, stock_qty, status, price, name
    INTO v_variant
    FROM product_variants
    WHERE id = v_item.variant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Biến thể sản phẩm không tồn tại: %', v_item.variant_id;
    END IF;

    -- Verify stock if in_stock
    IF v_variant.status = 'in_stock' THEN
      IF v_variant.stock_qty < v_item.quantity THEN
        RAISE EXCEPTION 'Sản phẩm "%" chỉ còn % sản phẩm trong kho', v_variant.name, v_variant.stock_qty;
      END IF;

      -- Decrement stock
      UPDATE product_variants
      SET stock_qty = stock_qty - v_item.quantity,
          status = CASE WHEN stock_qty - v_item.quantity = 0 THEN 'out_of_stock'::variant_status ELSE status END,
          updated_at = NOW()
      WHERE id = v_item.variant_id;
    ELSIF v_variant.status = 'preorder' THEN
      v_is_preorder := true;
    ELSE
      RAISE EXCEPTION 'Sản phẩm "%" hiện đã hết hàng', v_variant.name;
    END IF;

    v_subtotal := v_subtotal + (v_item.quantity * v_item.unit_price);
  END LOOP;

  v_total := v_subtotal + v_shipping_fee;

  -- 4. Create Order Record
  INSERT INTO orders (
    code,
    customer_id,
    customer_name,
    phone,
    email,
    address_province,
    address_ward,
    address_detail,
    note,
    is_preorder,
    status,
    payment_method,
    payment_status,
    subtotal,
    shipping_fee,
    total,
    source,
    expires_at,
    idempotency_key
  ) VALUES (
    v_order_code,
    v_customer_id,
    p_order->>'customer_name',
    p_order->>'phone',
    p_order->>'email',
    p_order->>'address_province',
    p_order->>'address_ward',
    p_order->>'address_detail',
    p_order->>'note',
    v_is_preorder,
    'new'::order_status,
    (p_order->>'payment_method')::payment_method,
    CASE WHEN (p_order->>'payment_method') = 'bank_qr' THEN 'awaiting'::payment_status ELSE 'unpaid'::payment_status END,
    v_subtotal,
    v_shipping_fee,
    v_total,
    p_order->>'source',
    CASE WHEN (p_order->>'payment_method') = 'bank_qr' THEN NOW() + INTERVAL '15 minutes' ELSE NULL END,
    p_order->>'idempotency_key'
  ) RETURNING id INTO v_order_id;

  -- 5. Insert Order Items & Record Stock Movements
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    variant_id UUID,
    product_id UUID,
    product_name_snapshot TEXT,
    variant_name_snapshot TEXT,
    unit_price INT,
    quantity INT
  )
  LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      variant_id,
      product_name_snapshot,
      variant_name_snapshot,
      unit_price,
      quantity,
      line_total
    ) VALUES (
      v_order_id,
      v_item.product_id,
      v_item.variant_id,
      v_item.product_name_snapshot,
      v_item.variant_name_snapshot,
      v_item.unit_price,
      v_item.quantity,
      v_item.unit_price * v_item.quantity
    );

    -- Log stock movement
    INSERT INTO stock_movements (
      variant_id,
      change_qty,
      reason,
      order_id
    ) VALUES (
      v_item.variant_id,
      -v_item.quantity,
      'order',
      v_order_id
    );
  END LOOP;

  -- 6. Insert Order Status History
  INSERT INTO order_status_history (
    order_id,
    from_status,
    to_status,
    changed_by,
    reason
  ) VALUES (
    v_order_id,
    NULL,
    'new',
    'customer',
    'Khách đặt hàng qua website'
  );

  RETURN jsonb_build_object(
    'id', v_order_id,
    'code', v_order_code,
    'total', v_total,
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping_fee,
    'is_preorder', v_is_preorder
  );
END;
$$;

-- 7. QR Expiration Routine (can be called via pg_cron or webhook)
CREATE OR REPLACE FUNCTION cancel_expired_qr_orders()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired_count INT := 0;
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT id, code
    FROM orders
    WHERE status = 'new'
      AND payment_method = 'bank_qr'
      AND payment_status = 'awaiting'
      AND expires_at < NOW()
    FOR UPDATE
  LOOP
    -- Return stock
    UPDATE product_variants pv
    SET stock_qty = pv.stock_qty + oi.quantity,
        status = CASE WHEN pv.status = 'out_of_stock' THEN 'in_stock'::variant_status ELSE pv.status END
    FROM order_items oi
    WHERE oi.order_id = v_rec.id AND pv.id = oi.variant_id;

    -- Record stock movement
    INSERT INTO stock_movements (variant_id, change_qty, reason, order_id)
    SELECT oi.variant_id, oi.quantity, 'cancel_expired', v_rec.id
    FROM order_items oi
    WHERE oi.order_id = v_rec.id;

    -- Update order status
    UPDATE orders
    SET status = 'cancelled',
        payment_status = 'expired',
        cancel_reason = 'Hết hạn thời gian thanh toán QR (15 phút)',
        updated_at = NOW()
    WHERE id = v_rec.id;

    -- Record status history
    INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, reason)
    VALUES (v_rec.id, 'new', 'cancelled', 'system', 'Tự động hủy do hết hạn 15 phút');

    v_expired_count := v_expired_count + 1;
  END LOOP;

  RETURN v_expired_count;
END;
$$;

-- 8. Customer Data Anonymization (90-day retention rule)
CREATE OR REPLACE FUNCTION anonymize_expired_customer_data()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_anonymized_count INT := 0;
BEGIN
  -- Anonymize orders ended over 90 days ago
  UPDATE orders
  SET
    customer_name = 'Khách hàng #' || SUBSTRING(code FROM 1 FOR 4),
    phone = '0000000' || RIGHT(phone, 3),
    email = 'anonymized_' || SUBSTRING(code FROM 1 FOR 6) || '@chocomino.local',
    address_detail = '[Đã ẩn danh sau 90 ngày]',
    note = NULL,
    anonymized_at = NOW()
  WHERE status IN ('completed', 'cancelled', 'refunded')
    AND updated_at < NOW() - INTERVAL '90 days'
    AND anonymized_at IS NULL;

  GET DIAGNOSTICS v_anonymized_count = ROW_COUNT;
  RETURN v_anonymized_count;
END;
$$;
