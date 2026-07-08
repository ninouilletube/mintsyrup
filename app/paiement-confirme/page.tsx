'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useProducts } from '@/context/ProductsContext';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/data/products';
import styles from './confirme.module.css';

function CommandesContent() {
  const searchParams = useSearchParams();
  const isConfirmed = !!searchParams.get('session_id');

  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const { products } = useProducts();
  const saved = useRef(false);

  const [orders, setOrders] = useState<Product[]>([]);
  const [loading, setLoading] = useState(!isConfirmed);

  // Si retour Stripe : sauvegarde collection + vide panier
  useEffect(() => {
    if (!isConfirmed) return;
    if (saved.current) return;
    saved.current = true;
    const save = async () => {
      if (user && items.length > 0) {
        for (const item of items) {
          await supabase.from('user_collection').upsert(
            { user_id: user.id, product_id: item.productId, source: 'purchase' },
            { onConflict: 'user_id,product_id' }
          );
        }
      }
      clearCart();
    };
    save();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Si page historique : charge les commandes
  useEffect(() => {
    if (isConfirmed || !user) { setLoading(false); return; }
    const load = async () => {
      const { data } = await supabase
        .from('user_collection')
        .select('product_id')
        .eq('user_id', user.id)
        .eq('source', 'purchase');
      const ids = (data ?? []).map((r: { product_id: number }) => r.product_id);
      setOrders(products.filter(p => ids.includes(p.id)));
      setLoading(false);
    };
    if (products.length > 0) load();
  }, [user, products, isConfirmed]);

  if (isConfirmed) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.check}>✓</div>
          <h1 className={styles.title}>Paiement reçu !</h1>
          <p className={styles.text}>
            Merci pour ta commande. Tu recevras un e-mail de confirmation.
            Je te contacterai sous peu pour t&apos;envoyer le numéro de suivi.
          </p>
          <Link href="/" className={styles.btn}>← Retour à la boutique</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.historyWrap}>
        <h1 className={styles.historyTitle}>Mes commandes</h1>

        {loading ? (
          <p className={styles.emptyText}>Chargement…</p>
        ) : orders.length === 0 ? (
          <div className={styles.emptyCard}>
            <span className={styles.emptyIcon}>📦</span>
            <p className={styles.emptyTitle}>Aucune commande pour le moment</p>
            <p className={styles.emptyText}>Tes achats apparaîtront ici après ton premier paiement.</p>
            <Link href="/" className={styles.btn}>Parcourir la boutique</Link>
          </div>
        ) : (
          <div className={styles.orderList}>
            {orders.map(product => {
              const img = product.images?.[0] ?? product.image ?? null;
              return (
                <Link key={product.id} href={`/product/${product.id}`} className={styles.orderRow}>
                  <div className={styles.orderImg}>
                    {img
                      ? <Image src={img} alt={product.title.fr} fill style={{ objectFit: 'cover' }} sizes="72px" />
                      : <div style={{ background: `linear-gradient(145deg, ${product.placeholder[0]}, ${product.placeholder[1]})`, width: '100%', height: '100%' }} />
                    }
                  </div>
                  <div className={styles.orderInfo}>
                    <p className={styles.orderName}>{product.title.fr}</p>
                    {product.brand && <p className={styles.orderBrand}>{product.brand}</p>}
                    {product.size && <p className={styles.orderSize}>Taille {product.size}</p>}
                  </div>
                  <span className={styles.orderPrice}>{product.price} €</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaiementConfirmePage() {
  return (
    <>
      <Nav />
      <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
        <CommandesContent />
      </Suspense>
      <Footer />
    </>
  );
}
