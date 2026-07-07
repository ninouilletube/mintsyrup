import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getData } from '@/lib/supabase';
import type { Product } from '@/data/products';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type CartItemPayload = { id: number; title: string; price: number; image: string | null };
type DeliveryAddress = { fullName: string; address: string; city: string; postalCode: string; country: string };

export async function POST(req: Request) {
  const { items, shipping, country, carrier, relayPoint, deliveryAddress } = await req.json() as {
    items: CartItemPayload[];
    shipping: { label: string; price: number };
    country: string;
    carrier: string;
    relayPoint: string | null;
    deliveryAddress: DeliveryAddress;
  };

  if (!items?.length) return NextResponse.json({ error: 'Panier vide' }, { status: 400 });

  // Vérifier que les articles sont toujours disponibles
  const saved = await getData('products');
  const products: Product[] = Array.isArray(saved)
    ? saved
    : (saved as { products?: Product[] })?.products ?? [];

  for (const item of items) {
    const p = products.find(p => p.id === item.id);
    if (!p) return NextResponse.json({ error: `Article introuvable : ${item.title}` }, { status: 400 });
    if (p.sold) return NextResponse.json({ error: `"${item.title}" a déjà été vendu. Retire-le de ton panier.` }, { status: 409 });
  }

  const origin = req.headers.get('origin') ?? 'http://localhost:3000';

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    ...items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.title,
          ...(item.image ? { images: [item.image] } : {}),
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: 1,
    })),
    {
      price_data: {
        currency: 'eur',
        product_data: { name: `Livraison — ${shipping.label}` },
        unit_amount: Math.round(shipping.price * 100),
      },
      quantity: 1,
    },
  ];

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${origin}/paiement-confirme?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/panier`,
    // Adresse collectée dans notre panier — pas besoin de la recollecte Stripe
    metadata: {
      product_ids: items.map(i => i.id).join(','),
      country,
      carrier: carrier ?? 'ups',
      relay_point: relayPoint ?? '',
      delivery_name: deliveryAddress?.fullName ?? '',
      delivery_address: deliveryAddress?.address ?? '',
      delivery_city: deliveryAddress?.city ?? '',
      delivery_postal: deliveryAddress?.postalCode ?? '',
    },
    locale: 'fr',
  });

  return NextResponse.json({ url: session.url });
}
