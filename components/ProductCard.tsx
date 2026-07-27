'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLang } from '@/context/LangContext';
import type { Product } from '@/data/products';
import styles from './ProductCard.module.css';
import WishlistButton from './WishlistButton';
import { ORIGIN_KEY } from './NavigationTracker';
import { useCart, RESERVE_DURATION } from '@/context/CartContext';

const SOLD_DELAY = 7 * 24 * 60 * 60 * 1000;

export default function ProductCard({ product }: { product: Product }) {
  const { lang } = useLang();
  const { sessionId } = useCart();
  const recentlySold = !!product.sold && !!product.soldAt && Date.now() - product.soldAt < SOLD_DELAY;
  const isReservedByOther = !!product.reservedAt && !!product.reservedSession &&
    product.reservedSession !== sessionId &&
    Date.now() - product.reservedAt < RESERVE_DURATION;

  const captureOrigin = () => {
    if (!window.location.pathname.startsWith('/product/')) {
      sessionStorage.setItem(ORIGIN_KEY, window.location.pathname + window.location.search);
    }
  };

  return (
    <article className={`${styles.card} ${recentlySold ? styles.cardSold : ''}`}>
      <div
        className={styles.cardLink}
        onContextMenu={(e) => {
          // Mobile uniquement — bloquer le menu "télécharger / partager" sur appui long
          if (window.matchMedia('(hover: none)').matches) e.preventDefault();
        }}
      >
        <div className={styles.imageOuter}>
          <div className={styles.imageWrapper}>
            {product.image ? (
              <Image src={product.image} alt={product.title[lang]} fill className={styles.image} sizes="(max-width: 768px) 100vw, 33vw" draggable={false} />
            ) : (
              <div className={styles.placeholder} style={{ background: `linear-gradient(145deg, ${product.placeholder[0]}, ${product.placeholder[1]})` }}>
                <span className={styles.placeholderText}>{lang === 'fr' ? 'Photo à venir' : 'Photo coming soon'}</span>
              </div>
            )}
            {product.images?.[1] && (
              <img src={product.images[1]} alt="" className={styles.imageHover} draggable={false} />
            )}
            <span className={styles.priceTag}>
              {product.price} €
            </span>
            {recentlySold && (
              <div className={styles.soldWatermark}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/postit-vendu.png" alt="Vendu" className={styles.soldWatermarkImg} />
              </div>
            )}
          </div>
          {isReservedByOther && !recentlySold && (
            <div className={styles.reservedBadge}>⏳ Réservé</div>
          )}
          {!product.sold && <WishlistButton productId={product.id} />}
        </div>
        <div className={styles.body}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>{product.title[lang]}</h3>
            {product.size && <span className={styles.size}>{product.size}</span>}
          </div>
          {product.brand && <p className={styles.brand}>{product.brand}</p>}
        </div>
      </div>
      <div className={styles.btnWrap}>
        {recentlySold ? (
          <Link href="/archives" className={styles.btn}>
            {lang === 'fr' ? 'Voir les archives' : 'See archives'}<span className={styles.btnArrow}> →</span>
          </Link>
        ) : (
          <Link href={`/product/${product.id}`} className={styles.btn} prefetch={true} onClick={captureOrigin}>
            {lang === 'fr' ? 'Voir la pièce' : 'See item'}<span className={styles.btnArrow}> →</span>
          </Link>
        )}
      </div>
    </article>
  );
}
