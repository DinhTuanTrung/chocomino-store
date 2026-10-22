-- ==============================================================================
-- CHOCOMINO FIX: ROW LEVEL SECURITY POLICIES FOR OPERATIONAL ACTIONS
-- Target: Supabase (PostgreSQL)
-- ==============================================================================

-- 1. Cho phép cập nhật đơn hàng (đổi trạng thái, hủy đơn, cập nhật thanh toán)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow update orders" ON orders;
CREATE POLICY "Allow update orders" ON orders
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert orders" ON orders;
CREATE POLICY "Allow insert orders" ON orders
  FOR INSERT WITH CHECK (true);

-- 2. Cho phép ghi và đọc lịch sử đổi trạng thái đơn (order_status_history)
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insert order_status_history" ON order_status_history;
CREATE POLICY "Allow insert order_status_history" ON order_status_history
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select order_status_history" ON order_status_history;
CREATE POLICY "Allow select order_status_history" ON order_status_history
  FOR SELECT USING (true);

-- 3. Cho phép ghi và đọc nhật ký kiểm toán (audit_log)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insert audit_log" ON audit_log;
CREATE POLICY "Allow insert audit_log" ON audit_log
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select audit_log" ON audit_log;
CREATE POLICY "Allow select audit_log" ON audit_log
  FOR SELECT USING (true);

-- 4. Cho phép cập nhật số lượng tồn kho sản phẩm (product_variants) khi hủy đơn
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow update product_variants" ON product_variants;
CREATE POLICY "Allow update product_variants" ON product_variants
  FOR UPDATE USING (true) WITH CHECK (true);

-- 5. Cho phép ghi và đọc thông tin vận đơn (shipments)
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insert shipments" ON shipments;
CREATE POLICY "Allow insert shipments" ON shipments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select shipments" ON shipments;
CREATE POLICY "Allow select shipments" ON shipments
  FOR SELECT USING (true);

-- 6. Cho phép ghi và đọc giao dịch ngân hàng (bank_transactions)
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insert bank_transactions" ON bank_transactions;
CREATE POLICY "Allow insert bank_transactions" ON bank_transactions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select bank_transactions" ON bank_transactions;
CREATE POLICY "Allow select bank_transactions" ON bank_transactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update bank_transactions" ON bank_transactions;
CREATE POLICY "Allow update bank_transactions" ON bank_transactions
  FOR UPDATE USING (true);

-- 7. Cho phép tạo và cập nhật yêu cầu đổi trả (return_requests)
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insert return_requests" ON return_requests;
CREATE POLICY "Allow insert return_requests" ON return_requests
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select return_requests" ON return_requests;
CREATE POLICY "Allow select return_requests" ON return_requests
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update return_requests" ON return_requests;
CREATE POLICY "Allow update return_requests" ON return_requests
  FOR UPDATE USING (true);

-- 8. Cho phép lưu và cập nhật cấu hình shop & tài khoản ngân hàng (settings)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow update settings" ON settings;
CREATE POLICY "Allow update settings" ON settings
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert settings" ON settings;
CREATE POLICY "Allow insert settings" ON settings
  FOR INSERT WITH CHECK (true);
