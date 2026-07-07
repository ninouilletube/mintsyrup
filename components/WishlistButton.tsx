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
        <svg viewBox="0 0 24 24" width="18" height="18" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
