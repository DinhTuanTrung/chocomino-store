'use client';

import React, { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import type { Product, Category } from '@/types/database';
import { Search, Sparkles, Heart, PackageCheck } from 'lucide-react';

interface HomeClientProps {
  initialProducts: Product[];
  initialCategories: Category[];
}

export function HomeClient({ initialProducts, initialCategories }: HomeClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'in_stock' | 'preorder'>('all');

  // Categories list with "All" prefixed
  const categoriesList = useMemo(() => {
    return [
      { id: 'all', name: 'Tất cả sản phẩm', slug: 'all', sort_order: 0, is_active: true, created_at: '', updated_at: '' },
      ...initialCategories,
    ];
  }, [initialCategories]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((prod) => {
      // 1. Category filter
      if (selectedCategory !== 'all') {
        const cat = initialCategories.find((c) => c.slug === selectedCategory);
        if (cat && prod.category_id !== cat.id) return false;
      }

      // 2. Status filter
      if (filterType === 'preorder') {
        const hasPreorder = prod.variants?.some((v) => v.status === 'preorder');
        if (!hasPreorder) return false;
      } else if (filterType === 'in_stock') {
        const hasInStock = prod.variants?.some((v) => v.status === 'in_stock' && v.stock_qty > 0);
        if (!hasInStock) return false;
      }

      // 3. Search query (accent insensitive)
      if (searchQuery.trim()) {
        const normalize = (str: string) =>
          str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
        const normName = normalize(prod.name);
        const normQuery = normalize(searchQuery.trim());
        if (!normName.includes(normQuery)) return false;
      }

      return true;
    });
  }, [initialProducts, initialCategories, selectedCategory, filterType, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F6]">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 space-y-8">
        {/* Cute Hero Banner */}
        <section className="relative rounded-3xl bg-gradient-to-r from-[#FFE8EF] via-[#FFF0F4] to-[#FFE8EF] p-6 md:p-8 border border-[#F9739B]/20 shadow-sm overflow-hidden">
          <div className="relative z-10 max-w-md space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 text-[#E24C7C] text-xs font-bold shadow-xs">
              <Sparkles size={13} />
              <span>Tiệm Squishy Dễ Thương</span>
            </div>
            <h1 className="font-title text-3xl md:text-4xl font-extrabold text-[#5A3A3A] tracking-tight leading-tight">
              Bóp là mê, chậm tăng cực phê! ✨
            </h1>
            <p className="text-sm text-[#7D5C5C] leading-relaxed">
              Mềm mịn, thơm ngọt, giúp bạn thư giãn và xả stress sau giờ học và làm việc căng thẳng.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <a
                href="#products"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#F9739B] text-white font-bold text-sm shadow-md hover:bg-[#E24C7C] transition-all transform hover:-translate-y-0.5"
              >
                Khám phá ngay
              </a>
              <span className="text-xs font-semibold text-[#7D5C5C] flex items-center gap-1">
                <Heart size={14} className="text-[#F9739B] fill-[#F9739B]" /> Hơn 100+ mẫu xinh
              </span>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-44 h-44 rounded-full bg-[#F9739B]/10 blur-xl pointer-events-none" />
        </section>

        {/* Search Bar */}
        <section className="relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm squishy bánh mì, mèo ú, dâu tây..."
              className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-[#FFE8EF] focus:border-[#F9739B] focus:outline-none focus:ring-2 focus:ring-[#F9739B]/20 text-sm text-[#5A3A3A] shadow-xs"
            />
            <Search size={18} className="absolute left-4 text-[#A39A9A]" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 text-xs font-bold text-[#A39A9A] hover:text-[#5A3A3A]"
              >
                Xóa
              </button>
            )}
          </div>
        </section>

        {/* Categories Bar (Round chips, horizontal scroll) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-title text-xl font-bold text-[#5A3A3A]">Danh mục món xinh</h2>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categoriesList.map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
                    isSelected
                      ? 'bg-[#F9739B] text-white shadow-sm'
                      : 'bg-white text-[#5A3A3A] border border-[#FFE8EF] hover:border-[#F9739B]/40'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* Filter Quick Tabs (All, In Stock, Preorder) */}
        <section className="flex items-center justify-between border-b border-[#FFE8EF] pb-3" id="products">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                filterType === 'all'
                  ? 'bg-[#5A3A3A] text-white'
                  : 'text-[#7D5C5C] hover:bg-[#FFE8EF]'
              }`}
            >
              Tất cả ({initialProducts.length})
            </button>
            <button
              onClick={() => setFilterType('in_stock')}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 ${
                filterType === 'in_stock'
                  ? 'bg-[#5A3A3A] text-white'
                  : 'text-[#7D5C5C] hover:bg-[#FFE8EF]'
              }`}
            >
              <PackageCheck size={13} />
              Sẵn hàng
            </button>
            <button
              onClick={() => setFilterType('preorder')}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 ${
                filterType === 'preorder'
                  ? 'bg-[#FFD76A] text-[#5A3A3A]'
                  : 'text-[#7D5C5C] hover:bg-[#FFE8EF]'
              }`}
            >
              <Sparkles size={13} />
              Pre-order
            </button>
          </div>
          <span className="text-xs text-[#A39A9A]">
            {filteredProducts.length} sản phẩm
          </span>
        </section>

        {/* Product Grid (2 columns on mobile, 3 columns on tablet/desktop) */}
        <section>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#FFE8EF] p-8 space-y-3">
              <p className="font-title text-lg font-bold text-[#5A3A3A]">
                Không tìm thấy món squishy nào phù hợp! 🍰
              </p>
              <p className="text-xs text-[#7D5C5C]">
                Bạn thử tìm từ khóa khác hoặc bấm xem lại tất cả danh mục nhé.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setFilterType('all');
                  setSearchQuery('');
                }}
                className="mt-2 inline-flex items-center px-4 py-2 rounded-full bg-[#FFE8EF] text-[#E24C7C] font-bold text-xs hover:bg-[#F9739B] hover:text-white transition-colors"
              >
                Xem tất cả sản phẩm
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
