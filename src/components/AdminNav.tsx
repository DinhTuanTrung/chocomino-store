'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Package, Settings, ExternalLink, Sparkles } from 'lucide-react';

export function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin/orders', label: 'Đơn hàng & SPX', icon: ShoppingBag },
    { href: '/admin/products', label: 'Sản phẩm & Tồn kho', icon: Package },
    { href: '/admin/settings', label: 'Cài đặt shop', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#FFE8EF]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-[#E24C7C] text-white flex items-center justify-center font-bold">
              <Sparkles size={16} />
            </div>
            <span className="font-title text-xl font-bold text-[#5A3A3A]">
              chocomino <span className="text-xs bg-[#FFE8EF] text-[#E24C7C] px-2 py-0.5 rounded-full">Admin</span>
            </span>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 text-xs font-bold">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-colors ${
                  isActive
                    ? 'bg-[#FFE8EF] text-[#E24C7C]'
                    : 'text-[#7D5C5C] hover:bg-[#FFF9F6]'
                }`}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* View Storefront */}
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#7D5C5C] hover:text-[#F9739B] transition-colors"
        >
          <span>Xem web shop</span>
          <ExternalLink size={13} />
        </Link>
      </div>
    </header>
  );
}
