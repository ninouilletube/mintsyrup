'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useLang } from '@/context/LangContext';
import { useShop } from '@/context/ShopContext';
import { useProducts } from '@/context/ProductsContext';
import { useSubcategories } from '@/context/SubcategoriesContext';
import { COLORS, getColor } from '@/data/colors';
import { getCurrentSeason, SEASON_TO_ID, type SeasonKey } from '@/lib/season';
import type { Season } from '@/data/products';
import ProductCard from './ProductCard';
import styles from './ProductGrid.module.css';

const SEASON_LABEL: Record<SeasonKey, string> = {
  summer: 'SUMMER', autumn: 'AUTUMN', winter: 'WINTER', spring: 'SPRING',
};
const SEASON_COLOR: Record<SeasonKey, string> = {
  summer: '#F0A020', autumn: '#E8621A', winter: '#C87870', spring: '#C83A20',
};
const SEASON_FR: Record<Season, string> = {
  printemps: 'Printemps', ete: 'Été', automne: 'Automne', hiver: 'Hiver',
};

export default function ProductGrid() {
  const { lang } = useLang();
  const { activeCategory } = useShop();
  const { products } = useProducts();
  const { subcategories } = useSubcategories();

  const [filterSizes, setFilterSizes] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterSeasons, setFilterSeasons] = useState<Season[]>([]);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
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
  const filterBarRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!openGroup) return;
    const handle = (e: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [openGroup]);

  const toggleGroup = (key: string) => setOpenGroup((prev) => prev === key ? null : key);

  if (activeCategory === null) return null;

  const isDrops = activeCategory === 'drops';

  const visible = products.filter((p) => !p.hidden);

  const byCategory = isDrops
    ? [...visible].sort((a, b) => b.id - a.id)
    : activeCategory === 'ete'
      ? visible.filter((p) => p.seasons?.includes(SEASON_TO_ID[getCurrentSeason()]))
      : visible.filter((p) => p.categories.includes(activeCategory));

  // Available filter options from the current category
  const SIZE_ORDER = ['XXS','XS','XS/S','S','S/M','M','M/L','L','L/XL','XL','XXL'];
  const sizeRank = (s: string) => {
    const letter = s.split(/[\s/]/)[0].toUpperCase();
    const idx = SIZE_ORDER.indexOf(letter);
    if (idx !== -1) return idx * 100;
    const num = parseInt(s.match(/\d+/)?.[0] ?? '9999');
    return 500 + num;
  };
  const availableSizes = [...new Set(byCategory.map((p) => p.size).filter(Boolean))].sort((a, b) => sizeRank(a) - sizeRank(b));
  const availableTagIds = [...new Set(byCategory.flatMap((p) => p.tags ?? []))];
  const SEASON_CYCLE: Season[] = ['ete', 'automne', 'hiver', 'printemps'];
  const currentSeasonId = SEASON_TO_ID[getCurrentSeason()];
  const startIdx = SEASON_CYCLE.indexOf(currentSeasonId);
  const SEASON_ORDER = [...SEASON_CYCLE.slice(startIdx), ...SEASON_CYCLE.slice(0, startIdx)];
  const availableSeasons = ([...new Set(byCategory.flatMap((p) => p.seasons ?? []))] as Season[])
    .sort((a, b) => SEASON_ORDER.indexOf(a) - SEASON_ORDER.indexOf(b));

  // Sous-catégories disponibles dans la sélection courante
  const availableTypeIds = [...new Set(byCategory.map((p) => p.subcategory).filter(Boolean))] as string[];

  // Apply filters
  const filtered = byCategory.filter((p) => {
    if (filterSizes.length > 0 && !filterSizes.includes(p.size)) return false;
    if (filterTags.length > 0 && !filterTags.some((id) => p.tags?.includes(id))) return false;
    if (filterSeasons.length > 0 && !filterSeasons.some((s) => p.seasons?.includes(s))) return false;
    if (filterTypes.length > 0 && !filterTypes.includes(p.subcategory ?? '')) return false;
    return true;
  });

  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const isSeason = activeCategory === 'ete';
  const hasFilters = !isDrops && (availableSizes.length > 0 || availableTagIds.length > 0 || availableTypeIds.length > 0 || (!isSeason && availableSeasons.length > 0));
  const activeFiltersCount = filterSizes.length + filterTags.length + filterSeasons.length + filterTypes.length;

  const season = activeCategory === 'ete' ? getCurrentSeason() : null;

  const dropsPool = isDrops ? filtered.slice(0, DROPS_MAX) : [];
  const canPrev = dropsIndex > 0;
  const canNext = dropsIndex + DROPS_VISIBLE < dropsPool.length;

  return (
    <div className={styles.overlay}>
      <div className={isDrops ? styles.panelOpen : styles.panel} ref={panelRef}>

        {hasFilters && (
          <div className={styles.filterBar} ref={filterBarRef}>
            {availableSizes.length > 0 && (
              <div className={styles.filterGroup}>
                <button className={`${styles.filterToggle} ${filterSizes.length > 0 ? styles.filterToggleActive : ''}`} onClick={() => toggleGroup('size')}>
                  Taille {filterSizes.length > 0 && <span className={styles.filterBadge}>{filterSizes.length}</span>} <span className={styles.filterCaret}>{openGroup === 'size' ? '▲' : '▼'}</span>
                </button>
                {openGroup === 'size' && (
                  <div className={styles.filterChips}>
                    {availableSizes.map((size) => (
                      <button key={size} className={`${styles.chipSize} ${filterSizes.includes(size) ? styles.chipSizeActive : ''}`} onClick={() => setFilterSizes(toggle(filterSizes, size))}>{size}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {availableTagIds.length > 0 && (
              <div className={styles.filterGroup}>
                <button className={`${styles.filterToggle} ${filterTags.length > 0 ? styles.filterToggleActive : ''}`} onClick={() => toggleGroup('color')}>
                  Couleur {filterTags.length > 0 && <span className={styles.filterBadge}>{filterTags.length}</span>} <span className={styles.filterCaret}>{openGroup === 'color' ? '▲' : '▼'}</span>
                </button>
                {openGroup === 'color' && (
                  <div className={styles.filterChips}>
                    {availableTagIds.map((id) => {
                      const color = getColor(id);
                      if (!color) return null;
                      return (
                        <button key={id} className={`${styles.colorDot} ${filterTags.includes(id) ? styles.colorDotActive : ''}`} style={{ background: color.bg }} title={color.label} onClick={() => setFilterTags(toggle(filterTags, id))} />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {availableTypeIds.length > 0 && (
              <div className={styles.filterGroup}>
                <button className={`${styles.filterToggle} ${filterTypes.length > 0 ? styles.filterToggleActive : ''}`} onClick={() => toggleGroup('type')}>
                  Type {filterTypes.length > 0 && <span className={styles.filterBadge}>{filterTypes.length}</span>} <span className={styles.filterCaret}>{openGroup === 'type' ? '▲' : '▼'}</span>
                </button>
                {openGroup === 'type' && (
                  <div className={styles.filterChips}>
                    {availableTypeIds.map((id) => {
                      const sub = subcategories.find((s) => s.id === id);
                      if (!sub) return null;
                      return (
                        <button key={id} className={`${styles.chip} ${filterTypes.includes(id) ? styles.chipActive : ''}`} onClick={() => setFilterTypes(toggle(filterTypes, id))}>{sub.label}</button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {!isSeason && availableSeasons.length > 0 && (
              <div className={styles.filterGroup}>
                <button className={`${styles.filterToggle} ${filterSeasons.length > 0 ? styles.filterToggleActive : ''}`} onClick={() => toggleGroup('season')}>
                  Saison {filterSeasons.length > 0 && <span className={styles.filterBadge}>{filterSeasons.length}</span>} <span className={styles.filterCaret}>{openGroup === 'season' ? '▲' : '▼'}</span>
                </button>
                {openGroup === 'season' && (
                  <div className={styles.filterChips}>
                    {availableSeasons.map((s) => (
                      <button key={s} className={`${styles.chipSize} ${filterSeasons.includes(s) ? styles.chipSizeActive : ''}`} onClick={() => setFilterSeasons(toggle(filterSeasons, s))}>{SEASON_FR[s]}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeFiltersCount > 0 && (
              <button className={styles.clearFilters} onClick={() => { setFilterSizes([]); setFilterTags([]); setFilterSeasons([]); setFilterTypes([]); setOpenGroup(null); }}>
                Effacer
              </button>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className={styles.empty}>
            {activeFiltersCount > 0
              ? (lang === 'fr' ? 'Aucune pièce pour ces filtres — essaie une autre combinaison <3' : 'No pieces for these filters — try another combo <3')
              : (lang === 'fr' ? "Il n'y a pas encore de pièces dans cette catégorie — Reviens plus tard <3" : 'No pieces in this category yet... Check back soon <3')}
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
