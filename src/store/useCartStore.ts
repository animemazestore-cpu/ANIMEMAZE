import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '../types/database';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, selectedVariant?: string) => void;
  removeItem: (productId: string, selectedVariant?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedVariant?: string) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1, selectedVariant) => {
        const currentItems = get().items;
        const existingItemIndex = currentItems.findIndex(
          item => item.product.id === product.id && item.selectedVariant === selectedVariant
        );

        if (existingItemIndex > -1) {
          const newItems = [...currentItems];
          const newQuantity = newItems[existingItemIndex].quantity + quantity;
          // Check stock limit
          newItems[existingItemIndex].quantity = Math.min(newQuantity, product.stock);
          set({ items: newItems });
        } else {
          // Add new item, respect stock
          const initialQuantity = Math.min(quantity, product.stock);
          if (initialQuantity > 0) {
            set({ items: [...currentItems, { product, quantity: initialQuantity, selectedVariant }] });
          }
        }
      },

      removeItem: (productId, selectedVariant) => {
        set({
          items: get().items.filter(
            item => !(item.product.id === productId && item.selectedVariant === selectedVariant)
          )
        });
      },

      updateQuantity: (productId, quantity, selectedVariant) => {
        const currentItems = get().items;
        const itemIndex = currentItems.findIndex(
          item => item.product.id === productId && item.selectedVariant === selectedVariant
        );

        if (itemIndex > -1) {
          const newItems = [...currentItems];
          const stock = newItems[itemIndex].product.stock;
          newItems[itemIndex].quantity = Math.max(1, Math.min(quantity, stock));
          set({ items: newItems });
        }
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalAmount: () => {
        return get().items.reduce((total, item) => total + item.product.price * item.quantity, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      }
    }),
    {
      name: 'animemaze-cart', // Unique key for local storage
    }
  )
);
