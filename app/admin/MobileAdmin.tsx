'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useProducts } from '@/context/ProductsContext';
import type { Product } from '@/data/products';
import styles from './MobileAdmin.module.css';

export default function MobileAdmin() {
  const { products, updateProduct, deleteProduct } = useProducts();
  const [selected, setSelected] = useState<Product | null>(null);
  const [soldMode, setSoldMode] = useState(false);
  const [soldPrice, setSoldPrice] = useState('');

  const open = (p: Product) => {
    setSelected(p);
    setSoldMode(false);
    setSoldPrice(String(p.price));
  };

  const close = () => {
    setSelected(null);
    setSoldMode(false);
  };

  const doSold = () => {
    if (!selected) return;
    const sp = soldPrice ? parseFloat(soldPrice) : selected.price;
    updateProduct({ ...selected, sold: true, soldAt: Date.now(), soldPrice: sp, hidden: true });
    close();
  };

  const doHide = () => {
    if (!selected) return;
    updateProduct({ ...selected, hidden: !selected.hidden });
    close();
  };

  const doDelete = () => {
    if (!selected) return;
    if (confirm('Supprimer cet article ?')) {
      deleteProduct(selected.id);
      close();
    }
  };

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <span className={styles.headerTitle}>Mint Syrup</span>
        <a href="/" className={styles.headerBack}>← Site</a>
      </header>

      <div className={styles.grid}>
        {[...products].reverse().map((p) => (
          <button
            key={p.id}
            className={`${styles.card} ${p.hidden ? styles.cardHidden : ''} ${selected?.id === p.id ? styles.cardActive : ''}`}
            onClick={() => open(p)}
          >
            <div
              className={styles.thumb}
              style={{ background: `linear-gradient(135deg, ${p.placeholder[0]}, ${p.placeholder[1]})` }}
            >
              {p.image && (
                <Image src={p.image} alt={p.title.fr} fill sizes="25vw" style={{ objectFit: 'cover' }} />
              )}
              {p.sold && <span className={styles.badgeSold}>vendu</span>}
              {p.hidden && !p.sold && <span className={styles.badgeHidden}>masqué</span>}
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <>
          <div className={styles.overlay} onClick={close} />
          <div className={styles.drawer}>
            {/* Article info */}
            <div className={styles.drawerInfo}>
              <div
                className={styles.drawerThumb}
                style={{ background: `linear-gradient(135deg, ${selected.placeholder[0]}, ${selected.placeholder[1]})` }}
              >
                {selected.image && (
                  <Image src={selected.image} alt={selected.title.fr} fill sizes="64px" style={{ objectFit: 'cover' }} />
                )}
              </div>
              <div className={styles.drawerMeta}>
                <p className={styles.drawerTitle}>{selected.title.fr}</p>
                <p className={styles.drawerPrice}>{selected.price} €{selected.size ? ` · ${selected.size}` : ''}</p>
                {selected.sold && (
                  <p className={styles.drawerSoldNote}>Vendu{selected.soldPrice ? ` — ${selected.soldPrice} €` : ''}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            {soldMode ? (
              <div className={styles.soldForm}>
                <label className={styles.soldLabel}>Prix de vente réel (€)</label>
                <input
                  className={styles.soldInput}
                  type="number"
                  step="0.01"
                  value={soldPrice}
                  onChange={(e) => setSoldPrice(e.target.value)}
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && doSold()}
                />
                <div className={styles.soldRow}>
                  <button className={styles.btnCancel} onClick={() => setSoldMode(false)}>Annuler</button>
                  <button className={styles.btnSold} onClick={doSold}>Confirmer ✓</button>
                </div>
              </div>
            ) : (
              <div className={styles.actions}>
                {!selected.sold && (
                  <button className={styles.btnSold} onClick={() => setSoldMode(true)}>Vendu ✓</button>
                )}
                <button className={styles.btnHide} onClick={doHide}>
                  {selected.hidden ? 'Afficher' : 'Masquer'}
                </button>
                <button className={styles.btnDelete} onClick={doDelete}>Supprimer</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
