'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/data/products';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import styles from './wishlist.module.css';

export default function MaWishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const { wishlist, loading: wishlistLoading } = useWishlist();
  const { addItem, isInCart } = useCart();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [addedAll, setAddedAll] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/');
  }, [authLoading, user, router]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('mint_data').select('value').eq('key', 'products').single();
      const raw = data?.value;
      const all: Product[] = Array.isArray(raw) ? raw : ((raw as { products?: Product[] } | null)?.products ?? []);
      setProducts(all);
      setProductsLoading(false);
    };
    load();
  }, []);

  if (authLoading || !user) return null;

  const wishlistProducts = products.filter(p => wishlist.includes(p.id) && !p.hidden && !p.sold);
  const loading = wishlistLoading || productsLoading;

  const handleAddAll = () => {
    wishlistProducts.forEach(p => addItem(p));
    setAddedAll(true);
    setTimeout(() => setAddedAll(false), 2000);
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAddSelected = () => {
    wishlistProducts.filter(p => selected.has(p.id)).forEach(p => addItem(p));
    setSelecting(false);
    setSelected(new Set());
  };

  const cancelSelect = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  return (
    <>
      <Nav />
      <main className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.header}>
            <h1 className={styles.title}>Ma wishlist</h1>
            {!loading && wishlistProducts.length > 0 && (
              <div className={styles.actions}>
                {selecting ? (
                  <>
                    <button
                      className={styles.btnPrimary}
                      onClick={handleAddSelected}
                      disabled={selected.size === 0}
                    >
                      Ajouter au panier ({selected.size})
                    </button>
                    <button className={styles.btnGhost} onClick={cancelSelect}>
                      Annuler
                    </button>
                  </>
                ) : (
                  <>
                    <button className={styles.btnPrimary} onClick={handleAddAll}>
                      {addedAll ? '✓ Ajouté !' : 'Tout ajouter au panier'}
                    </button>
                    <button className={styles.btnGhost} onClick={() => setSelecting(true)}>
                      Sélectionner des pièces
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <p className={styles.empty}>Chargement…</p>
          ) : wishlistProducts.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyHeart}>♡</span>
              <p className={styles.emptyText}>Ta wishlist est vide pour l&apos;instant.</p>
              <p className={styles.emptySub}>Clique sur le ♡ sur les articles qui te font envie !</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {wishlistProducts.map(p => (
                <div
                  key={p.id}
                  className={`${styles.cardWrap} ${selecting ? styles.cardWrapSelecting : ''} ${selected.has(p.id) ? styles.cardWrapSelected : ''}`}
                  onClick={selecting ? () => toggleSelect(p.id) : undefined}
                >
                  {selecting && (
                    <div className={styles.checkOverlay}>
                      <span className={`${styles.check} ${selected.has(p.id) ? styles.checkOn : ''}`}>
                        {selected.has(p.id) ? '✓' : ''}
                      </span>
                    </div>
                  )}
                  {isInCart(p.id) && !selecting && (
                    <div className={styles.inCartBadge}>Dans le panier</div>
                  )}
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
