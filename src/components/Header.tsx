'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Sparkles, Menu, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export function Header() {
  const { totalItemsCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFF9F6]/90 backdrop-blur-md border-b border-[#FFE8EF]">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#5A3A3A] hover:bg-[#FFE8EF] rounded-full transition-colors"
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-1.5 group">
          <div className="w-8 h-8 rounded-full bg-[#F9739B] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Sparkles size={16} />
          </div>
          <span className="font-title text-2xl font-bold tracking-tight text-[#5A3A3A] group-hover:text-[#F9739B] transition-colors">
            chocomino
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#5A3A3A]">
          <Link href="/" className="hover:text-[#F9739B] transition-colors">
            Trang chủ
          </Link>
          <Link href="/#products" className="hover:text-[#F9739B] transition-colors">
            Sản phẩm
          </Link>
          <Link href="/tra-cuu" className="hover:text-[#F9739B] transition-colors">
            Tra cứu đơn
          </Link>
        </nav>

        {/* Actions: Cart */}
        <div className="flex items-center gap-2">
          <Link
            href="/gio-hang"
            className="relative flex items-center justify-center w-11 h-11 rounded-full bg-[#FFE8EF] text-[#E24C7C] hover:bg-[#F9739B] hover:text-white transition-all shadow-sm"
            aria-label="Giỏ hàng"
          >
            <ShoppingBag size={20} />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#F9739B] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {totalItemsCount > 99 ? '99+' : totalItemsCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FFF9F6] border-b border-[#FFE8EF] px-4 py-4 space-y-3 font-semibold text-[#5A3A3A]">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 rounded-xl hover:bg-[#FFE8EF] transition-colors"
          >
            Trang chủ
          </Link>
          <Link
            href="/#products"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 rounded-xl hover:bg-[#FFE8EF] transition-colors"
          >
            Danh sách Squishy
          </Link>
          <Link
            href="/tra-cuu"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 rounded-xl hover:bg-[#FFE8EF] transition-colors"
          >
            Tra cứu đơn hàng
          </Link>
        </div>
      )}
    </header>
  );
}
