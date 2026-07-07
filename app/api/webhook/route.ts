import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getData, setData } from '@/lib/supabase';
import type { Product } from '@/data/products';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const productIds = (session.metadata?.product_ids ?? '')
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(Boolean);

    if (productIds.length > 0) {
      const saved = await getData('products');
      const allProducts: Product[] = Array.isArray(saved)
        ? saved
        : (saved as { products?: Product[] })?.products ?? [];

      const soldAt = Date.now();
      const soldPrice = session.amount_total ? session.amount_total / 100 : undefined;

      const updated = allProducts.map(p =>
        productIds.includes(p.id)
          ? { ...p, sold: true, soldAt, soldPrice: p.price, hidden: true, reservedAt: undefined, reservedSession: undefined }
          : p
      );

      await setData('products', { products: updated, savedAt: soldAt });
    }
  }

  return NextResponse.json({ received: true });
}
