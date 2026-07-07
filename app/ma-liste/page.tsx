'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useProducts } from '@/context/ProductsContext';
import { useCart } from '@/context/CartContext';
import styles from './ma-liste.module.css';

export default function MaListePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { wishlist, toggle } = useWishlist();
  const { products } = useProducts();
  const { addItem, isInCart } = useCart();
  const [authOpen, setAuthOpen] = useState(false);

  if (authLoading) return null;

  if (!user) {
    return (
      <>
        <Nav />
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
        <div className={styles.empty}>
          <p className={styles.emptyText}>Connecte-toi pour accéder à ta liste.</p>
          <button className={styles.btn} onClick={() => setAuthOpen(true)}>Se connecter</button>
          <Link href="/" className={styles.back}>← Retour à la boutique</Link>
        </div>
        <Footer />
      </>
    );
  }

  const wishlistProducts = wishlist
    .map(id => products.find(p => p.id === id))
    .filter(Boolean) as typeof products;

  return (
    <>
      <Nav />
      <div className={styles.page}>
        <h1 className={styles.title}>Ma liste</h1>
        {profile && <p className={styles.sub}>Les articles que tu as sauvegardés, {profile.username} 🤍</p>}

        {wishlistProducts.length === 0 ? (
          <div className={styles.emptyList}>
            <p>Ta liste est vide pour l&apos;instant.</p>
            <Link href="/" className={styles.btn}>Explorer la boutique →</Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {wishlistProducts.map(product => {
              const inCart = isInCart(product.id);
              return (
                <div key={product.id} className={styles.card}>
                  <Link href={`/product/${product.id}`} className={styles.imgWrap}>
                    {product.image
                      ? <Image src={product.image} alt={product.title.fr} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 50vw, 25vw" />
                      : <div style={{ background: `linear-gradient(145deg, ${product.placeholder[0]}, ${product.placeholder[1]})`, width: '100%', height: '100%' }} />
                    }
                    {product.sold && <span className={styles.soldBadge}>Vendu</span>}
                  </Link>
                  <div className={styles.cardBody}>
                    <Link href={`/product/${product.id}`} className={styles.cardName}>{product.title.fr}</Link>
                    <p className={styles.cardPrice}>{product.price} €</p>
                    <div className={styles.cardActions}>
                      {!product.sold && (
                        <button
                          className={`${styles.cartBtn} ${inCart ? styles.cartBtnActive : ''}`}
                          onClick={() => addItem(product)}
                          disabled={inCart}
                        >
                          {inCart ? '✓ Dans le panier' : '+ Panier'}
                        </button>
                      )}
                      <button className={styles.removeBtn} onClick={() => toggle(product.id)} title="Retirer de ma liste">♡</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
