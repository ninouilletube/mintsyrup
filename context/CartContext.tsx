'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Product } from '@/data/products';

const CART_KEY = 'ms_cart';
const SESSION_KEY = 'ms_session_id';
const RESERVE_DURATION = 15 * 60 * 1000; // 15 min

export type CartItem = {
  productId: number;
  addedAt: number; // timestamp — expiry = addedAt + RESERVE_DURATION
};

type CartContextType = {
  items: CartItem[];
  sessionId: string;
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  isInCart: (productId: number) => boolean;
  count: number;
  expiresAt: number | null;
  lastAddedAt: number | null;
  hoverPreviewAt: number | null;
  hoverPreviewEndAt: number | null;
  triggerHoverPreview: () => void;
  endHoverPreview: () => void;
};

const CartContext = createContext<CartContextType>({
  items: [],
  sessionId: '',
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  isInCart: () => false,
  count: 0,
  expiresAt: null,
  lastAddedAt: null,
  hoverPreviewAt: null,
  hoverPreviewEndAt: null,
  triggerHoverPreview: () => {},
  endHoverPreview: () => {},
});

function getOrCreateSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    // Purge expired items
    const now = Date.now();
    return parsed.filter(i => now - i.addedAt < RESERVE_DURATION);
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch {}
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [lastAddedAt, setLastAddedAt] = useState<number | null>(null);
  const [hoverPreviewAt, setHoverPreviewAt] = useState<number | null>(null);
  const [hoverPreviewEndAt, setHoverPreviewEndAt] = useState<number | null>(null);
  const triggerHoverPreview = useCallback(() => setHoverPreviewAt(Date.now()), []);
  const endHoverPreview = useCallback(() => setHoverPreviewEndAt(Date.now()), []);

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
    setItems(loadCart());
  }, []);

  // Purge expired items every 30s
  useEffect(() => {
    const id = setInterval(() => {
      setItems(prev => {
        const now = Date.now();
        const next = prev.filter(i => now - i.addedAt < RESERVE_DURATION);
        if (next.length !== prev.length) saveCart(next);
        return next;
      });
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  const addItem = useCallback((product: Product) => {
    setItems(prev => {
      if (prev.some(i => i.productId === product.id)) return prev;
      const now = Date.now();
      // Reset all addedAt so the 15-min timer restarts from now
      const next = [...prev.map(i => ({ ...i, addedAt: now })), { productId: product.id, addedAt: now }];
      saveCart(next);
      return next;
    });
    setLastAddedAt(Date.now());
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems(prev => {
      const next = prev.filter(i => i.productId !== productId);
      saveCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    saveCart([]);
  }, []);

  const isInCart = useCallback((productId: number) => items.some(i => i.productId === productId), [items]);

  const expiresAt = items.length > 0 ? Math.min(...items.map(i => i.addedAt + RESERVE_DURATION)) : null;

  return (
    <CartContext.Provider value={{ items, sessionId, addItem, removeItem, clearCart, isInCart, count: items.length, expiresAt, lastAddedAt, hoverPreviewAt, hoverPreviewEndAt, triggerHoverPreview, endHoverPreview }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
export { RESERVE_DURATION };
