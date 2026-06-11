'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLang } from '@/context/LangContext';
import type { Product } from '@/data/products';
import styles from './ProductCard.module.css';

export default function ProductCard({ product }: { product: Product }) {
  const { lang } = useLang();

  return (
    <article className={styles.card}>
      <Link href={`/product/${product.id}`} className={styles.cardLink}>
        <div className={styles.imageWrapper}>
          {product.image ? (
            <Image src={product.image} alt={product.title[lang]} fill className={styles.image} sizes="(max-width: 768px) 100vw, 33vw" />
          ) : (
            <div className={styles.placeholder} style={{ background: `linear-gradient(145deg, ${product.placeholder[0]}, ${product.placeholder[1]})` }}>
              <span className={styles.placeholderText}>{lang === 'fr' ? 'Photo à venir' : 'Photo coming soon'}</span>
            </div>
          )}
          {product.images?.[1] && (
            <img src={product.images[1]} alt="" className={styles.imageHover} />
          )}
          <span className={styles.priceTag}>
            {product.price} €
          </span>
        </div>
        <div className={styles.body}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>{product.title[lang]}</h3>
            {product.size && <span className={styles.size}>{product.size}</span>}
          </div>
          {product.brand && <p className={styles.brand}>{product.brand}</p>}
          <p className={styles.desc}>{product.description[lang]}</p>
        </div>
      </Link>
      <div className={styles.btnWrap}>
        <Link href={`/product/${product.id}`} className={styles.btn}>
          {lang === 'fr' ? 'Voir la pièce →' : 'See item →'}
        </Link>
      </div>
    </article>
  );
}
