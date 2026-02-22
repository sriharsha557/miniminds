import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Bundle } from '../types/bundle';

interface CartItem {
  bundleId: string;
  name: string;
  price: number;
  coverImageUrl: string;
  worksheetCount: number;
  ageRange: string;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (bundle: Bundle) => void;
  removeItem: (bundleId: string) => void;
  clearCart: () => void;
  hasItem: (bundleId: string) => boolean;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (bundle: Bundle) => {
    const bundlePrice = bundle.price;
    if (bundle.isFree || typeof bundlePrice !== 'number') {
      return;
    }

    setItems((currentItems) => {
      const alreadyAdded = currentItems.some((item) => item.bundleId === bundle.id);
      if (alreadyAdded) {
        return currentItems;
      }

      return [
        ...currentItems,
        {
          bundleId: bundle.id,
          name: bundle.name,
          price: bundlePrice,
          coverImageUrl: bundle.coverImageUrl,
          worksheetCount: bundle.worksheetCount,
          ageRange: bundle.ageRange,
        },
      ];
    });
  };

  const removeItem = (bundleId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.bundleId !== bundleId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const hasItem = (bundleId: string) => items.some((item) => item.bundleId === bundleId);

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const value: CartContextValue = {
    items,
    itemCount: items.length,
    subtotal,
    addItem,
    removeItem,
    clearCart,
    hasItem,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export type { CartItem, CartContextValue };
