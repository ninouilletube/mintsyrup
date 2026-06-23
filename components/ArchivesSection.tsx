'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useProducts } from '@/context/ProductsContext';
import { useLang } from '@/context/LangContext';
import styles from './ArchivesSection.module.css';

export default function ArchivesSection() {
  const { products } = useProducts();
  const { lang } = useLang();

  const sold = useMemo(() =>
    products
      .filter((p) => p.sold)
      .sort((a, b) => (b.soldAt ?? b.id) - (a.soldAt ?? a.id))
      .slice(0, 12),
    [products]
  );

  if (!sold.length) return null;

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Les Archives</h2>
        <Link href="/archives" className={styles.allLink}>
          Voir tout ({products.filter((p) => p.sold).length}) →
        </Link>
      </div>
      <div className={styles.grid}>
        {sold.map((p) => (
          <Link key={p.id} href={`/product/${p.id}`} className={styles.card}>
            <div className={styles.imageWrap}>
              {p.image
                ? <img src={p.image} alt={p.title[lang]} className={styles.image} />
                : <div className={styles.placeholder} style={{ background: `linear-gradient(145deg, ${p.placeholder[0]}, ${p.placeholder[1]})` }} />
              }
              <span className={styles.badge}>Vendu</span>
            </div>
            <p className={styles.name}>{p.title[lang]}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
