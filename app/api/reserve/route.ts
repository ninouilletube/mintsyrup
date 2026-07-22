import { NextResponse } from 'next/server';
import { getData, setData } from '@/lib/supabase';
import type { Product } from '@/data/products';

const RESERVE_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  const { productId, sessionId } = await req.json() as { productId: number; sessionId: string };
  if (!productId || !sessionId) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });

  const saved = await getData('products');
  const all: Product[] = Array.isArray(saved) ? saved : (saved as { products?: Product[] })?.products ?? [];

  const product = all.find(p => p.id === productId);
  if (!product) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });
  if (product.sold) return NextResponse.json({ error: 'Cet article a déjà été vendu' }, { status: 409 });

  const now = Date.now();

  // Déjà réservé par quelqu'un d'autre et pas expiré
  if (product.reservedSession && product.reservedSession !== sessionId && product.reservedAt) {
    if (now - product.reservedAt < RESERVE_MS) {
      return NextResponse.json({ error: 'Cet article est déjà réservé par quelqu\'un d\'autre' }, { status: 409 });
    }
  }

  const updated = all.map(p =>
    p.id === productId ? { ...p, reservedAt: now, reservedSession: sessionId } : p
  );
  await setData('products', { products: updated, savedAt: now });

  return NextResponse.json({ ok: true });
}
