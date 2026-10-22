'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag, Package, Settings, ExternalLink, Sparkles, LogOut, BarChart3, Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const previousCountRef = useRef<number | null>(null);

  // Play notification chime using Web Audio API (FR-A-73)
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  };

  // Poll for new/pending orders and return requests (FR-A-73)
  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    const checkPendingOrders = async () => {
      try {
        const { count, error } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['new', 'return_requested']);

        if (!error && count !== null && isMounted) {
          if (previousCountRef.current !== null && count > previousCountRef.current) {
            playChime();
          }
          previousCountRef.current = count;
          setPendingCount(count);
        }
      } catch (e) {
        // Safe catch
      }
    };

    checkPendingOrders();
    const interval = setInterval(checkPendingOrders, 30000); // Poll every 30s

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { href: '/admin/orders', label: 'Đơn hàng & SPX', icon: ShoppingBag, badge: pendingCount },
    { href: '/admin/products', label: 'Sản phẩm & Tồn kho', icon: Package },
    { href: '/admin/analytics', label: 'Báo cáo & Nguồn đơn', icon: BarChart3 },
    { href: '/admin/settings', label: 'Cài đặt shop', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (e) {
      router.push('/admin/login');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#FFE8EF]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-[#E24C7C] text-white flex items-center justify-center font-bold shadow-xs">
              <Sparkles size={16} />
            </div>
            <span className="font-title text-xl font-bold text-[#5A3A3A]">
              chocomino <span className="text-xs bg-[#FFE8EF] text-[#E24C7C] px-2 py-0.5 rounded-full font-bold">Admin</span>
            </span>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-bold">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-colors ${
                  isActive
                    ? 'bg-[#FFE8EF] text-[#E24C7C]'
                    : 'text-[#7D5C5C] hover:bg-[#FFF9F6]'
                }`}
              >
                <Icon size={15} />
                <span>{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#E24C7C] text-white text-[10px] font-bold animate-pulse">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* User Actions: Storefront & Logout */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-[#7D5C5C] hover:text-[#F9739B] transition-colors"
          >
            <span>Xem web shop</span>
            <ExternalLink size={13} />
          </Link>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-red-600 px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors"
            title="Đăng xuất khỏi hệ thống quản trị"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
}
