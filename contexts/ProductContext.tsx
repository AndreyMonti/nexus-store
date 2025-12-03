import React, { createContext, useState, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { retrySupabaseQuery, parseSupabaseError } from '../services/retryUtils';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  image_url?: string;
  category_id?: string;
  seller_id: string;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
}

interface ProductContextType {
  products: Product[];
  categories: Category[];
  loading: boolean;
  fetchCategories: () => Promise<void>;
  fetchProducts: (filters?: { sellerId?: string; categoryId?: string }) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'created_at'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

export const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não está configurado. Verifique suas variáveis de ambiente.');
    }

    const { data, error } = await retrySupabaseQuery(
      () => supabase.from('categories').select('*')
    );

    if (error || !data) {
      throw new Error(parseSupabaseError(error));
    }

    setCategories(data);
  };

  const fetchProducts = async (filters?: { sellerId?: string; categoryId?: string }) => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase não está configurado. Verifique suas variáveis de ambiente.');
      }

      let query = supabase.from('products').select('*');
      if (filters?.sellerId) query = query.eq('seller_id', filters.sellerId);
      if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);

      const { data, error } = await retrySupabaseQuery(() => query);

      if (error || !data) {
        throw new Error(parseSupabaseError(error));
      }

      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (product: Omit<Product, 'id' | 'created_at'>) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não está configurado. Verifique suas variáveis de ambiente.');
    }

    const { data, error } = await retrySupabaseQuery(
      () => supabase
        .from('products')
        .insert([product])
        .select()
        .single()
    );

    if (error || !data) {
      throw new Error(parseSupabaseError(error));
    }

    setProducts([...products, data]);
    return data;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não está configurado. Verifique suas variáveis de ambiente.');
    }

    const { error } = await retrySupabaseQuery(
      () => supabase.from('products').update(updates).eq('id', id)
    );

    if (error) {
      throw new Error(parseSupabaseError(error));
    }

    setProducts(products.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProduct = async (id: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não está configurado. Verifique suas variáveis de ambiente.');
    }

    const { error } = await retrySupabaseQuery(
      () => supabase.from('products').delete().eq('id', id)
    );

    if (error) {
      throw new Error(parseSupabaseError(error));
    }

    setProducts(products.filter(p => p.id !== id));
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        categories,
        loading,
        fetchCategories,
        fetchProducts,
        addProduct,
        updateProduct,
        deleteProduct,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}
