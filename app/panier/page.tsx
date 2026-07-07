'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { useCart, RESERVE_DURATION } from '@/context/CartContext';
import { useProducts } from '@/context/ProductsContext';
import styles from './panier.module.css';

// Mondial Relay disponible depuis Lisbonne vers ces pays
const MONDIAL_RELAY_COUNTRIES = ['PT', 'FR', 'BE', 'LU', 'ES'];

type ShippingOption = {
  id: string;
  label: string;
  price: number;
  isRelay: boolean;
  carrier: 'ups' | 'mondial-relay';
};

function getOptions(countryCode: string): ShippingOption[] {
  const options: ShippingOption[] = [
    { id: 'ups-relay',  label: 'UPS — Point Relais',  price: 13, isRelay: true,  carrier: 'ups' },
    { id: 'ups-home',   label: 'UPS — Domicile',       price: 15, isRelay: false, carrier: 'ups' },
  ];
  if (MONDIAL_RELAY_COUNTRIES.includes(countryCode)) {
    options.push({ id: 'mr-relay', label: 'Mondial Relay — Point Relais', price: 13, isRelay: true, carrier: 'mondial-relay' });
  }
  return options;
}

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
  const [selectedOptionId, setSelectedOptionId] = useState('ups-relay');
  const [relayPoint, setRelayPoint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cartProducts = items
    .map(item => ({ item, product: products.find(p => p.id === item.productId) }))
    .filter((x): x is { item: typeof items[0]; product: NonNullable<typeof products[0]> } => !!x.product);

  const subtotal = cartProducts.reduce((s, { product }) => s + product.price, 0);

  const options = getOptions(country);
  const selectedOption = options.find(o => o.id === selectedOptionId) ?? options[0];
  const total = subtotal + selectedOption.price;

  // Quand le pays change, réinitialise l'option si elle n'est plus disponible
  useEffect(() => {
    if (!options.find(o => o.id === selectedOptionId)) {
      setSelectedOptionId(options[0].id);
    }
    setRelayPoint('');
  }, [country]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) { setTimeLeft(0); return; }
    const tick = () => setTimeLeft(Math.max(0, expiresAt - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const canCheckout = !selectedOption.isRelay || relayPoint.trim().length > 0;

  const handleCheckout = async () => {
    if (cartProducts.length === 0 || !canCheckout) return;
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
          shipping: { label: selectedOption.label, price: selectedOption.price },
          country,
          carrier: selectedOption.carrier,
          relayPoint: selectedOption.isRelay ? relayPoint.trim() : null,
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
              {options.map((opt) => (
                <label key={opt.id} className={`${styles.shippingOption} ${selectedOptionId === opt.id ? styles.shippingOptionSelected : ''}`}>
                  <input type="radio" name="shipping" checked={selectedOptionId === opt.id} onChange={() => setSelectedOptionId(opt.id)} />
                  <span className={styles.shippingLabel}>{opt.label}</span>
                  <span className={styles.shippingPrice}>{opt.price} €</span>
                </label>
              ))}
            </div>

            {selectedOption.isRelay && (
              <div className={styles.relayWrap}>
                <label className={styles.label}>Point relais souhaité</label>
                <input
                  className={`${styles.select} ${styles.relayInput}`}
                  type="text"
                  placeholder="Ex : Tabac du Centre — 12 rue de la Paix, Paris"
                  value={relayPoint}
                  onChange={e => setRelayPoint(e.target.value)}
                />
                <p className={styles.relayHint}>Indique le nom et l&apos;adresse du point relais. Trouve-le sur ups.com ou mondialrelay.fr.</p>
              </div>
            )}

            {country === 'CH' && (
              <p className={styles.customsNote}>🇨🇭 La Suisse est hors UE — des frais de douane peuvent s&apos;ajouter à la livraison, à la charge du destinataire.</p>
            )}

            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Articles ({cartProducts.length})</span>
                <span>{subtotal} €</span>
              </div>
              <div className={styles.totalRow}>
                <span>Livraison</span>
                <span>{selectedOption.price} €</span>
              </div>
              <div className={`${styles.totalRow} ${styles.totalRowBold}`}>
                <span>Total</span>
                <span>{total} €</span>
              </div>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <button
              className={styles.checkoutBtn}
              onClick={handleCheckout}
              disabled={loading || !canCheckout}
            >
              {loading ? 'Redirection…' : `Payer ${total} € →`}
            </button>

            {selectedOption.isRelay && !relayPoint.trim() && (
              <p className={styles.relayHint} style={{ textAlign: 'center', color: '#C83A20' }}>Indique d&apos;abord ton point relais</p>
            )}

            <p className={styles.secureNote}>Paiement sécurisé par Stripe</p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
