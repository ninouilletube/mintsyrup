'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { useCart, RESERVE_DURATION } from '@/context/CartContext';
import { useProducts } from '@/context/ProductsContext';
import styles from './panier.module.css';

// ── Tarifs de livraison (depuis Lisbonne) ──────────────────────────────────
const SHIPPING_ZONES: { label: string; countries: string[]; options: { label: string; price: number }[] }[] = [
  {
    label: 'Portugal',
    countries: ['PT'],
    options: [
      { label: 'CTT Expresso — domicile (2–3 j)', price: 4 },
      { label: 'CTT — point retrait (2–3 j)', price: 3 },
    ],
  },
  {
    label: 'France',
    countries: ['FR'],
    options: [
      { label: 'Colissimo — domicile (3–5 j)', price: 7 },
      { label: 'Colissimo — point relais (3–5 j)', price: 6 },
      { label: 'Mondial Relay — point relais (4–6 j)', price: 5 },
    ],
  },
  {
    label: 'Belgique / Luxembourg',
    countries: ['BE', 'LU'],
    options: [
      { label: 'Colissimo — domicile (3–5 j)', price: 9 },
      { label: 'Mondial Relay — point relais (4–6 j)', price: 7 },
    ],
  },
  {
    label: 'UE (autres pays)',
    countries: ['DE', 'ES', 'IT', 'NL', 'AT', 'PL', 'SE', 'FI', 'DK', 'IE', 'CZ', 'SK', 'HU', 'RO', 'BG', 'HR', 'SI', 'EE', 'LV', 'LT', 'CY', 'MT', 'GR'],
    options: [
      { label: 'Colissimo International — domicile (5–8 j)', price: 13 },
    ],
  },
  {
    label: 'Suisse',
    countries: ['CH'],
    options: [
      { label: 'Colissimo International — domicile (5–8 j) + douane', price: 17 },
    ],
  },
  {
    label: 'Reste du monde',
    countries: [],
    options: [
      { label: 'DPD / La Poste International (7–14 j)', price: 23 },
    ],
  },
];

const COUNTRY_OPTIONS = [
  { code: 'PT', label: 'Portugal' },
  { code: 'FR', label: 'France' },
  { code: 'BE', label: 'Belgique' },
  { code: 'LU', label: 'Luxembourg' },
  { code: 'DE', label: 'Allemagne' },
  { code: 'ES', label: 'Espagne' },
  { code: 'IT', label: 'Italie' },
  { code: 'NL', label: 'Pays-Bas' },
  { code: 'AT', label: 'Autriche' },
  { code: 'CH', label: 'Suisse' },
  { code: 'SE', label: 'Suède' },
  { code: 'DK', label: 'Danemark' },
  { code: 'FI', label: 'Finlande' },
  { code: 'PL', label: 'Pologne' },
  { code: 'IE', label: 'Irlande' },
  { code: 'GR', label: 'Grèce' },
  { code: 'CZ', label: 'Tchéquie' },
  { code: 'HU', label: 'Hongrie' },
  { code: 'RO', label: 'Roumanie' },
  { code: 'HR', label: 'Croatie' },
  { code: 'OTHER', label: 'Autre pays' },
];

function getZone(countryCode: string) {
  return SHIPPING_ZONES.find(z => z.countries.includes(countryCode)) ?? SHIPPING_ZONES[SHIPPING_ZONES.length - 1];
}

function formatTimer(ms: number) {
  if (ms <= 0) return '00:00';
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function PanierPage() {
  const { items, removeItem, clearCart, expiresAt } = useCart();
  const { products } = useProducts();
  const [timeLeft, setTimeLeft] = useState(0);
  const [country, setCountry] = useState('FR');
  const [shippingIdx, setShippingIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cartProducts = items
    .map(item => ({ item, product: products.find(p => p.id === item.productId) }))
    .filter((x): x is { item: typeof items[0]; product: NonNullable<typeof products[0]> } => !!x.product);

  const subtotal = cartProducts.reduce((s, { product }) => s + product.price, 0);
  const zone = getZone(country);
  const shippingOption = zone.options[Math.min(shippingIdx, zone.options.length - 1)];
  const shippingCost = shippingOption.price;
  const total = subtotal + shippingCost;

  // Reset shipping idx when zone changes
  useEffect(() => { setShippingIdx(0); }, [country]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) { setTimeLeft(0); return; }
    const tick = () => setTimeLeft(Math.max(0, expiresAt - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const handleCheckout = async () => {
    if (cartProducts.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartProducts.map(({ product }) => ({
            id: product.id,
            title: product.title.fr,
            price: product.price,
            image: product.image,
          })),
          shipping: { label: shippingOption.label, price: shippingCost },
          country,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur lors du paiement'); setLoading(false); return; }
      window.location.href = data.url;
    } catch {
      setError('Erreur réseau, réessaie.');
      setLoading(false);
    }
  };

  if (cartProducts.length === 0) {
    return (
      <>
        <Nav />
        <div className={styles.empty}>
          <p className={styles.emptyText}>Ton panier est vide.</p>
          <Link href="/" className={styles.emptyLink}>← Retour à la boutique</Link>
        </div>
        <Footer />
      </>
    );
  }

  const urgent = timeLeft < 3 * 60 * 1000 && timeLeft > 0;

  return (
    <>
      <Nav />
      <div className={styles.page}>
        <h1 className={styles.title}>Mon panier</h1>

        {expiresAt && (
          <div className={`${styles.timer} ${urgent ? styles.timerUrgent : ''}`}>
            {timeLeft > 0
              ? <>Réservé encore <strong>{formatTimer(timeLeft)}</strong> — règle avant expiration</>
              : <>Réservation expirée — les articles ont peut-être été pris</>
            }
          </div>
        )}

        <div className={styles.layout}>
          {/* Articles */}
          <div className={styles.items}>
            {cartProducts.map(({ product }) => (
              <div key={product.id} className={styles.item}>
                <div className={styles.itemImg}>
                  {product.image
                    ? <Image src={product.image} alt={product.title.fr} fill style={{ objectFit: 'cover' }} sizes="80px" />
                    : <div style={{ background: `linear-gradient(145deg, ${product.placeholder[0]}, ${product.placeholder[1]})`, width: '100%', height: '100%' }} />
                  }
                </div>
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{product.title.fr}</p>
                  {product.brand && <p className={styles.itemBrand}>{product.brand}</p>}
                  {product.size && <p className={styles.itemSize}>{product.size}</p>}
                </div>
                <div className={styles.itemRight}>
                  <span className={styles.itemPrice}>{product.price} €</span>
                  <button className={styles.removeBtn} onClick={() => removeItem(product.id)} title="Retirer">×</button>
                </div>
              </div>
            ))}
            <button className={styles.clearBtn} onClick={clearCart}>Vider le panier</button>
          </div>

          {/* Résumé + livraison */}
          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>Livraison</h2>

            <label className={styles.label}>Pays de destination</label>
            <select className={styles.select} value={country} onChange={e => setCountry(e.target.value)}>
              {COUNTRY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>

            <label className={styles.label}>Mode de livraison</label>
            <div className={styles.shippingOptions}>
              {zone.options.map((opt, i) => (
                <label key={i} className={`${styles.shippingOption} ${shippingIdx === i ? styles.shippingOptionSelected : ''}`}>
                  <input type="radio" name="shipping" checked={shippingIdx === i} onChange={() => setShippingIdx(i)} />
                  <span className={styles.shippingLabel}>{opt.label}</span>
                  <span className={styles.shippingPrice}>{opt.price} €</span>
                </label>
              ))}
            </div>

            {country === 'CH' && (
              <p className={styles.customsNote}>🇨🇭 La Suisse est hors UE — des frais de douane peuvent s&apos;ajouter à la livraison.</p>
            )}

            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Articles ({cartProducts.length})</span>
                <span>{subtotal} €</span>
              </div>
              <div className={styles.totalRow}>
                <span>Livraison</span>
                <span>{shippingCost} €</span>
              </div>
              <div className={`${styles.totalRow} ${styles.totalRowBold}`}>
                <span>Total</span>
                <span>{total} €</span>
              </div>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <button className={styles.checkoutBtn} onClick={handleCheckout} disabled={loading}>
              {loading ? 'Redirection…' : `Payer ${total} € →`}
            </button>

            <p className={styles.secureNote}>Paiement sécurisé par Stripe</p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
