'use client';

import { useMemo, useState } from 'react';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import type { Product } from '@/data/products';
import { useProducts } from '@/context/ProductsContext';
import { useLang } from '@/context/LangContext';
import styles from './Archives.module.css';

function ArchiveCard({ product, lang }: { product: Product; lang: 'fr' | 'en' }) {
  const [hovered, setHovered] = useState(false);
  const hasSecond = !!(product.images?.[1]);

  return (
    <div
      className={styles.card}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={styles.imageWrap}>
        {product.image
          ? <img src={product.image} alt={product.title[lang]} className={styles.image} />
          : <div className={styles.placeholder} style={{ background: `linear-gradient(145deg, ${product.placeholder[0]}, ${product.placeholder[1]})` }} />
        }
        {hasSecond && (
          <img
            src={product.images![1]}
            alt=""
            className={`${styles.imageHover} ${hovered ? styles.imageHoverVisible : ''}`}
          />
        )}
        <div className={styles.overlay}>
          <span className={styles.badge}>Vendu</span>
          {product.soldPrice && <span className={styles.soldPrice}>{product.soldPrice} €</span>}
        </div>
      </div>
      <div className={styles.info}>
        <p className={styles.cardTitle}>{product.title[lang]}</p>
        {product.brand && <p className={styles.brand}>{product.brand}</p>}
        <p className={styles.price}>{product.price} €</p>
      </div>
    </div>
  );
}

export default function ArchivesPage() {
  const { products } = useProducts();
  const { lang } = useLang();

  // TEST VISUEL — à retirer
  const sold = useMemo(() =>
    products
      .filter((p) => !p.hidden)
      .slice(0, 20),
    [products]
  );

  return (
    <>
      <ScrollToTop />
      <Nav />
      <main className={styles.main}>
        <div className={styles.inner}>
          <div className={styles.header}>
            <h1 className={styles.title}>Les Archives</h1>
            <span className={styles.count}>{sold.length} pièce{sold.length !== 1 ? 's' : ''}</span>
          </div>

          {sold.length === 0 ? (
            <p className={styles.empty}>Aucune pièce vendue pour le moment.</p>
          ) : (
            <div className={styles.grid}>
              {sold.map((p) => (
                <ArchiveCard key={p.id} product={p} lang={lang} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
