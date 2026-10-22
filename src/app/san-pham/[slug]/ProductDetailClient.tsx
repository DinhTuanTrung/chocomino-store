'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { createClient } from '@/lib/supabase/client';
import type { Product } from '@/types/database';
import {
  ShoppingBag,
  ArrowLeft,
  Check,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Truck,
  Bell,
} from 'lucide-react';

export function ProductDetailClient({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const variants = product.variants || [];
  const [selectedVariant, setSelectedVariant] = useState(variants[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);
  const [contactInput, setContactInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribeBackInStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactInput.trim()) return;
    try {
      const supabase = createClient();
      await supabase.from('back_in_stock_requests').insert({
        variant_id: selectedVariant?.id,
        contact: contactInput.trim(),
      });
    } catch (e) {
      // Safe fallback
    }
    setSubscribed(true);
  };

  const primaryImage =
    product.media?.find((m) => m.is_primary)?.url ||
    product.media?.[0]?.url ||
    '/placeholder.png';

  const isPreorder = selectedVariant?.status === 'preorder';
  const isOutOfStock =
    selectedVariant?.status === 'out_of_stock' ||
    (!isPreorder && (selectedVariant?.stock_qty || 0) <= 0);

  const maxStock = isPreorder ? 99 : selectedVariant?.stock_qty || 0;

  const handleAddToCart = () => {
    if (!selectedVariant || isOutOfStock) return;

    addToCart({
      productId: product.id,
      productName: product.name,
      variantId: selectedVariant.id,
      variantName: selectedVariant.name,
      price: selectedVariant.price,
      quantity,
      imageUrl: primaryImage,
      weightKg: Number(selectedVariant.weight_kg) || 0.2,
      isPreorder,
      maxStock,
    });

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  return (
    <div className="max-w-4xl w-full mx-auto px-4 py-4 md:py-6 space-y-6 pb-28 md:pb-12">
      {/* Breadcrumb Back */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7D5C5C] hover:text-[#F9739B] transition-colors"
        >
          <ArrowLeft size={14} /> Quay lại danh sách
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
        {/* Product Media Gallery */}
        <div className="space-y-3">
          <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-white border border-[#FFE8EF] shadow-sm">
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            {isPreorder && (
              <div className="absolute top-4 left-4 bg-[#FFD76A] text-[#5A3A3A] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                <Clock size={13} /> Pre-order
              </div>
            )}
          </div>
        </div>

        {/* Product Purchasing Info */}
        <div className="space-y-5">
          <div>
            <h1 className="font-title text-2xl md:text-3xl font-extrabold text-[#5A3A3A] leading-snug">
              {product.name}
            </h1>

            {/* Price Row */}
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-title text-2xl md:text-3xl font-bold text-[#E24C7C]">
                {selectedVariant?.price.toLocaleString('vi-VN')}đ
              </span>
              {selectedVariant?.compare_price &&
                selectedVariant.compare_price > selectedVariant.price && (
                  <span className="text-sm text-[#A39A9A] line-through">
                    {selectedVariant.compare_price.toLocaleString('vi-VN')}đ
                  </span>
                )}
            </div>
          </div>

          {/* Preorder Alert Notice */}
          {isPreorder && (
            <div className="p-3.5 rounded-2xl bg-[#FFD76A]/20 border border-[#FFD76A]/40 text-xs text-[#5A3A3A] space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-[#856404]">
                <Clock size={14} /> Sản phẩm đặt trước (Pre-order)
              </p>
              <p>
                Dự kiến có hàng vào ngày:{' '}
                <b>
                  {selectedVariant?.preorder_eta
                    ? new Date(selectedVariant.preorder_eta).toLocaleDateString('vi-VN')
                    : 'Đang cập nhật'}
                </b>
                . Đơn hàng pre-order thanh toán chuyển khoản QR trước để shop giữ hàng.
              </p>
            </div>
          )}

          {/* Low stock warning */}
          {!isPreorder && !isOutOfStock && selectedVariant && selectedVariant.stock_qty <= 5 && (
            <p className="text-xs font-bold text-[#E24C7C] flex items-center gap-1">
              <AlertTriangle size={14} /> Chỉ còn {selectedVariant.stock_qty} món trong kho!
            </p>
          )}

          {/* Variants Selector */}
          {variants.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#7D5C5C] uppercase tracking-wider">
                Chọn mẫu / phân loại:
              </label>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const isVarOut =
                    v.status === 'out_of_stock' || (v.status !== 'preorder' && v.stock_qty <= 0);

                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVariant(v);
                        setQuantity(1);
                      }}
                      disabled={isVarOut}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all ${
                        isSelected
                          ? 'bg-[#F9739B] text-white border-[#F9739B] shadow-sm'
                          : isVarOut
                          ? 'bg-gray-100 text-[#A39A9A] border-gray-200 line-through cursor-not-allowed'
                          : 'bg-white text-[#5A3A3A] border-[#FFE8EF] hover:border-[#F9739B]/50'
                      }`}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#7D5C5C] uppercase tracking-wider">
              Số lượng:
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-2xl bg-white border border-[#FFE8EF] p-1 shadow-xs">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-[#5A3A3A] hover:bg-[#FFE8EF] transition-colors disabled:opacity-40"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold text-sm text-[#5A3A3A]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                  disabled={quantity >= maxStock || isOutOfStock}
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-[#5A3A3A] hover:bg-[#FFE8EF] transition-colors disabled:opacity-40"
                >
                  +
                </button>
              </div>
              {!isPreorder && !isOutOfStock && (
                selectedVariant && selectedVariant.stock_qty <= 5 ? (
                  <span className="text-[11px] font-bold text-[#E24C7C] bg-[#FFE8EF] px-2.5 py-1 rounded-full animate-pulse">
                    🔥 Nhanh tay! Chỉ còn {selectedVariant.stock_qty} cái trên kệ
                  </span>
                ) : (
                  <span className="text-xs text-[#A39A9A]">
                    Còn {selectedVariant?.stock_qty} sản phẩm
                  </span>
                )
              )}
            </div>
          </div>

          {/* Back in Stock Notification (FR-C-10) */}
          {isOutOfStock && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
              <div className="flex items-center gap-2">
                <Bell size={15} className="text-amber-600" />
                <span className="font-bold text-xs text-[#5A3A3A]">
                  Báo tôi khi có hàng lại (FR-C-10)
                </span>
              </div>
              <p className="text-[11px] text-[#7D5C5C] leading-snug">
                Mẫu squishy này đang tạm hết hàng. Để lại Số điện thoại hoặc Zalo để shop ưu tiên thông báo cho bạn ngay khi hàng cập bến nhé!
              </p>
              {subscribed ? (
                <div className="p-2.5 rounded-xl bg-white border border-green-200 text-xs font-bold text-green-700 flex items-center gap-1.5 shadow-xs">
                  <Check size={14} className="text-green-600" />
                  <span>Đã ghi nhận! Shop sẽ báo cho bạn sớm nhất nhé.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribeBackInStock} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Số điện thoại / Zalo của bạn..."
                    value={contactInput}
                    onChange={(e) => setContactInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-amber-300 focus:outline-none focus:border-amber-500 text-xs text-[#5A3A3A]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
                  >
                    Đăng ký
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Desktop Add to Cart Button */}
          <div className="hidden md:block pt-2">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-full py-3.5 px-6 rounded-full bg-[#F9739B] text-white font-title text-base font-bold shadow-md hover:bg-[#E24C7C] transition-all disabled:bg-[#A39A9A] disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ShoppingBag size={18} />
              {isOutOfStock
                ? 'Tạm hết hàng'
                : isPreorder
                ? 'Đặt hàng Pre-order'
                : 'Thêm vào giỏ hàng'}
            </button>
          </div>

          {/* Assurances */}
          <div className="pt-4 border-t border-[#FFE8EF] grid grid-cols-2 gap-3 text-xs text-[#7D5C5C]">
            <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-[#FFE8EF]">
              <Truck size={16} className="text-[#9ADFC8]" />
              <span>Giao hàng SPX toàn quốc</span>
            </div>
            <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-[#FFE8EF]">
              <ShieldCheck size={16} className="text-[#9ADFC8]" />
              <span>Đổi trả 3 ngày nếu lỗi</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2 pt-2">
            <h2 className="font-title text-base font-bold text-[#5A3A3A]">Mô tả sản phẩm</h2>
            <p className="text-xs leading-relaxed text-[#7D5C5C] whitespace-pre-line bg-white p-4 rounded-2xl border border-[#FFE8EF]">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Add to Cart Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#FFE8EF] p-3 px-4 flex items-center justify-between gap-3 shadow-lg">
        <div>
          <span className="text-[10px] text-[#A39A9A]">Tổng tạm tính:</span>
          <p className="font-title text-lg font-bold text-[#E24C7C]">
            {((selectedVariant?.price || 0) * quantity).toLocaleString('vi-VN')}đ
          </p>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="flex-1 max-w-[220px] py-3 px-5 rounded-full bg-[#F9739B] text-white font-title text-sm font-bold shadow-md hover:bg-[#E24C7C] transition-all disabled:bg-[#A39A9A] disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <ShoppingBag size={16} />
          {isOutOfStock ? 'Hết hàng' : isPreorder ? 'Pre-order' : 'Thêm vào giỏ'}
        </button>
      </div>

      {/* Added Toast Notification */}
      {addedToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-[#5A3A3A] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 animate-bounce">
          <Check size={16} className="text-[#9ADFC8]" /> Đã thêm vào giỏ hàng!
        </div>
      )}
    </div>
  );
}
