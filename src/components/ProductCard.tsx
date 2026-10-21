'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Clock, AlertCircle } from 'lucide-react';
import type { Product } from '@/types/database';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.media?.find((m) => m.is_primary)?.url || product.media?.[0]?.url || '/placeholder.png';
  const variants = product.variants || [];
  
  // Calculate lowest price and compare price
  const prices = variants.map((v) => v.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const comparePrice = variants[0]?.compare_price;

  // Determine overall status
  const isPreorder = variants.some((v) => v.status === 'preorder');
  const isAllOutOfStock = variants.every((v) => v.status === 'out_of_stock' || (v.stock_qty <= 0 && v.status !== 'preorder'));
  const preorderEta = variants.find((v) => v.status === 'preorder')?.preorder_eta;

  return (
    <Link
      href={`/san-pham/${product.slug}`}
      className="group flex flex-col bg-white rounded-3xl p-3 border border-[#FFE8EF] hover:border-[#F9739B]/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
    >
      {/* Badges */}
      <div className="absolute top-5 left-5 z-10 flex flex-col gap-1.5 items-start">
        {isPreorder && (
          <span className="inline-flex items-center gap-1 bg-[#FFD76A] text-[#5A3A3A] text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            <Clock size={12} />
            Pre-order
          </span>
        )}
        {isAllOutOfStock && (
          <span className="inline-flex items-center gap-1 bg-[#A39A9A] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            <AlertCircle size={12} />
            Hết hàng
          </span>
        )}
        {product.is_featured && !isPreorder && !isAllOutOfStock && (
          <span className="inline-flex items-center gap-1 bg-[#F9739B] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            <Sparkles size={12} />
            Hot
          </span>
        )}
      </div>

      {/* Image Thumbnail (Square aspect ratio) */}
      <div className="w-full aspect-square rounded-2xl overflow-hidden bg-[#FFF9F6] relative mb-3">
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Product Details */}
      <div className="flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-sans font-bold text-sm line-clamp-2 text-[#5A3A3A] group-hover:text-[#F9739B] transition-colors mb-1.5">
            {product.name}
          </h3>
          {isPreorder && preorderEta && (
            <p className="text-[11px] text-[#A39A9A] mb-1">
              Dự kiến về: {new Date(preorderEta).toLocaleDateString('vi-VN')}
            </p>
          )}
        </div>

        <div className="pt-2 flex items-baseline gap-2">
          <span className="font-title font-bold text-base md:text-lg text-[#E24C7C]">
            {minPrice !== maxPrice ? `từ ${minPrice.toLocaleString('vi-VN')}đ` : `${minPrice.toLocaleString('vi-VN')}đ`}
          </span>
          {comparePrice && comparePrice > minPrice && (
            <span className="text-xs text-[#A39A9A] line-through">
              {comparePrice.toLocaleString('vi-VN')}đ
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
