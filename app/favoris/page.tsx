import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import Link from 'next/link';
import PageArrow from '@/components/PageArrow';
import RetourArrow from '@/components/RetourArrow';
import FavorisCarousel from '@/components/FavorisCarousel';
import ScrollToTop from '@/components/ScrollToTop';
import { getData } from '@/lib/supabase';
import type { Product } from '@/data/products';
import styles from './favoris.module.css';

export const revalidate = 60;

export default async function FavorisPage() {
  const allProducts = (await getData('products') as Product[] | null) ?? [];
  const specialPostits = (await getData('config_special_postits') as { summer?: string; coeur?: string } | null) ?? {};
  const products = allProducts
    .filter((p) => p.favorite && !p.hidden && !p.sold)
    .sort((a, b) => (b.favoriteOrder ?? 0) - (a.favoriteOrder ?? 0))
    .slice(0, 4);

  return (
    <>
      <ScrollToTop />
      <Nav />
      <span className={styles.mobileHidden}><RetourArrow direction="left" /></span>
      <span className={styles.mobileHidden}><PageArrow href="/projet" label="Le projet" direction="right" /></span>
      <main className={styles.main}>
        <div className={styles.container}>
          {products.length === 0 ? (
            <p className={styles.empty}>Aucun favori pour l&apos;instant.</p>
          ) : (
            <>
              {/* Desktop : grid avec post-it */}
              <div className={styles.gridWrap}>
                <span className={styles.postit}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={specialPostits.coeur ?? '/postit-coeur.png'} alt="mes coups de coeur" className={styles.postitHandwriting} />
                </span>
                <div className={styles.grid}>
                  {products.map((p) => {
                    const img = p.images?.find(Boolean) ?? p.image ?? null;
                    return (
                      <Link key={p.id} href={`/product/${p.id}`} className={styles.card}>
                        <div
                          className={styles.thumb}
                          style={{ background: `linear-gradient(135deg, ${p.placeholder[0]}, ${p.placeholder[1]})` }}
                        >
                          {img && <img src={img} alt={p.title.fr} className={styles.img} />}
                          {p.images?.[1] && <img src={p.images[1]} alt="" className={styles.imgHover} />}
                        </div>
                        {p.favoriteText && (
                          <p className={styles.favoriteText}>{p.favoriteText}</p>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Mobile : carousel centré */}
              <FavorisCarousel products={products} />
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
