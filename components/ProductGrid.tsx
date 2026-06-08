'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useLang } from '@/context/LangContext';
import { useShop } from '@/context/ShopContext';
import { useProducts } from '@/context/ProductsContext';
import { useSubcategories } from '@/context/SubcategoriesContext';
import { getCurrentSeason, SEASON_TO_ID, type SeasonKey } from '@/lib/season';
import ProductCard from './ProductCard';
import styles from './ProductGrid.module.css';


export default function ProductGrid() {
  const { lang } = useLang();
  const { activeCategory } = useShop();
  const { products } = useProducts();
  const { subcategories } = useSubcategories();

  const [filterType, setFilterType] = useState<string | null>(null);
  const [dropsIndex, setDropsIndex] = useState(0);
  const carouselWindowRef = useRef<HTMLDivElement>(null);

  const GAP = 16;

  useLayoutEffect(() => {
    const el = carouselWindowRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      // Reset scroll position on resize
      el.scrollLeft = dropsIndex * ((el.clientWidth - 3 * GAP) / 4 + GAP);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [dropsIndex]);

  const scrollTo = (index: number) => {
    const el = carouselWindowRef.current;
    if (!el) return;
    const cardWidth = (el.clientWidth - 3 * GAP) / 4;
    el.scrollTo({ left: index * (cardWidth + GAP), behavior: 'smooth' });
    setDropsIndex(index);
  };

  // Reset scroll on category change
  useEffect(() => {
    if (activeCategory === 'drops') {
      carouselWindowRef.current?.scrollTo({ left: 0 });
    }
  }, [activeCategory]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeCategory === 'drops') setDropsIndex(0);
  }, [activeCategory]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const onScroll = () => setShowScrollTop(panel.scrollTop > 120);
    panel.addEventListener('scroll', onScroll);
    return () => panel.removeEventListener('scroll', onScroll);
  }, []);

  const DROPS_VISIBLE = 4;
  const DROPS_MAX = 15;

  if (activeCategory === null) return null;

  const isDrops = activeCategory === 'drops';

  const visible = products.filter((p) => !p.hidden);

  const byCategory = isDrops
    ? [...visible].sort((a, b) => b.id - a.id)
    : activeCategory === 'ete'
      ? visible.filter((p) => p.seasons?.includes(SEASON_TO_ID[getCurrentSeason()]))
      : visible.filter((p) => p.categories.includes(activeCategory));

  // Sous-catégories disponibles dans la sélection courante
  const availableTypeIds = [...new Set(byCategory.map((p) => p.subcategory).filter(Boolean))] as string[];

  // Apply filter
  const filtered = byCategory.filter((p) => {
    if (filterType && p.subcategory !== filterType) return false;
    return true;
  });

  const hasTypeFilter = !isDrops && availableTypeIds.length > 0;

  const season = activeCategory === 'ete' ? getCurrentSeason() : null;

  const dropsPool = isDrops ? filtered.slice(0, DROPS_MAX) : [];
  const canPrev = dropsIndex > 0;
  const canNext = dropsIndex + DROPS_VISIBLE < dropsPool.length;

  return (
    <div className={styles.overlay}>
      <div className={isDrops ? styles.panelOpen : styles.panel} ref={panelRef}>

        {hasTypeFilter && (
          <div className={styles.filterBar}>
            <button
              className={`${styles.filterItem} ${filterType === null ? styles.filterItemActive : ''}`}
              onClick={() => setFilterType(null)}
            >Tous</button>
            {availableTypeIds.map((id, i) => {
              const sub = subcategories.find((s) => s.id === id);
              if (!sub) return null;
              return (
                <span key={id} className={styles.filterRow}>
                  <span className={styles.filterSep}>—</span>
                  <button
                    className={`${styles.filterItem} ${filterType === id ? styles.filterItemActive : ''}`}
                    onClick={() => setFilterType(filterType === id ? null : id)}
                  >{sub.label}</button>
                </span>
              );
            })}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className={styles.empty}>
            {lang === 'fr' ? "Il n'y a pas encore de pièces dans cette catégorie — Reviens plus tard <3" : 'No pieces in this category yet... Check back soon <3'}
          </p>
        ) : isDrops ? (
          <div className={styles.carousel}>
            <button className={styles.carouselArrow} style={{ visibility: canPrev ? 'visible' : 'hidden' }} onClick={() => scrollTo(Math.max(0, dropsIndex - 1))}>‹</button>
            <div className={styles.carouselWindow} ref={carouselWindowRef}>
              <div className={styles.carouselTrack}>
                {dropsPool.map((product) => (
                  <div key={product.id} className={styles.carouselItem}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
            <button className={styles.carouselArrow} style={{ visibility: canNext ? 'visible' : 'hidden' }} onClick={() => scrollTo(Math.min(dropsPool.length - DROPS_VISIBLE, dropsIndex + 1))}>›</button>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        {showScrollTop && (
          <button className={styles.scrollTop} onClick={() => panelRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>
        )}
      </div>
    </div>
  );
}
