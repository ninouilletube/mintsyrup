'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/data/products';
import styles from './FavorisCarousel.module.css';

export default function FavorisCarousel({ products }: { products: Product[] }) {
  const [index, setIndex] = useState(0);
  const windowRef = useRef<HTMLDivElement>(null);

  const scrollTo = (i: number) => {
    const el = windowRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
    setIndex(i);
  };

  const onScroll = () => {
    const el = windowRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  };

  return (
    <div className={styles.wrap}>
      {/* Badge titre */}
      <div className={styles.header}>
        <span className={styles.badge}>Mes coups de cœur</span>
      </div>

      {/* Carousel */}
      <div className={styles.carousel}>
        <button
          className={styles.arrow}
          style={{ visibility: index > 0 ? 'visible' : 'hidden' }}
          onClick={() => scrollTo(index - 1)}
        >‹</button>

        <div className={styles.window} ref={windowRef} onScroll={onScroll}>
          <div className={styles.track}>
            {products.map((p) => {
              const img = p.images?.find(Boolean) ?? p.image ?? null;
              return (
                <div key={p.id} className={styles.slide}>
                  <Link href={`/product/${p.id}`} className={styles.card} prefetch={true}>
                    <div
                      className={styles.thumb}
                      style={{ background: `linear-gradient(135deg, ${p.placeholder[0]}, ${p.placeholder[1]})` }}
                    >
                      {img && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={p.title.fr} className={styles.img} />
                      )}
                    </div>
                    {p.favoriteText && (
                      <p className={styles.text}>{p.favoriteText}</p>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        <button
          className={styles.arrow}
          style={{ visibility: index < products.length - 1 ? 'visible' : 'hidden' }}
          onClick={() => scrollTo(index + 1)}
        >›</button>
      </div>
    </div>
  );
}
