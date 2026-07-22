'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductsContext';
import styles from './CartPreview.module.css';

export default function CartPreview() {
  const { items, expiresAt, lastAddedAt, hoverPreviewAt, hoverPreviewEndAt } = useCart();
  const { products } = useProducts();
  const [show, setShow] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHovered = useRef(false); // souris actuellement sur le preview
  const prevLastAddedAt = useRef<number | null>(lastAddedAt);
  const prevHoverAt = useRef<number | null>(hoverPreviewAt);
  const prevEndAt = useRef<number | null>(hoverPreviewEndAt);

  const clear = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };

  const open = (ms: number) => { clear(); setShow(true); timerRef.current = setTimeout(() => setShow(false), ms); };
  const openIndefinite = () => { clear(); setShow(true); };
  const startCloseTimer = () => { clear(); timerRef.current = setTimeout(() => setShow(false), 300); };

  // Ajout d'article → 2,5s puis fermeture
  useEffect(() => {
    if (lastAddedAt === null || lastAddedAt === prevLastAddedAt.current) return;
    prevLastAddedAt.current = lastAddedAt;
    open(2500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAddedAt]);

  // Hover icône → ouvre sans timer
  useEffect(() => {
    if (hoverPreviewAt === null || hoverPreviewAt === prevHoverAt.current) return;
    prevHoverAt.current = hoverPreviewAt;
    if (items.length === 0) return;
    openIndefinite();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoverPreviewAt, items.length]);

  // Souris quitte l'icône → ferme seulement si pas sur le preview
  useEffect(() => {
    if (hoverPreviewEndAt === null || hoverPreviewEndAt === prevEndAt.current) return;
    prevEndAt.current = hoverPreviewEndAt;
    if (!isHovered.current) startCloseTimer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoverPreviewEndAt]);

  // Timer countdown
  useEffect(() => {
    if (!expiresAt || !show) return;
    const tick = () => setTimeLeft(Math.max(0, expiresAt - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, show]);

  // Ferme si panier vide
  useEffect(() => {
    if (items.length === 0) { clear(); setShow(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const handleMouseEnter = () => { isHovered.current = true; clear(); };
  const handleMouseLeave = () => { isHovered.current = false; startCloseTimer(); };

  const mins = Math.floor(timeLeft / 60000);
  const secs = Math.floor((timeLeft % 60000) / 1000);
  const urgent = timeLeft < 5 * 60 * 1000 && timeLeft > 0;

  return (
    <div
      className={`${styles.wrap} ${show ? styles.wrapVisible : styles.wrapHidden}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.header}>
        <span className={styles.title}>Panier · {items.length} article{items.length > 1 ? 's' : ''}</span>
        <button className={styles.close} onClick={() => { clear(); setShow(false); }}>✕</button>
      </div>

      {expiresAt && (
        <p className={`${styles.timer} ${urgent ? styles.timerUrgent : ''}`}>
          ⏱ Réservés pendant encore {mins}:{secs.toString().padStart(2, '0')}
        </p>
      )}

      <ul className={styles.list}>
        {items.map(item => {
          const product = products.find(p => p.id === item.productId);
          if (!product) return null;
          return (
            <li key={item.productId} className={styles.item}>
              {product.image
                ? <img src={product.image} alt="" className={styles.itemImg} />
                : <div className={styles.itemImgPlaceholder} style={{ background: `linear-gradient(145deg, ${product.placeholder?.[0] ?? '#eee'}, ${product.placeholder?.[1] ?? '#ccc'})` }} />
              }
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{product.title.fr}</span>
                {product.size && <span className={styles.itemSize}>{product.size}</span>}
              </div>
              <span className={styles.itemPrice}>{product.price} €</span>
            </li>
          );
        })}
      </ul>

      <Link href="/panier" className={styles.btn} onClick={() => { clear(); setShow(false); }}>
        Voir le panier →
      </Link>
    </div>
  );
}
