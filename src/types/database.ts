// ==============================================================================
// CHOCOMINO TYPE DEFINITIONS
// ==============================================================================

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'awaiting_stock'
  | 'packing'
  | 'shipping'
  | 'completed'
  | 'cancelled'
  | 'return_requested'
  | 'return_approved'
  | 'return_rejected'
  | 'returned'
  | 'refunded';

export type PaymentStatus =
  | 'unpaid'
  | 'awaiting'
  | 'paid'
  | 'expired'
  | 'needs_review'
  | 'refund_pending'
  | 'refunded';

export type PaymentMethod = 'cod' | 'bank_qr';

export type VariantStatus = 'in_stock' | 'out_of_stock' | 'preorder';

export type UserRole = 'owner' | 'staff';

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price: number;
  compare_price: number | null;
  stock_qty: number;
  status: VariantStatus;
  preorder_eta: string | null;
  preorder_limit: number | null;
  weight_kg: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductMedia {
  id: string;
  product_id: string;
  type: 'image' | 'video';
  url: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  is_featured: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  variants?: ProductVariant[];
  media?: ProductMedia[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name_snapshot: string;
  variant_name_snapshot: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at: string;
}

export interface Order {
  id: string;
  code: string;
  customer_id: string | null;
  customer_name: string;
  phone: string;
  email: string;
  address_province: string;
  address_ward: string;
  address_detail: string;
  note: string | null;
  is_preorder: boolean;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal: number;
  shipping_fee: number;
  total: number;
  source: string | null;
  cancel_reason: string | null;
  internal_note: string | null;
  expires_at: string | null;
  idempotency_key: string | null;
  anonymized_at: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  returns?: ReturnRequest[];
}

export interface ReturnRequest {
  id: string;
  order_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'resolved';
  customer_reason: string;
  customer_description: string | null;
  photos: string[];
  video_url: string | null;
  shop_note: string | null;
  resolved_by: string | null;
  resolution: 'approved' | 'rejected' | 'refunded' | 'refund' | 'exchange' | null;
  refund_amount: number;
  created_at: string;
  resolved_at: string | null;
}

export interface Customer {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  first_source: string | null;
  total_orders: number;
  total_spent: number;
  note: string | null;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  before_data: any;
  after_data: any;
  created_at: string;
}

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  weightKg: number;
  isPreorder: boolean;
  maxStock: number;
}
