'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import styles from './confirme.module.css';

export default function PaiementConfirmePage() {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const saved = useRef(false);

  useEffect(() => {
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
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Nav />
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
      <Footer />
    </>
  );
}
