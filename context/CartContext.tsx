'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Product } from '@/data/products';

const CART_KEY = 'ms_cart';
const SESSION_KEY = 'ms_session_id';
const RESERVE_DURATION = 15 * 60 * 1000; // 15 min

export type CartItem = {
  productId: number;
  addedAt: number;
};

type CartContextType = {
  items: CartItem[];
  sessionId: string;
  addItem: (product: Product) => Promise<{ ok: boolean; error?: string }>;
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
  addItem: async () => ({ ok: false }),
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
  const sessionIdRef = useRef('');
  const [lastAddedAt, setLastAddedAt] = useState<number | null>(null);
  const [hoverPreviewAt, setHoverPreviewAt] = useState<number | null>(null);
  const [hoverPreviewEndAt, setHoverPreviewEndAt] = useState<number | null>(null);
  const triggerHoverPreview = useCallback(() => setHoverPreviewAt(Date.now()), []);
  const endHoverPreview = useCallback(() => setHoverPreviewEndAt(Date.now()), []);

  useEffect(() => {
    const sid = getOrCreateSessionId();
    setSessionId(sid);
    sessionIdRef.current = sid;
    setItems(loadCart());
  }, []);

  // Purge expired items toutes les 30s + libération serveur
  useEffect(() => {
    const id = setInterval(() => {
      setItems(prev => {
        const now = Date.now();
        const expired = prev.filter(i => now - i.addedAt >= RESERVE_DURATION);
        const next = prev.filter(i => now - i.addedAt < RESERVE_DURATION);
        if (expired.length > 0) {
          saveCart(next);
          const sid = sessionIdRef.current;
          expired.forEach(i => {
            fetch('/api/release', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productId: i.productId, sessionId: sid }),
            }).catch(() => {});
          });
        }
        return next;
      });
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  const addItem = useCallback(async (product: Product): Promise<{ ok: boolean; error?: string }> => {
    const sid = sessionIdRef.current;
    if (!sid) return { ok: false, error: 'Session non initialisée' };

    // Réservation côté serveur
    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, sessionId: sid }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) return { ok: false, error: data.error ?? 'Impossible de réserver cet article' };
    } catch {
      return { ok: false, error: 'Erreur réseau' };
    }

    // Ajout local seulement si la réservation a réussi
    setItems(prev => {
      if (prev.some(i => i.productId === product.id)) return prev;
      const now = Date.now();
      const next = [...prev.map(i => ({ ...i, addedAt: now })), { productId: product.id, addedAt: now }];
      saveCart(next);
      return next;
    });
    setLastAddedAt(Date.now());
    return { ok: true };
  }, []);

  const removeItem = useCallback((productId: number) => {
    const sid = sessionIdRef.current;
    setItems(prev => {
      const next = prev.filter(i => i.productId !== productId);
      saveCart(next);
      return next;
    });
    if (sid) {
      fetch('/api/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, sessionId: sid }),
      }).catch(() => {});
    }
  }, []);

  const clearCart = useCallback(() => {
    const sid = sessionIdRef.current;
    setItems(prev => {
      if (sid) {
        prev.forEach(i => {
          fetch('/api/release', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: i.productId, sessionId: sid }),
          }).catch(() => {});
        });
      }
      return [];
    });
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
