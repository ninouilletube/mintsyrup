'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLang } from '@/context/LangContext';
import { useTags } from '@/context/TagsContext';
import type { Product } from '@/data/products';
import styles from './ProductCard.module.css';

export default function ProductCard({ product }: { product: Product }) {
  const { lang } = useLang();
  const { tags } = useTags();
  const firstTag = product.tags?.[0] ? tags.find((t) => t.id === product.tags![0]) : null;
  const priceColor = firstTag?.color ?? '#F0729A';

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
        <a href={product.vintedUrl} target="_blank" rel="noopener noreferrer" className={styles.btn}>
          {lang === 'fr' ? 'Acheter sur Vinted ↗' : 'Buy on Vinted ↗'}
        </a>
      </div>
    </article>
  );
}
