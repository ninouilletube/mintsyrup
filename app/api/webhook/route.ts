import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getData, setData, supabase } from '@/lib/supabase';
import type { Product } from '@/data/products';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function createSendcloudParcel(
  session: Stripe.Checkout.Session,
  soldProducts: Product[],
) {
  const pub = process.env.SENDCLOUD_PUBLIC_KEY;
  const sec = process.env.SENDCLOUD_SECRET_KEY;
  if (!pub || !sec) return; // pas encore configuré

  const shipping = session.collected_information?.shipping_details;
  if (!shipping?.address) return;

  const addr = shipping.address;
  const totalWeight = Math.max(0.5, soldProducts.length * 0.5).toFixed(2);
  const methodId = parseInt(process.env.SENDCLOUD_SHIPPING_METHOD_ID ?? '8', 10);

  const body = {
    parcel: {
      name: shipping.name ?? (session.customer_details?.name ?? 'Client'),
      address: [addr.line1, addr.line2].filter(Boolean).join(', '),
      city: addr.city ?? '',
      postal_code: addr.postal_code ?? '',
      country: addr.country ?? 'FR',
      email: session.customer_details?.email ?? '',
      order_number: session.id,
      weight: totalWeight,
      parcel_items: soldProducts.map((p) => ({
        description: p.title.fr,
        quantity: 1,
        weight: '0.50',
        value: String(p.price.toFixed(2)),
        sku: String(p.id),
      })),
      shipment: { id: methodId },
      // false = crée le colis dans le dashboard sans acheter le timbre tout de suite
      // passe à true quand tu veux que le bordereau soit généré + facturé automatiquement
      request_label: false,
    },
  };

  const credentials = Buffer.from(`${pub}:${sec}`).toString('base64');

  const resp = await fetch('https://panel.sendcloud.sc/api/v2/parcels', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    console.error('[Sendcloud] Erreur création colis:', await resp.text());
  } else {
    const data = await resp.json() as { parcel?: { id: number; tracking_number?: string } };
    console.log('[Sendcloud] Colis créé:', data.parcel?.id, data.parcel?.tracking_number ?? '');
  }
}

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
    // Récupère la session complète avec l'adresse de livraison
    const raw = event.data.object as Stripe.Checkout.Session;
    const session = await stripe.checkout.sessions.retrieve(raw.id);

    const productIds = (session.metadata?.product_ids ?? '')
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter(Boolean);

    if (productIds.length > 0) {
      const saved = await getData('products');
      const allProducts: Product[] = Array.isArray(saved)
        ? saved
        : (saved as { products?: Product[] })?.products ?? [];

      const soldAt = Date.now();
      const soldProducts = allProducts.filter((p) => productIds.includes(p.id));

      const updated = allProducts.map((p) =>
        productIds.includes(p.id)
          ? { ...p, sold: true, soldAt, soldPrice: p.price, hidden: true, reservedAt: undefined, reservedSession: undefined }
          : p,
      );

      await setData('products', { products: updated, savedAt: soldAt });

      // Marquer le code promo comme utilisé
      const promoCode = session.metadata?.promo_code;
      if (promoCode) {
        await supabase
          .from('promo_codes')
          .update({ used: true, used_at: new Date().toISOString() })
          .eq('code', promoCode);
      }

      // Création du colis Sendcloud (ne bloque pas si Sendcloud échoue)
      await createSendcloudParcel(session, soldProducts).catch((err) =>
        console.error('[Sendcloud] Exception:', err),
      );
    }
  }

  return NextResponse.json({ received: true });
}
