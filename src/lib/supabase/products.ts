import { createClient } from './client';
import { Product, Category } from '@/types/database';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '@/data/mock_products';

export async function getProducts(): Promise<Product[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        variants:product_variants(*),
        media:product_media(*)
      `)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as Product[];
    }
  } catch (e) {
    console.warn('[Supabase] Không thể lấy danh sách sản phẩm, chuyển sang dữ liệu mẫu:', e);
  }
  return MOCK_PRODUCTS;
}

export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      return data as Category[];
    }
  } catch (e) {
    console.warn('[Supabase] Không thể lấy danh mục, chuyển sang dữ liệu mẫu:', e);
  }
  return MOCK_CATEGORIES as any[];
}
