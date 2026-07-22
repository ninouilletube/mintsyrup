import { NextResponse } from 'next/server';
import { getData, setData } from '@/lib/supabase';
import type { Product } from '@/data/products';

export async function POST(req: Request) {
  const { productId, sessionId } = await req.json() as { productId: number; sessionId: string };
  if (!productId || !sessionId) return NextResponse.json({ ok: true });

  const saved = await getData('products');
  const all: Product[] = Array.isArray(saved) ? saved : (saved as { products?: Product[] })?.products ?? [];

  const product = all.find(p => p.id === productId);
  if (!product || product.reservedSession !== sessionId) return NextResponse.json({ ok: true });

  const now = Date.now();
  const updated = all.map(p =>
    p.id === productId ? { ...p, reservedAt: undefined, reservedSession: undefined } : p
  );
  await setData('products', { products: updated, savedAt: now });

  return NextResponse.json({ ok: true });
}
