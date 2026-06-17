'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useLang } from '@/context/LangContext';
import { useShop } from '@/context/ShopContext';
import { useProducts } from '@/context/ProductsContext';
import { useSubcategories } from '@/context/SubcategoriesContext';
import { getCurrentSeason, SEASON_TO_ID, type SeasonKey } from '@/lib/season';
import { getColor } from '@/data/colors';
import { CATEGORIES } from '@/data/categories';
import ProductCard from './ProductCard';
import styles from './ProductGrid.module.css';


export default function ProductGrid() {
  const { lang } = useLang();
  const { activeCategory } = useShop();
  const { products } = useProducts();
  const { subcategories, colorOrder } = useSubcategories();

  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterSizes, setFilterSizes] = useState<string[]>([]);
  const [filterColor, setFilterColor] = useState<string | null>(null);
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

  // Reset filters and scroll on category change
  useEffect(() => {
    setFilterType(null);
    setFilterSizes([]);
    setFilterColor(null);
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
    const onScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const DROPS_VISIBLE = 4;
  const DROPS_MAX = 15;

  if (activeCategory === null) return null;

  const isDrops = activeCategory === 'drops';

  const visible = products.filter((p) => !p.hidden);

  const byCategory = isDrops
    ? [...visible].sort((a, b) => b.id - a.id)
    : activeCategory === 'ete'
      ? [...visible.filter((p) => p.seasons?.includes(SEASON_TO_ID[getCurrentSeason()]))].sort((a, b) => b.id - a.id)
      : [...visible.filter((p) => p.categories.includes(activeCategory))].sort((a, b) => b.id - a.id);

  const SIZE_ORDER = ['TU','XXXS / 30 / 2','XXS / 32 / 4','XS / 34 / 6','S / 36 / 8','M / 38 / 10','L / 40 / 12','XL / 42 / 14','2XL / 44 / 16','3XL / 46 / 18','4XL / 48 / 20'];

  // Faceted filtering: each group is computed from products filtered by the OTHER active filters
  const forTypes = byCategory.filter((p) => {
    if (filterSizes.length > 0 && !filterSizes.includes(p.size)) return false;
    if (filterColor && !p.tags?.includes(filterColor)) return false;
    return true;
  });
  const availableTypeIds = ([...new Set(forTypes.map((p) => p.subcategory).filter(Boolean))] as string[])
    .sort((a, b) => {
      const subA = subcategories.find((s) => s.id === a);
      const subB = subcategories.find((s) => s.id === b);
      if (!subA || !subB) return 0;
      const catA = CATEGORIES.findIndex((c) => c.id === subA.parentCategory);
      const catB = CATEGORIES.findIndex((c) => c.id === subB.parentCategory);
      if (catA !== catB) return catA - catB;
      return subcategories.indexOf(subA) - subcategories.indexOf(subB);
    });

  const forSizes = byCategory.filter((p) => {
    if (filterType && p.subcategory !== filterType) return false;
    if (filterColor && !p.tags?.includes(filterColor)) return false;
    return true;
  });
  const availableSizes = [...new Set(forSizes.map((p) => p.size).filter(Boolean))].sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));

  const forColors = byCategory.filter((p) => {
    if (filterType && p.subcategory !== filterType) return false;
    if (filterSizes.length > 0 && !filterSizes.includes(p.size)) return false;
    return true;
  });
  const availableColorIds = [...new Set(forColors.flatMap((p) => p.tags ?? []))]
    .filter(id => getColor(id))
    .sort((a, b) => colorOrder.indexOf(a) - colorOrder.indexOf(b));

  // Apply filters
  const filtered = byCategory.filter((p) => {
    if (filterType && p.subcategory !== filterType) return false;
    if (filterSizes.length > 0 && !filterSizes.includes(p.size)) return false;
    if (filterColor && !p.tags?.includes(filterColor)) return false;
    return true;
  });

  const hasFilters = !isDrops && activeCategory !== 'ete' && (availableTypeIds.length > 0 || availableColorIds.length > 0);
  const hasSizeFilter = !isDrops && availableSizes.length > 0;

  const season = activeCategory === 'ete' ? getCurrentSeason() : null;

  const dropsPool = isDrops ? filtered.slice(0, DROPS_MAX) : [];
  const canPrev = dropsIndex > 0;
  const canNext = dropsIndex + DROPS_VISIBLE < dropsPool.length;

  return (
    <div className={styles.overlay}>
      <div className={isDrops ? styles.panelOpen : styles.panel} ref={panelRef}>

        {activeCategory === 'ete' && (
          <p className={styles.eteLead}>SUMMER</p>
        )}

        {hasSizeFilter && (
          <div className={styles.filterSizesFloat}>
            {availableSizes.map((size) => (
              <button
                key={size}
                className={`${styles.filterSizeTag} ${filterSizes.includes(size) ? styles.filterSizeTagActive : ''}`}
                onClick={() => setFilterSizes(filterSizes.includes(size) ? filterSizes.filter(s => s !== size) : [...filterSizes, size])}
              >{size}</button>
            ))}
          </div>
        )}

        {hasFilters && (
          <div className={styles.filterBar}>
            <div className={styles.filterLeft}>
              {availableTypeIds.map((id, i) => {
                const sub = subcategories.find((s) => s.id === id);
                if (!sub) return null;
                return (
                  <span key={id} className={styles.filterRow}>
                    {i > 0 && <span className={styles.filterSep}>—</span>}
                    <button
                      className={`${styles.filterItem} ${filterType === id ? styles.filterItemActive : ''}`}
                      onClick={() => setFilterType(filterType === id ? null : id)}
                    >{sub.label}</button>
                  </span>
                );
              })}
            </div>
            {availableColorIds.length > 0 && (
              <div className={styles.filterColors}>
                {availableColorIds.map((id) => {
                  const color = getColor(id);
                  if (!color) return null;
                  return (
                    <button
                      key={id}
                      title={color.label}
                      className={`${styles.filterColorDot} ${filterColor === id ? styles.filterColorDotActive : ''}`}
                      style={{ background: color.bg }}
                      onClick={() => setFilterColor(filterColor === id ? null : id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className={styles.empty}>
            {lang === 'fr' ? "Il n'y a pas encore de pièces dans cette catégorie — Reviens plus tard <3" : 'No pieces in this category yet... Check back soon <3'}
          </p>
        ) : isDrops ? (
          <div className={styles.carousel}>
            <button className={styles.carouselArrow} style={{ visibility: canPrev ? 'visible' : 'hidden' }} onClick={() => scrollTo(Math.max(0, dropsIndex - 1))}>‹</button>
            <div className={styles.carouselClip}>
            <div className={styles.carouselWindow} ref={carouselWindowRef}>
              <div className={styles.carouselTrack}>
                {dropsPool.map((product) => (
                  <div key={product.id} className={styles.carouselItem}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
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
        {showScrollTop && !isDrops && (
          <button className={styles.scrollTop} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>
        )}
      </div>
    </div>
  );
}
