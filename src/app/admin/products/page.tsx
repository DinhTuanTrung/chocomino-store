'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { AdminNav } from '@/components/AdminNav';
import { createClient } from '@/lib/supabase/client';
import type { Product, Category, ProductVariant } from '@/types/database';
import { CsvProductImportModal } from '@/components/CsvProductImportModal';
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
  X,
  Trash2,
  Image as ImageIcon,
  Copy,
  FileSpreadsheet,
} from 'lucide-react';

interface NewVariantForm {
  name: string;
  sku: string;
  price: number;
  comparePrice: number | null;
  stockQty: number;
  weightKg: number;
  status: 'in_stock' | 'out_of_stock' | 'preorder';
  preorderEta: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  // Create Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategoryId, setNewProductCategoryId] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductImage, setNewProductImage] = useState('');
  const [newProductIsFeatured, setNewProductIsFeatured] = useState(false);
  const [formVariants, setFormVariants] = useState<NewVariantForm[]>([
    {
      name: 'Tiêu chuẩn',
      sku: '',
      price: 65000,
      comparePrice: 85000,
      stockQty: 20,
      weightKg: 0.2,
      status: 'in_stock',
      preorderEta: '',
    },
  ]);

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

  const handleAddVariant = () => {
    setFormVariants((prev) => [
      ...prev,
      {
        name: `Phân loại ${prev.length + 1}`,
        sku: '',
        price: prev[0]?.price || 65000,
        comparePrice: prev[0]?.comparePrice || 85000,
        stockQty: 10,
        weightKg: 0.2,
        status: 'in_stock',
        preorderEta: '',
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (formVariants.length <= 1) {
      alert('Sản phẩm phải có ít nhất 1 phân loại!');
      return;
    }
    setFormVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateVariant = (index: number, field: keyof NewVariantForm, value: any) => {
    setFormVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const handleCloneProduct = (prod: Product) => {
    setNewProductName(`${prod.name} (Bản sao)`);
    setNewProductCategoryId(prod.category_id || '');
    setNewProductDesc(prod.description || '');
    const primaryImg = prod.media?.find((m) => m.is_primary)?.url || prod.media?.[0]?.url || '';
    setNewProductImage(primaryImg);
    setNewProductIsFeatured(prod.is_featured);
    if (prod.variants && prod.variants.length > 0) {
      setFormVariants(
        prod.variants.map((v) => ({
          name: v.name,
          sku: v.sku ? `${v.sku}-COPY` : '',
          price: v.price,
          comparePrice: v.compare_price,
          stockQty: v.stock_qty,
          weightKg: v.weight_kg,
          status: v.status as any,
          preorderEta: v.preorder_eta || '',
        }))
      );
    }
    setShowAddModal(true);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) {
      alert('Vui lòng nhập tên sản phẩm!');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProductName.trim(),
          categoryId: newProductCategoryId || null,
          description: newProductDesc.trim() || undefined,
          imageUrl: newProductImage.trim() || undefined,
          isFeatured: newProductIsFeatured,
          variants: formVariants.map((v) => ({
            name: v.name,
            sku: v.sku || undefined,
            price: Number(v.price),
            comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
            stockQty: Number(v.stockQty),
            weightKg: Number(v.weightKg) || 0.2,
            status: v.status,
            preorderEta: v.status === 'preorder' && v.preorderEta ? v.preorderEta : null,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || 'Không thể tạo sản phẩm');
        return;
      }

      alert('Thêm sản phẩm mới thành công!');
      setShowAddModal(false);
      // Reset form
      setNewProductName('');
      setNewProductDesc('');
      setNewProductImage('');
      setNewProductIsFeatured(false);
      setFormVariants([
        {
          name: 'Tiêu chuẩn',
          sku: '',
          price: 65000,
          comparePrice: 85000,
          stockQty: 20,
          weightKg: 0.2,
          status: 'in_stock',
          preorderEta: '',
        },
      ]);
      // Reload products
      await fetchLiveProducts();
    } catch (err) {
      alert('Lỗi kết nối khi tạo sản phẩm');
    } finally {
      setIsSubmitting(false);
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
        {/* Title & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-title text-2xl md:text-3xl font-extrabold text-[#5A3A3A] flex items-center gap-2">
              <Package className="text-[#F9739B]" size={28} /> Quản lý Sản phẩm & Tồn kho
            </h1>
            <p className="text-xs text-[#7D5C5C]">
              Xem danh sách, kiểm kê kho nhanh (+/−), cập nhật phân loại và thêm sản phẩm mới.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLiveProducts}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-white border border-[#FFE8EF] hover:border-[#F9739B] text-xs font-bold text-[#5A3A3A] transition-all shadow-xs"
              title="Tải lại sản phẩm"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>

            <button
              onClick={() => setShowCsvModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-white border border-[#FFE8EF] hover:border-[#F9739B] text-xs font-bold text-[#5A3A3A] transition-all shadow-xs"
              title="Nhập sản phẩm hàng loạt từ file CSV (FR-A-08)"
            >
              <FileSpreadsheet size={15} className="text-[#E24C7C]" />
              <span>Nhập từ CSV</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#E24C7C] hover:bg-[#F9739B] text-white font-title text-xs font-bold transition-all shadow-md"
            >
              <Plus size={16} />
              <span>Thêm sản phẩm</span>
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
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <h2 className="font-title text-base font-bold text-[#5A3A3A] truncate">
                            {prod.name}
                          </h2>
                          {prod.is_featured && (
                            <span className="text-[10px] font-bold bg-[#FFE8EF] text-[#E24C7C] px-2 py-0.5 rounded-full">
                              Nổi bật
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleCloneProduct(prod)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FFF9F6] border border-[#FFE8EF] hover:border-[#F9739B] hover:text-[#E24C7C] text-[#7D5C5C] text-xs font-bold transition-all shrink-0"
                          title="Nhân bản mẫu sản phẩm này"
                        >
                          <Copy size={13} />
                          <span>Nhân bản</span>
                        </button>
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

      {/* CREATE NEW PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-[#FFE8EF] max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#FFE8EF]">
              <div>
                <h3 className="font-title text-lg font-bold text-[#5A3A3A] flex items-center gap-2">
                  <Plus size={18} className="text-[#E24C7C]" /> Thêm Sản Phẩm Squishy Mới
                </h3>
                <p className="text-xs text-[#7D5C5C]">
                  Điền thông tin sản phẩm, danh mục, giá bán và cấu hình các phân loại (biến thể).
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-full hover:bg-[#FFF9F6] text-[#A39A9A]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              {/* Product Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#5A3A3A]">
                    Tên sản phẩm: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Squishy Mèo Béo Bánh Bao..."
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none bg-[#FFF9F6]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#5A3A3A]">Danh mục:</label>
                  <select
                    value={newProductCategoryId}
                    onChange={(e) => setNewProductCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none bg-[#FFF9F6]"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-[#5A3A3A]">Mô tả sản phẩm:</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả cảm giác bóp mềm mịn, mùi thơm nhẹ bơ sữa, kích thước..."
                  value={newProductDesc}
                  onChange={(e) => setNewProductDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none bg-[#FFF9F6]"
                />
              </div>

              {/* Image URL & Featured */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2 space-y-1">
                  <label className="font-bold text-[#5A3A3A] flex items-center gap-1">
                    <ImageIcon size={14} className="text-[#F9739B]" /> URL Ảnh sản phẩm (link online):
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... hoặc link ảnh"
                    value={newProductImage}
                    onChange={(e) => setNewProductImage(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none bg-[#FFF9F6]"
                  />
                </div>

                <div className="pt-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={newProductIsFeatured}
                    onChange={(e) => setNewProductIsFeatured(e.target.checked)}
                    className="rounded text-[#E24C7C] focus:ring-[#F9739B]"
                  />
                  <label htmlFor="isFeatured" className="font-bold text-[#5A3A3A] cursor-pointer">
                    Sản phẩm Nổi bật ⭐
                  </label>
                </div>
              </div>

              {/* Variants Section */}
              <div className="space-y-3 pt-3 border-t border-[#FFE8EF]">
                <div className="flex items-center justify-between">
                  <span className="font-title text-sm font-bold text-[#5A3A3A]">
                    Các phân loại / Biến thể ({formVariants.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FFE8EF] hover:bg-[#F9739B] hover:text-white text-[#E24C7C] font-bold text-[11px] transition-colors"
                  >
                    <Plus size={13} /> Thêm phân loại
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto p-1">
                  {formVariants.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-[#FFF9F6] border border-[#FFE8EF] space-y-2 relative"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#7D5C5C] text-[11px]">
                          Phân loại #{idx + 1}
                        </span>
                        {formVariants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="p-1 rounded-md text-red-500 hover:bg-red-50"
                            title="Xóa phân loại này"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] text-[#A39A9A] block">Tên phân loại</label>
                          <input
                            type="text"
                            required
                            placeholder="VD: Màu Hồng / Combo 2"
                            value={v.name}
                            onChange={(e) => handleUpdateVariant(idx, 'name', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#FFE8EF] bg-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-[#A39A9A] block">Mã SKU</label>
                          <input
                            type="text"
                            placeholder="Tự động nếu trống"
                            value={v.sku}
                            onChange={(e) => handleUpdateVariant(idx, 'sku', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#FFE8EF] bg-white text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-[#A39A9A] block">Giá bán (VNĐ)</label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="1000"
                            value={v.price}
                            onChange={(e) => handleUpdateVariant(idx, 'price', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#FFE8EF] bg-white text-xs font-bold text-[#E24C7C]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-[#A39A9A] block">Giá gốc (gạch ngang)</label>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={v.comparePrice || ''}
                            onChange={(e) =>
                              handleUpdateVariant(
                                idx,
                                'comparePrice',
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#FFE8EF] bg-white text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                        <div>
                          <label className="text-[10px] text-[#A39A9A] block">Số lượng tồn kho</label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={v.stockQty}
                            onChange={(e) =>
                              handleUpdateVariant(idx, 'stockQty', Number(e.target.value))
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#FFE8EF] bg-white text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-[#A39A9A] block">Cân nặng SPX (kg)</label>
                          <input
                            type="number"
                            required
                            min="0.05"
                            step="0.05"
                            value={v.weightKg}
                            onChange={(e) =>
                              handleUpdateVariant(idx, 'weightKg', Number(e.target.value))
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#FFE8EF] bg-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-[#A39A9A] block">Trạng thái bán</label>
                          <select
                            value={v.status}
                            onChange={(e) =>
                              handleUpdateVariant(idx, 'status', e.target.value as any)
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#FFE8EF] bg-white text-xs font-bold"
                          >
                            <option value="in_stock">Còn hàng có sẵn</option>
                            <option value="preorder">Đặt trước (Pre-order)</option>
                            <option value="out_of_stock">Tạm hết hàng</option>
                          </select>
                        </div>

                        {v.status === 'preorder' && (
                          <div>
                            <label className="text-[10px] text-[#A39A9A] block">Dự kiến về hàng (ETA)</label>
                            <input
                              type="text"
                              placeholder="VD: 05/11/2026"
                              value={v.preorderEta}
                              onChange={(e) =>
                                handleUpdateVariant(idx, 'preorderEta', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-xs"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#FFE8EF]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#7D5C5C] hover:bg-[#FFE8EF]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#E24C7C] hover:bg-[#F9739B] text-white font-title text-xs font-bold shadow-md transition-colors disabled:bg-gray-400"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu sản phẩm vào Supabase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal (FR-A-08) */}
      <CsvProductImportModal
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        categories={categories}
        onSuccess={fetchLiveProducts}
      />
    </div>
  );
}
