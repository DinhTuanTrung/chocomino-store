'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { AdminNav } from '@/components/AdminNav';
import { createClient } from '@/lib/supabase/client';
import type { Product, Category, ProductVariant } from '@/types/database';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Edit,
} from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  const fetchLiveProducts = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const [prodRes, catRes] = await Promise.all([
        supabase
          .from('products')
          .select('*, category:categories(*), variants:product_variants(*), media:product_media(*)')
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      ]);

      if (prodRes.data) {
        setProducts(prodRes.data as Product[]);
      }
      if (catRes.data) {
        setCategories(catRes.data as Category[]);
      }
    } catch (e) {
      console.error('Lỗi khi nạp dữ liệu admin:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveProducts();
  }, []);

  const handleAdjustStock = async (variantId: string, delta: number) => {
    setAdjustingId(variantId);
    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, delta }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || 'Không thể cập nhật tồn kho');
        return;
      }

      // Update local state smoothly
      setProducts((prev) =>
        prev.map((prod) => ({
          ...prod,
          variants: prod.variants?.map((v) =>
            v.id === variantId
              ? { ...v, stock_qty: data.newStock, status: data.newStatus }
              : v
          ),
        }))
      );
    } catch (err) {
      alert('Lỗi kết nối khi cập nhật tồn kho');
    } finally {
      setAdjustingId(null);
    }
  };

  const filteredProducts = products.filter((prod) => {
    if (selectedCat !== 'all' && prod.category_id !== selectedCat) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = prod.name.toLowerCase().includes(q);
      const matchSku = prod.variants?.some((v) => v.sku?.toLowerCase().includes(q));
      if (!matchName && !matchSku) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FFF9F6] text-[#5A3A3A]">
      <AdminNav />

      <main className="max-w-6xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Title & Refresh */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-title text-2xl md:text-3xl font-extrabold text-[#5A3A3A] flex items-center gap-2">
              <Package className="text-[#F9739B]" size={28} /> Quản lý Sản phẩm & Tồn kho
            </h1>
            <p className="text-xs text-[#7D5C5C]">
              Xem danh sách, kiểm kê kho nhanh (+/−), cập nhật phân loại và theo dõi trạng thái hàng hóa.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLiveProducts}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-[#FFE8EF] hover:border-[#F9739B] text-xs font-bold text-[#5A3A3A] transition-all shadow-xs"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-3xl border border-[#FFE8EF] p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FFF9F6] border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs text-[#5A3A3A]"
            />
            <Search size={15} className="absolute left-3 top-2.5 text-[#A39A9A]" />
          </div>

          {/* Categories Filter */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            <span className="text-xs text-[#A39A9A] shrink-0">Danh mục:</span>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#FFF9F6] border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none text-xs font-bold text-[#5A3A3A]"
            >
              <option value="all">Tất cả danh mục ({products.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products List Table */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-[#FFE8EF] text-xs text-[#7D5C5C]">
              Đang tải dữ liệu sản phẩm từ Supabase...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#FFE8EF] p-6 text-xs text-[#7D5C5C]">
              Không tìm thấy sản phẩm nào phù hợp.
            </div>
          ) : (
            filteredProducts.map((prod) => {
              const primaryImg =
                prod.media?.find((m) => m.is_primary)?.url ||
                prod.media?.[0]?.url ||
                '/placeholder.png';

              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-3xl border border-[#FFE8EF] p-5 shadow-xs space-y-4"
                >
                  {/* Product Header */}
                  <div className="flex items-start gap-4 pb-3 border-b border-[#FFE8EF]">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-[#FFF9F6] border border-[#FFE8EF] shrink-0">
                      <Image
                        src={primaryImg}
                        alt={prod.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="font-title text-base font-bold text-[#5A3A3A] truncate">
                          {prod.name}
                        </h2>
                        {prod.is_featured && (
                          <span className="text-[10px] font-bold bg-[#FFE8EF] text-[#E24C7C] px-2 py-0.5 rounded-full">
                            Nổi bật
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#A39A9A] line-clamp-1 mt-0.5">
                        {prod.description}
                      </p>
                      <p className="text-[10px] text-[#7D5C5C] mt-1 font-mono">
                        Slug: /{prod.slug}
                      </p>
                    </div>
                  </div>

                  {/* Variants List */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-[#7D5C5C] uppercase tracking-wider">
                      Các phân loại & Kho hàng:
                    </span>
                    <div className="divide-y divide-[#FFE8EF] border border-[#FFE8EF] rounded-2xl overflow-hidden">
                      {prod.variants?.map((v) => {
                        const isAdjusting = adjustingId === v.id;
                        const isPre = v.status === 'preorder';
                        const isOut = v.status === 'out_of_stock' || (!isPre && v.stock_qty <= 0);

                        return (
                          <div
                            key={v.id}
                            className="p-3 bg-[#FFF9F6]/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                          >
                            {/* Variant Info */}
                            <div className="space-y-0.5 md:w-1/3">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#5A3A3A]">{v.name}</span>
                                {isPre ? (
                                  <span className="text-[10px] font-bold bg-[#FFD76A] text-[#5A3A3A] px-2 py-0.5 rounded-full">
                                    Pre-order
                                  </span>
                                ) : isOut ? (
                                  <span className="text-[10px] font-bold bg-[#A39A9A] text-white px-2 py-0.5 rounded-full">
                                    Hết hàng
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                    Còn hàng
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#A39A9A] font-mono">
                                SKU: {v.sku || 'Chưa gán'} | Nặng: {v.weight_kg}kg
                              </p>
                            </div>

                            {/* Price */}
                            <div className="md:w-1/4">
                              <span className="font-title font-bold text-sm text-[#E24C7C]">
                                {v.price.toLocaleString('vi-VN')}đ
                              </span>
                              {v.compare_price && (
                                <span className="text-[11px] text-[#A39A9A] line-through ml-2">
                                  {v.compare_price.toLocaleString('vi-VN')}đ
                                </span>
                              )}
                            </div>

                            {/* Stock Quantity & Quick Adjustment Buttons */}
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="text-[10px] text-[#A39A9A] block">Tồn kho</span>
                                <span className="font-title font-bold text-base text-[#5A3A3A]">
                                  {v.stock_qty}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#FFE8EF]">
                                <button
                                  onClick={() => handleAdjustStock(v.id, -5)}
                                  disabled={isAdjusting || v.stock_qty < 5}
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold hover:bg-[#FFE8EF] text-[#E24C7C] transition-colors disabled:opacity-30"
                                  title="Giảm 5 món"
                                >
                                  -5
                                </button>
                                <button
                                  onClick={() => handleAdjustStock(v.id, -1)}
                                  disabled={isAdjusting || v.stock_qty <= 0}
                                  className="px-2 py-1 rounded-lg text-xs font-bold hover:bg-[#FFE8EF] text-[#E24C7C] transition-colors disabled:opacity-30"
                                  title="Giảm 1 món"
                                >
                                  -1
                                </button>
                                <button
                                  onClick={() => handleAdjustStock(v.id, 1)}
                                  disabled={isAdjusting}
                                  className="px-2 py-1 rounded-lg text-xs font-bold hover:bg-[#FFE8EF] text-green-700 transition-colors disabled:opacity-30"
                                  title="Tăng 1 món"
                                >
                                  +1
                                </button>
                                <button
                                  onClick={() => handleAdjustStock(v.id, 5)}
                                  disabled={isAdjusting}
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold hover:bg-[#FFE8EF] text-green-700 transition-colors disabled:opacity-30"
                                  title="Tăng 5 món"
                                >
                                  +5
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
