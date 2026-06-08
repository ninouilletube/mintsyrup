'use client';

import { useShop } from '@/context/ShopContext';

export default function PageBackground({ children }: { children: React.ReactNode }) {
  const { activeCategory } = useShop();
  const isSummer = activeCategory === 'ete';

  return (
    <div
      style={isSummer ? {
        backgroundImage: "url('/mer.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      } : {
        background: '#FAE2E8',
      }}
    >
      {children}
    </div>
  );
}
