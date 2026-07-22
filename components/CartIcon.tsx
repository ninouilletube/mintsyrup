'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import styles from './CartIcon.module.css';

export default function CartIcon() {
  const { count, triggerHoverPreview, endHoverPreview } = useCart();
  return (
    <Link href="/panier" className={styles.wrap} aria-label="Panier"
      onMouseEnter={() => { if (count > 0) triggerHoverPreview(); }}
      onMouseLeave={() => endHoverPreview()}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon-panier.png" alt="" className={styles.icon} />
      {count > 0 && <span className={styles.badge}>{count}</span>}
    </Link>
  );
}
