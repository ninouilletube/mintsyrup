'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductsContext';
import { useAuth } from '@/context/AuthContext';
import styles from './panier.module.css';

const MONDIAL_RELAY_COUNTRIES = ['PT', 'FR', 'BE', 'LU', 'ES', 'DE', 'NL', 'IT'];

type ShippingOption = {
  id: string;
  label: string;
  price: number;
  isRelay: boolean;
  carrier: 'ups' | 'mondial-relay';
};

function getOptions(countryCode: string): ShippingOption[] {
  const options: ShippingOption[] = [
    { id: 'ups-relay', label: 'UPS — Point Relais',  price: 13, isRelay: true,  carrier: 'ups' },
    { id: 'ups-home',  label: 'UPS — Domicile',      price: 15, isRelay: false, carrier: 'ups' },
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
  { code: 'ES', label: 'Espagne' },
  { code: 'DE', label: 'Allemagne' },
  { code: 'NL', label: 'Pays-Bas' },
  { code: 'IT', label: 'Italie' },
  { code: 'CH', label: 'Suisse' },
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
  const { user, profile } = useAuth();
  const [timeLeft, setTimeLeft] = useState(0);

  // Livraison
  const [country, setCountry]               = useState('FR');
  const [selectedOptionId, setSelectedOptionId] = useState('ups-relay');
  const [relayPoint, setRelayPoint]         = useState('');
  const [deliveryNote, setDeliveryNote]     = useState('');

  // Adresse
  const [fullName, setFullName]     = useState('');
  const [address, setAddress]       = useState('');
  const [city, setCity]             = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Code promo
  const [promoInput, setPromoInput]       = useState('');
  const [promoCode, setPromoCode]         = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoLoading, setPromoLoading]   = useState(false);
  const [promoError, setPromoError]       = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const cartProducts = items
    .map(item => ({ item, product: products.find(p => p.id === item.productId) }))
    .filter((x): x is { item: typeof items[0]; product: NonNullable<typeof products[0]> } => !!x.product);

  const subtotal = cartProducts.reduce((s, { product }) => s + product.price, 0);
  const options = getOptions(country);
  const selectedOption = options.find(o => o.id === selectedOptionId) ?? options[0];
  const total = Math.max(0, subtotal + selectedOption.price - promoDiscount);

  useEffect(() => {
    if (!options.find(o => o.id === selectedOptionId)) setSelectedOptionId(options[0].id);
    setRelayPoint('');
  }, [country]);

  useEffect(() => {
    if (!expiresAt) { setTimeLeft(0); return; }
    const tick = () => setTimeLeft(Math.max(0, expiresAt - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await fetch('/api/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setPromoError(data.error ?? 'Code invalide');
        setPromoCode(null);
        setPromoDiscount(0);
      } else {
        setPromoCode(data.code);
        setPromoDiscount(data.discount);
        setPromoError(null);
      }
    } catch {
      setPromoError('Erreur réseau');
    } finally {
      setPromoLoading(false);
    }
  };

  const addressFilled = fullName.trim() && address.trim() && city.trim() && postalCode.trim();
  const relayFilled   = !selectedOption.isRelay || relayPoint.trim().length > 0;
  const canCheckout   = !!addressFilled && relayFilled;

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
          deliveryNote: deliveryNote.trim() || null,
          deliveryAddress: {
            fullName: fullName.trim(),
            address: address.trim(),
            city: city.trim(),
            postalCode: postalCode.trim(),
            country,
          },
          promoCode: promoCode ?? null,
          promoDiscount,
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
        <div className={styles.titleRow}>
          <div className={styles.postit}>
            <img src="/postit-panier.png" alt="Mon panier" className={styles.postitHandwriting} />
          </div>
        </div>

        <div className={styles.layout}>
          {/* ── Articles ── */}
          <div className={styles.items}>
            {user ? (
              <div className={styles.authBannerOk}>
                Connecté.e en tant que <strong>{profile?.username ?? user.email}</strong>
              </div>
            ) : (
              <div className={styles.authBannerWarn}>
                Attention, vous n&apos;êtes pas connecté.e. Vos achats ne seront pas ajoutés automatiquement à votre profil.
              </div>
            )}
            {expiresAt && (
              <div className={`${styles.timer} ${urgent ? styles.timerUrgent : ''}`}>
                {timeLeft > 0
                  ? <>Votre panier est réservé pendant <strong>{formatTimer(timeLeft)}</strong>. Attention, les articles restent visibles sur Vinted.</>
                  : <>Réservation expirée</>}
              </div>
            )}
            {cartProducts.map(({ product }) => {
              const allImages = product.images?.length ? product.images : (product.image ? [product.image] : []);
              const previewImgs = allImages.slice(0, 3);
              return (
              <Link key={product.id} href={`/product/${product.id}`} className={styles.item}>
                <div className={styles.itemImgs}>
                  {previewImgs.length > 0
                    ? previewImgs.map((src, i) => (
                        <div key={i} className={styles.itemImg}>
                          <Image src={src} alt={product.title.fr} fill style={{ objectFit: 'cover' }} sizes="96px" />
                        </div>
                      ))
                    : <div className={styles.itemImg}>
                        <div style={{ background: `linear-gradient(145deg, ${product.placeholder[0]}, ${product.placeholder[1]})`, width: '100%', height: '100%' }} />
                      </div>
                  }
                </div>
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{product.title.fr}</p>
                  {product.brand && <p className={styles.itemBrand}>{product.brand}</p>}
                  {product.size && <p className={styles.itemSize}>{product.size}</p>}
                </div>
                {product.vintedUrl && (
                  <a
                    href={product.vintedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.vintedBtn}
                    onClick={e => e.stopPropagation()}
                  >
                    Voir sur Vinted
                  </a>
                )}
                <div className={styles.itemRight}>
                  <span className={styles.itemPrice}>{product.price} €</span>
                  <button className={styles.removeBtn} onClick={e => { e.preventDefault(); removeItem(product.id); }} title="Retirer">×</button>
                </div>
              </Link>
              );
            })}
            <button className={styles.clearBtn} onClick={clearCart}>Vider le panier</button>
          </div>

          {/* ── Résumé ── */}
          <div className={styles.summary}>

            {/* Livraison */}
            <h2 className={styles.summaryTitle}>Livraison</h2>

            <label className={styles.label}>Pays de destination</label>
            <select className={styles.select} value={country} onChange={e => setCountry(e.target.value)}>
              {COUNTRY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>

            <label className={styles.label}>Mode de livraison</label>
            <div className={styles.shippingOptions}>
              {options.map((opt) => (
                <label
                  key={opt.id}
                  className={`${styles.shippingOption} ${selectedOptionId === opt.id ? styles.shippingOptionSelected : ''} ${opt.carrier === 'ups' ? styles.shippingOptionUPS : styles.shippingOptionMR}`}
                >
                  <input type="radio" name="shipping" checked={selectedOptionId === opt.id} onChange={() => setSelectedOptionId(opt.id)} />
                  <span className={styles.shippingLabel}>{opt.label}</span>
                  <span className={styles.shippingPrice}>{opt.price} €</span>
                </label>
              ))}
            </div>

            {country === 'CH' && (
              <p className={styles.customsNote}>🇨🇭 La Suisse est hors UE — des frais de douane peuvent s&apos;ajouter, à la charge du destinataire.</p>
            )}

            <p className={styles.vintedNote}>
              Trop cher ? Je vous recommande de passer par{' '}
              <a href="https://www.vinted.fr/member/288609653" target="_blank" rel="noopener noreferrer" className={styles.vintedLink}>Vinted</a>.
            </p>

            {/* Adresse */}
            <h2 className={styles.summaryTitle}>Adresse de livraison</h2>
            <input className={styles.select} type="text" placeholder="Nom complet" value={fullName} onChange={e => setFullName(e.target.value)} />
            <input className={styles.select} type="text" placeholder="Adresse (rue et numéro)" value={address} onChange={e => setAddress(e.target.value)} />
            <div className={styles.addressRow}>
              <input className={styles.select} type="text" placeholder="Code postal" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
              <input className={styles.select} type="text" placeholder="Ville" value={city} onChange={e => setCity(e.target.value)} />
            </div>

            {/* Point relais (si relay sélectionné) */}
            {selectedOption.isRelay && (
              <div className={styles.relayWrap}>
                <label className={styles.label}>Point relais souhaité</label>
                <input
                  className={`${styles.select} ${styles.relayInput}`}
                  type="text"
                  placeholder=""
                  value={relayPoint}
                  onChange={e => setRelayPoint(e.target.value)}
                />
                <p className={styles.relayHint}>
                  Trouve ton point relais sur {selectedOption.carrier === 'ups' ? 'ups.com' : 'mondialrelay.fr'}. Merci de noter l&apos;adresse complète.
                </p>
              </div>
            )}

            {/* Une précision ? (tous modes) */}
            <div className={styles.relayWrap}>
              <label className={styles.label}>Une précision ?</label>
              <input
                className={`${styles.select} ${styles.relayInput}`}
                type="text"
                placeholder=""
                value={deliveryNote}
                onChange={e => setDeliveryNote(e.target.value)}
              />
            </div>

            {/* Code promo */}
            <div className={styles.promoSection}>
              <div className={styles.promoLabelRow}>
                <span className={styles.label}>Code promo</span>
                <button className={styles.promoInfoBtn} type="button" tabIndex={0}>
                  i
                  <span className={styles.promoTooltip}>
                    Vous pouvez aussi utiliser votre code sur Vinted — il suffit de me le communiquer via la messagerie.
                  </span>
                </button>
              </div>
              {promoCode ? (
                <p className={styles.promoSuccess}>✓ Code <strong>{promoCode}</strong> appliqué — {promoDiscount} € de réduction</p>
              ) : (
                <div className={styles.promoInputRow}>
                  <input
                    className={styles.promoInput}
                    type="text"
                    placeholder=""
                    value={promoInput}
                    onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); }}
                    onKeyDown={e => e.key === 'Enter' && applyPromo()}
                  />
                  <button className={styles.promoApplyBtn} onClick={applyPromo} disabled={promoLoading || !promoInput.trim()}>
                    {promoLoading ? '…' : 'Appliquer'}
                  </button>
                </div>
              )}
              {promoError && <p className={styles.promoError}>{promoError}</p>}
            </div>

            {/* Totaux */}
            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Articles ({cartProducts.length})</span>
                <span>{subtotal} €</span>
              </div>
              <div className={styles.totalRow}>
                <span>Livraison</span>
                <span>{selectedOption.price} €</span>
              </div>
              {promoDiscount > 0 && (
                <div className={styles.totalRow}>
                  <span>Code promo</span>
                  <span className={styles.promoDiscount}>− {promoDiscount} €</span>
                </div>
              )}
              <div className={`${styles.totalRow} ${styles.totalRowBold}`}>
                <span>Total</span>
                <span>{total} €</span>
              </div>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <button className={styles.checkoutBtn} onClick={handleCheckout} disabled={loading || !canCheckout}>
              {loading ? 'Redirection…' : `Payer ${total} € →`}
            </button>

            {!canCheckout && (
              <p className={styles.relayHint} style={{ textAlign: 'center', color: '#C83A20' }}>
                {!addressFilled ? 'Remplis ton adresse de livraison' : 'Indique ton point relais'}
              </p>
            )}

            <p className={styles.secureNote}>Paiement sécurisé par Stripe</p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
