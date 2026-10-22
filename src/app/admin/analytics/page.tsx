'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminNav } from '@/components/AdminNav';
import { createClient } from '@/lib/supabase/client';
import type { Order, Product, ProductVariant } from '@/types/database';
import {
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Truck,
  RotateCcw,
  Share2,
  AlertTriangle,
  ArrowUpRight,
  Package,
  Calendar,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | '7days' | 'month' | 'all'>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const [ordersRes, productsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*, variants:product_variants(*)').eq('is_active', true),
      ]);

      if (ordersRes.data) {
        setOrders(ordersRes.data as Order[]);
      }
      if (productsRes.data) {
        setProducts(productsRes.data as Product[]);
      }
    } catch (e) {
      console.warn('Error fetching analytics data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter orders by time range
  const filteredOrders = orders.filter((o) => {
    if (timeRange === 'all') return true;
    const orderDate = new Date(o.created_at);
    const now = new Date();
    if (timeRange === 'today') {
      return orderDate.toDateString() === now.toDateString();
    }
    if (timeRange === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return orderDate >= sevenDaysAgo;
    }
    if (timeRange === 'month') {
      return (
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
    }
    return true;
  });

  // Calculate metrics (FR-A-50, FR-A-51)
  const validOrders = filteredOrders.filter(
    (o) => o.status !== 'cancelled' && o.status !== 'return_rejected' && o.status !== 'refunded'
  );
  const completedOrders = filteredOrders.filter((o) => o.status === 'completed');
  const cancelledOrders = filteredOrders.filter((o) => o.status === 'cancelled');
  const returnedOrders = filteredOrders.filter(
    (o) => o.status === 'refunded' || o.status === 'returned' || o.status === 'return_requested'
  );

  const totalRevenue = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const codRevenue = validOrders
    .filter((o) => o.payment_method === 'cod')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const qrRevenue = validOrders
    .filter((o) => o.payment_method === 'bank_qr')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const aov = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;
  const returnRate =
    filteredOrders.length > 0
      ? Math.round(((cancelledOrders.length + returnedOrders.length) / filteredOrders.length) * 100)
      : 0;

  // Source / Traffic Breakdown (FR-A-55)
  const channelMap: Record<string, { name: string; count: number; revenue: number; color: string }> = {
    tiktok: { name: 'TikTok', count: 0, revenue: 0, color: 'bg-black text-white' },
    facebook: { name: 'Facebook', count: 0, revenue: 0, color: 'bg-blue-600 text-white' },
    threads: { name: 'Threads', count: 0, revenue: 0, color: 'bg-zinc-800 text-white' },
    instagram: { name: 'Instagram', count: 0, revenue: 0, color: 'bg-gradient-to-r from-yellow-500 to-pink-600 text-white' },
    zalo: { name: 'Zalo', count: 0, revenue: 0, color: 'bg-blue-500 text-white' },
    direct: { name: 'Google / Trực tiếp', count: 0, revenue: 0, color: 'bg-emerald-600 text-white' },
    gioithieu: { name: 'Bạn bè giới thiệu', count: 0, revenue: 0, color: 'bg-purple-600 text-white' },
    other: { name: 'Khác', count: 0, revenue: 0, color: 'bg-gray-500 text-white' },
  };

  validOrders.forEach((o) => {
    const rawSrc = (o.source || 'direct').toLowerCase();
    const key = channelMap[rawSrc] ? rawSrc : 'other';
    channelMap[key].count += 1;
    channelMap[key].revenue += o.total || 0;
  });

  // Low stock variants (threshold <= 5) (FR-A-50, FR-A-53)
  const lowStockItems: Array<{
    productName: string;
    variantName: string;
    stockQty: number;
    sku: string | null;
  }> = [];

  products.forEach((p) => {
    p.variants?.forEach((v) => {
      if (v.status !== 'preorder' && v.stock_qty <= 5) {
        lowStockItems.push({
          productName: p.name,
          variantName: v.name,
          stockQty: v.stock_qty,
          sku: v.sku,
        });
      }
    });
  });

  return (
    <div className="min-h-screen bg-[#FFF9F6]">
      <AdminNav />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Header & Date Range Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-title text-2xl font-bold text-[#5A3A3A] flex items-center gap-2">
              <TrendingUp size={24} className="text-[#E24C7C]" />
              Báo Cáo & Nguồn Tiếp Thị
            </h1>
            <p className="text-xs text-[#7D5C5C] mt-1">
              Thống kê doanh thu thực tế, hiệu quả các kênh UTM và cảnh báo tồn kho (FR-A-50..55)
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 rounded-full bg-white border border-[#FFE8EF] hover:border-[#F9739B] text-[#5A3A3A] shadow-xs transition-all"
              title="Làm mới số liệu"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            <div className="inline-flex rounded-full bg-white border border-[#FFE8EF] p-1 text-xs font-bold shadow-xs">
              {[
                { id: 'today', label: 'Hôm nay' },
                { id: '7days', label: '7 ngày qua' },
                { id: 'month', label: 'Tháng này' },
                { id: 'all', label: 'Toàn thời gian' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTimeRange(tab.id as any)}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    timeRange === tab.id
                      ? 'bg-[#5A3A3A] text-white shadow-xs'
                      : 'text-[#7D5C5C] hover:text-[#5A3A3A]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Main KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <div className="bg-white rounded-3xl border border-[#FFE8EF] p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#7D5C5C]">
              <span>Tổng doanh thu</span>
              <div className="w-8 h-8 rounded-full bg-[#FFE8EF] text-[#E24C7C] flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
            </div>
            <p className="font-title text-2xl font-bold text-[#5A3A3A]">
              {totalRevenue.toLocaleString('vi-VN')}đ
            </p>
            <p className="text-[11px] text-[#A39A9A]">
              Đã trừ đơn hủy & hoàn ({validOrders.length} đơn hợp lệ)
            </p>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-3xl border border-[#FFE8EF] p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#7D5C5C]">
              <span>Số lượng đơn</span>
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingBag size={16} />
              </div>
            </div>
            <p className="font-title text-2xl font-bold text-[#5A3A3A]">
              {filteredOrders.length}
            </p>
            <p className="text-[11px] text-green-600 font-bold">
              ✓ {completedOrders.length} đơn đã giao thành công
            </p>
          </div>

          {/* Average Order Value (AOV) */}
          <div className="bg-white rounded-3xl border border-[#FFE8EF] p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#7D5C5C]">
              <span>Giá trị đơn TB (AOV)</span>
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
                <ArrowUpRight size={16} />
              </div>
            </div>
            <p className="font-title text-2xl font-bold text-[#5A3A3A]">
              {aov.toLocaleString('vi-VN')}đ
            </p>
            <p className="text-[11px] text-[#A39A9A]">
              Bình quân mỗi lượt đặt hàng
            </p>
          </div>

          {/* Return / Cancel Rate */}
          <div className="bg-white rounded-3xl border border-[#FFE8EF] p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#7D5C5C]">
              <span>Tỷ lệ hoàn / hủy</span>
              <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                <RotateCcw size={16} />
              </div>
            </div>
            <p className="font-title text-2xl font-bold text-[#5A3A3A]">
              {returnRate}%
            </p>
            <p className="text-[11px] text-[#A39A9A]">
              {cancelledOrders.length} đơn hủy, {returnedOrders.length} đơn hoàn
            </p>
          </div>
        </div>

        {/* Grid: Payment Method Breakdown & Marketing Traffic Attribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Method Distribution */}
          <div className="bg-white rounded-3xl border border-[#FFE8EF] p-6 shadow-xs space-y-4">
            <h2 className="font-title text-base font-bold text-[#5A3A3A] flex items-center gap-2">
              <CreditCard size={18} className="text-[#E24C7C]" />
              Doanh Thu Theo Phương Thức Thanh Toán (FR-A-51)
            </h2>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-[#FFF9F6] border border-[#FFE8EF] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#7D5C5C]">
                  <Truck size={14} className="text-[#9ADFC8]" />
                  <span>Tiền mặt (COD)</span>
                </div>
                <p className="font-title text-lg font-bold text-[#5A3A3A]">
                  {codRevenue.toLocaleString('vi-VN')}đ
                </p>
                <p className="text-[11px] text-[#A39A9A]">
                  {validOrders.filter((o) => o.payment_method === 'cod').length} đơn hàng ({totalRevenue > 0 ? Math.round((codRevenue / totalRevenue) * 100) : 0}%)
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFF9F6] border border-[#FFE8EF] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#7D5C5C]">
                  <CreditCard size={14} className="text-[#E24C7C]" />
                  <span>Chuyển khoản (VietQR)</span>
                </div>
                <p className="font-title text-lg font-bold text-[#5A3A3A]">
                  {qrRevenue.toLocaleString('vi-VN')}đ
                </p>
                <p className="text-[11px] text-[#A39A9A]">
                  {validOrders.filter((o) => o.payment_method === 'bank_qr').length} đơn hàng ({totalRevenue > 0 ? Math.round((qrRevenue / totalRevenue) * 100) : 0}%)
                </p>
              </div>
            </div>

            {/* Proportion Bar */}
            {totalRevenue > 0 && (
              <div className="space-y-1 pt-2">
                <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden flex">
                  <div
                    style={{ width: `${(codRevenue / totalRevenue) * 100}%` }}
                    className="bg-[#9ADFC8]"
                    title="COD"
                  />
                  <div
                    style={{ width: `${(qrRevenue / totalRevenue) * 100}%` }}
                    className="bg-[#E24C7C]"
                    title="VietQR"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#A39A9A]">
                  <span>COD ({Math.round((codRevenue / totalRevenue) * 100)}%)</span>
                  <span>VietQR ({Math.round((qrRevenue / totalRevenue) * 100)}%)</span>
                </div>
              </div>
            )}
          </div>

          {/* Traffic Attribution (FR-A-55) */}
          <div className="bg-white rounded-3xl border border-[#FFE8EF] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-title text-base font-bold text-[#5A3A3A] flex items-center gap-2">
                <Share2 size={18} className="text-[#E24C7C]" />
                Nguồn Tiếp Thị & Doanh Thu Mạng Xã Hội (FR-A-55)
              </h2>
            </div>
            <p className="text-xs text-[#7D5C5C]">
              Thống kê lượng đơn và doanh thu ghi nhận từ link UTM và khảo sát khách hàng:
            </p>

            <div className="divide-y divide-[#FFE8EF] border border-[#FFE8EF] rounded-2xl overflow-hidden text-xs">
              {Object.entries(channelMap).map(([key, item]) => {
                const percent =
                  totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 0;
                return (
                  <div
                    key={key}
                    className="p-3 bg-[#FFF9F6]/40 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.color}`}>
                        {item.name}
                      </span>
                      <span className="text-[11px] text-[#7D5C5C]">
                        {item.count} đơn ({percent}%)
                      </span>
                    </div>
                    <span className="font-bold text-[#5A3A3A]">
                      {item.revenue.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Low Stock Warning Section (FR-A-50, FR-A-53) */}
        <div className="bg-white rounded-3xl border border-[#FFE8EF] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-title text-base font-bold text-[#5A3A3A] flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              Cảnh Báo Tồn Kho Sắp Hết (Dưới 5 cái)
            </h2>
            <Link
              href="/admin/products"
              className="text-xs font-bold text-[#E24C7C] hover:underline inline-flex items-center gap-1"
            >
              <span>Quản lý kho</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-xs text-green-700 flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>Tất cả các mặt hàng hiện đều còn dồi dào trên kệ (tồn kho an toàn &gt; 5 cái).</span>
            </div>
          ) : (
            <div className="divide-y divide-[#FFE8EF] border border-[#FFE8EF] rounded-2xl overflow-hidden text-xs">
              {lowStockItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-amber-50/40 flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-bold text-[#5A3A3A]">
                      {item.productName} <span className="font-normal text-[#7D5C5C]">({item.variantName})</span>
                    </p>
                    {item.sku && <p className="text-[10px] text-[#A39A9A]">SKU: {item.sku}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.stockQty === 0
                          ? 'bg-rose-100 text-rose-700 animate-pulse'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.stockQty === 0 ? 'Hết hàng (0)' : `Chỉ còn ${item.stockQty}`}
                    </span>
                    <Link
                      href="/admin/products"
                      className="px-3 py-1 rounded-xl bg-white border border-[#FFE8EF] hover:border-[#F9739B] text-[11px] font-bold text-[#5A3A3A] transition-all"
                    >
                      + Nhập thêm
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
