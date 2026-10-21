'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { Trash2, ArrowRight, ArrowLeft, ShoppingBag, Clock, Sparkles } from 'lucide-react';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, subtotal, hasPreorder } = useCart();

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F6]">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h1 className="font-title text-2xl font-bold text-[#5A3A3A] flex items-center gap-2">
            <ShoppingBag className="text-[#F9739B]" size={24} /> Giỏ hàng của bạn
          </h1>
          <Link
            href="/"
            className="text-xs font-bold text-[#7D5C5C] hover:text-[#F9739B] flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={14} /> Tiếp tục chọn món
          </Link>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#FFE8EF] p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#FFE8EF] text-[#F9739B] mx-auto flex items-center justify-center">
              <ShoppingBag size={28} />
            </div>
            <h2 className="font-title text-xl font-bold text-[#5A3A3A]">
              Giỏ hàng của bạn đang trống trơn! 🍰
            </h2>
            <p className="text-xs text-[#7D5C5C] max-w-sm mx-auto">
              Hãy lượn một vòng khám phá những mẫu squishy bồng bềnh siêu dễ thương của tiệm nhé.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#F9739B] text-white font-title font-bold text-sm shadow-md hover:bg-[#E24C7C] transition-all"
            >
              Khám phá đồ xinh ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Cart Items List */}
            <div className="md:col-span-2 space-y-3">
              {/* Pre-order Notice */}
              {hasPreorder && (
                <div className="p-3.5 rounded-2xl bg-[#FFD76A]/20 border border-[#FFD76A]/40 text-xs text-[#5A3A3A] flex items-start gap-2.5">
                  <Clock size={16} className="text-[#856404] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-[#856404]">Đơn hàng có món Pre-order (Đặt trước)</p>
                    <p className="text-[#7D5C5C]">
                      Đơn hàng có sản phẩm đặt trước sẽ được thanh toán chuyển khoản QR trả trước và <b>giao 1 lần khi toàn bộ sản phẩm về đủ</b>.
                    </p>
                  </div>
                </div>
              )}

              {/* Items Card */}
              <div className="bg-white rounded-3xl border border-[#FFE8EF] divide-y divide-[#FFE8EF] overflow-hidden shadow-xs">
                {cart.map((item) => (
                  <div key={item.variantId} className="p-4 flex gap-3.5 items-center">
                    {/* Item Image */}
                    <div className="relative w-16 h-16 rounded-2xl bg-[#FFF9F6] overflow-hidden shrink-0 border border-[#FFE8EF]">
                      <Image
                        src={item.imageUrl || '/placeholder.png'}
                        alt={item.productName}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-xs md:text-sm text-[#5A3A3A] truncate">
                        {item.productName}
                      </h3>
                      <p className="text-[11px] text-[#A39A9A]">
                        Phân loại: <span className="font-semibold text-[#5A3A3A]">{item.variantName}</span>
                      </p>
                      <div className="pt-1 flex items-baseline gap-2">
                        <span className="font-title font-bold text-sm text-[#E24C7C]">
                          {item.price.toLocaleString('vi-VN')}đ
                        </span>
                        {item.isPreorder && (
                          <span className="text-[10px] bg-[#FFD76A]/40 text-[#5A3A3A] font-bold px-1.5 py-0.5 rounded-md">
                            Pre-order
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center rounded-xl bg-[#FFF9F6] border border-[#FFE8EF] p-0.5 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.variantId, -1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-[#5A3A3A] hover:bg-[#FFE8EF] transition-colors"
                      >
                        -
                      </button>
                      <span className="w-7 text-center font-bold text-xs text-[#5A3A3A]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.variantId, 1)}
                        disabled={!item.isPreorder && item.quantity >= item.maxStock}
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-[#5A3A3A] hover:bg-[#FFE8EF] transition-colors disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.variantId)}
                      className="p-2 text-[#A39A9A] hover:text-[#E24C7C] transition-colors shrink-0"
                      aria-label="Xóa món"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="bg-white rounded-3xl border border-[#FFE8EF] p-5 space-y-4 shadow-xs">
              <h3 className="font-title text-base font-bold text-[#5A3A3A]">Tóm tắt đơn hàng</h3>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#7D5C5C]">
                  <span>Tổng tiền hàng:</span>
                  <span className="font-bold text-[#5A3A3A]">{subtotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-[#7D5C5C]">
                  <span>Phí vận chuyển:</span>
                  <span className="text-[11px] text-[#A39A9A]">Tính ở bước thanh toán</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#FFE8EF] flex justify-between items-baseline">
                <span className="font-bold text-sm text-[#5A3A3A]">Tạm tính:</span>
                <span className="font-title text-xl font-bold text-[#E24C7C]">
                  {subtotal.toLocaleString('vi-VN')}đ
                </span>
              </div>

              <Link
                href="/thanh-toan"
                className="w-full py-3.5 px-4 rounded-full bg-[#F9739B] text-white font-title text-sm font-bold shadow-md hover:bg-[#E24C7C] transition-all flex items-center justify-center gap-2"
              >
                Tiến hành thanh toán <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
