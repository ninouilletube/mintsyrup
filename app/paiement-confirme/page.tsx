'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import styles from './confirme.module.css';

export default function PaiementConfirmePage() {
  const { clearCart } = useCart();
  useEffect(() => { clearCart(); }, [clearCart]);

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
