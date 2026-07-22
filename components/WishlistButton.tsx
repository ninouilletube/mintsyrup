'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import AuthModal from './AuthModal';
import styles from './WishlistButton.module.css';

type Props = { productId: number; className?: string };

export default function WishlistButton({ productId, className }: Props) {
  const { user } = useAuth();
  const { isInWishlist, toggle } = useWishlist();
  const [showAuth, setShowAuth] = useState(false);
  const active = isInWishlist(productId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { setShowAuth(true); return; }
    toggle(productId);
  };

  return (
    <>
      <button
        className={`${styles.btn} ${active ? styles.active : ''} ${className ?? ''}`}
        onClick={handleClick}
        title={active ? 'Retirer de ma wishlist' : 'Ajouter à ma wishlist'}
        aria-label={active ? 'Retirer de ma wishlist' : 'Ajouter à ma wishlist'}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={active ? '/icon-wishlist-active.png' : '/icon-wishlist.png'} alt="" className={styles.icon} />
      </button>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
