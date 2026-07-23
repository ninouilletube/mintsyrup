'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductsContext';
import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import styles from './wishlist.module.css';

export default function MaWishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const { wishlist, loading: wishlistLoading } = useWishlist();
  const { addItem, isInCart } = useCart();
  const { products } = useProducts();
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [addedAll, setAddedAll] = useState(false);
  const prevWishlistRef = useRef<number[]>([]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/');
  }, [authLoading, user, router]);

  // Reset "ajouté" state when wishlist changes
  useEffect(() => {
    const prev = prevWishlistRef.current;
    const changed = prev.length !== wishlist.length || wishlist.some(id => !prev.includes(id));
    if (changed && addedAll) setAddedAll(false);
    prevWishlistRef.current = wishlist;
  }, [wishlist, addedAll]);

  if (authLoading || !user) return null;

  const wishlistProducts = products.filter(p => wishlist.includes(p.id) && !p.hidden && !p.sold);
  const loading = wishlistLoading;

  const handleAddAll = () => {
    wishlistProducts.forEach(p => addItem(p));
    setAddedAll(true);
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
            <div className={styles.emptyWrap}>
              <div className={styles.emptyCard}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon-wishlist.png" alt="" className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>Ta wishlist est vide</p>
                <p className={styles.emptyText}>Clique sur le ♡ sur les articles qui te font envie !</p>
                <Link href="/?cat=drops" className={styles.emptyBtn}>Parcourir la boutique</Link>
              </div>
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
