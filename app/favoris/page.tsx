import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { getData } from '@/lib/supabase';
import type { Product } from '@/data/products';
import styles from './favoris.module.css';

export const revalidate = 60;

export default async function FavorisPage() {
  const [favIds, allProducts] = await Promise.all([
    getData('favorites') as Promise<number[] | null>,
    getData('products') as Promise<Product[] | null>,
  ]);

  const ids = favIds ?? [];
  const products = (allProducts ?? []).filter((p) => ids.includes(p.id));

  return (
    <>
      <Nav />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Mes favoris</h1>
          {products.length === 0 ? (
            <p className={styles.empty}>Aucun favori pour l&apos;instant.</p>
          ) : (
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
                    </div>
                    <div className={styles.info}>
                      <p className={styles.name}>{p.title.fr}</p>
                      {p.brand && <p className={styles.brand}>{p.brand}</p>}
                      <p className={styles.price}>{p.price} €</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
