import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductDetailClient } from './ProductDetailClient';
import { getProducts } from '@/lib/supabase/products';

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const products = await getProducts();
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    return {
      title: 'Không tìm thấy sản phẩm | chocomino',
      description: 'Món đồ chơi squishy bạn đang tìm không tồn tại hoặc đã ngừng bán.',
    };
  }

  const prices = product.variants?.map((v) => v.price) || [];
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const priceText = minPrice > 0 ? `Chỉ từ ${minPrice.toLocaleString('vi-VN')}đ` : '';
  const desc = product.description
    ? `${product.description.slice(0, 150)}... ${priceText}. Squishy chậm tăng siêu mềm mịn tại chocomino!`
    : `Mua ${product.name} mềm mịn, chậm tăng chuẩn xịn. ${priceText}. Giao hàng hỏa tốc toàn quốc SPX Express!`;

  const primaryImage = product.media?.[0]?.url || 'https://chocomino-store.vercel.app/icon.svg';
  const pageUrl = `https://chocomino-store.vercel.app/san-pham/${product.slug}`;

  return {
    title: `${product.name} | chocomino squishy shop`,
    description: desc,
    openGraph: {
      title: `${product.name} — ${priceText} | chocomino`,
      description: desc,
      url: pageUrl,
      siteName: 'chocomino squishy shop',
      images: [
        {
          url: primaryImage,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
      type: 'website',
      locale: 'vi_VN',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | chocomino`,
      description: desc,
      images: [primaryImage],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const products = await getProducts();
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    notFound();
  }

  // Schema.org JSON-LD for Google Rich Snippets
  const prices = product.variants?.map((v) => v.price) || [];
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : minPrice;
  const inStock = product.variants?.some((v) => v.status === 'in_stock' && v.stock_qty > 0);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.media?.map((m) => m.url) || [],
    description: product.description || product.name,
    sku: product.variants?.[0]?.sku || `CM-${product.id.slice(0, 6)}`,
    brand: {
      '@type': 'Brand',
      name: 'chocomino',
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'VND',
      lowPrice: minPrice,
      highPrice: maxPrice,
      offerCount: product.variants?.length || 1,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'chocomino shop',
      },
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F6]">
      {/* Google Structured Data JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div className="text-center py-20 text-xs">Đang tải chi tiết món squishy...</div>}>
          <ProductDetailClient product={product} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
