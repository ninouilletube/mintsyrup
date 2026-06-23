'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import { useProducts } from '@/context/ProductsContext';
import { useLang } from '@/context/LangContext';
import styles from './Archives.module.css';

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
        <div className={styles.header}>
          <h1 className={styles.title}>Les Archives</h1>
          <span className={styles.count}>{sold.length} pièce{sold.length !== 1 ? 's' : ''}</span>
        </div>

        {sold.length === 0 ? (
          <p className={styles.empty}>Aucune pièce vendue pour le moment.</p>
        ) : (
          <div className={styles.grid}>
            {sold.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`} className={styles.card}>
                <div className={styles.imageWrap}>
                  {p.image
                    ? <img src={p.image} alt={p.title[lang]} className={styles.image} />
                    : <div className={styles.placeholder} style={{ background: `linear-gradient(145deg, ${p.placeholder[0]}, ${p.placeholder[1]})` }} />
                  }
                  <div className={styles.overlay}>
                    <span className={styles.badge}>Vendu</span>
                    {p.soldPrice && <span className={styles.soldPrice}>{p.soldPrice} €</span>}
                  </div>
                </div>
                <div className={styles.info}>
                  <p className={styles.cardTitle}>{p.title[lang]}</p>
                  {p.brand && <p className={styles.brand}>{p.brand}</p>}
                  <p className={styles.originalPrice}>{p.price} €</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
