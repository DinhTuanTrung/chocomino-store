import React from 'react';
import { HomeClient } from './HomeClient';
import { getProducts, getCategories } from '@/lib/supabase/products';

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return <HomeClient initialProducts={products} initialCategories={categories} />;
}
