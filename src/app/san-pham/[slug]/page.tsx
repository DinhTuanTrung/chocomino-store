import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductDetailClient } from './ProductDetailClient';
import { MOCK_PRODUCTS } from '@/data/mock_products';

export async function generateStaticParams() {
  return MOCK_PRODUCTS.map((product) => ({
    slug: product.slug,
  }));
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = MOCK_PRODUCTS.find((p) => p.slug === slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F6]">
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
