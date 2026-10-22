'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Phone, Send } from 'lucide-react';

export function FloatingContact() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Do not render floating contact inside admin dashboard
  if (pathname.startsWith('/admin')) {
    return null;
  }

  // Adjust bottom position so it doesn't overlap sticky buy bar on product detail pages
  const isProductDetail = pathname.startsWith('/san-pham/');
  const bottomClass = isProductDetail ? 'bottom-20 md:bottom-6' : 'bottom-6';

  const shopPhone = process.env.NEXT_PUBLIC_SHOP_PHONE || '0900000000';
  const zaloUrl = `https://zalo.me/${shopPhone}`;
  const messengerUrl = 'https://m.me/chocomino.squishy';

  return (
    <div className={`fixed ${bottomClass} right-4 md:right-6 z-40 print:hidden`}>
      {/* Expanded Contact Card */}
      {isOpen && (
        <div className="mb-3 w-72 rounded-3xl bg-white border border-[#FFE8EF] p-4 shadow-xl space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between border-b border-[#FFE8EF] pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="font-title text-sm font-bold text-[#5A3A3A]">
                Hỗ trợ Chocomino 💬
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-[#A39A9A] hover:text-[#5A3A3A] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-[11px] text-[#7D5C5C] leading-snug">
            Cần tư vấn mẫu squishy bóp êm hoặc hỗ trợ đơn hàng? Nhắn tin ngay cho tụi mình nhé:
          </p>

          <div className="space-y-2">
            {/* Zalo Button */}
            <a
              href={zaloUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-2xl bg-blue-50/70 hover:bg-blue-100 text-blue-700 transition-colors border border-blue-200"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                Zalo
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-bold text-xs">Chat qua Zalo</p>
                <p className="text-[10px] text-blue-600/80">Phản hồi trong 5 phút</p>
              </div>
            </a>

            {/* Messenger Button */}
            <a
              href={messengerUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-2xl bg-pink-50/70 hover:bg-pink-100 text-[#E24C7C] transition-colors border border-[#FFE8EF]"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#F9739B] to-[#9333EA] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                <Send size={14} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-bold text-xs">Chat Facebook</p>
                <p className="text-[10px] text-[#7D5C5C]">Fanpage Chocomino</p>
              </div>
            </a>

            {/* Hotline Call */}
            <a
              href={`tel:${shopPhone}`}
              className="flex items-center gap-3 p-2.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100 text-amber-800 transition-colors border border-amber-200"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Phone size={14} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-bold text-xs">Gọi Hotline</p>
                <p className="text-[10px] text-amber-700/80">{shopPhone}</p>
              </div>
            </a>
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2 pl-3.5 pr-4 py-3 rounded-full bg-gradient-to-r from-[#E24C7C] to-[#F9739B] text-white font-title text-xs font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
        title="Chat với Chocomino"
      >
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD76A] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#FFD76A]"></span>
        </span>
        <MessageCircle size={18} className="animate-bounce" />
        <span className="hidden sm:inline">Hỏi shop</span>
      </button>
    </div>
  );
}
