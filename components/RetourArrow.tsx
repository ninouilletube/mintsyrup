'use client';

import { useRouter } from 'next/navigation';
import { useShop } from '@/context/ShopContext';
import styles from './PageArrow.module.css';

type Props = {
  direction: 'left' | 'right';
};

export default function RetourArrow({ direction }: Props) {
  const router = useRouter();
  const { setActiveCategory } = useShop();

  const handleClick = () => {
    setActiveCategory(null);
    router.push('/');
  };

  return (
    <button
      onClick={handleClick}
      className={`${styles.arrow} ${direction === 'left' ? styles.left : styles.right}`}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/fleche-droite.png"
        alt={direction === 'left' ? '←' : '→'}
        className={`${styles.arrowImg} ${direction === 'left' ? styles.arrowImgFlip : ''}`}
      />
      <span className={styles.label}>Retour</span>
    </button>
  );
}
