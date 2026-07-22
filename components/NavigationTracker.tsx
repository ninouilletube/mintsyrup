'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const ORIGIN_KEY = 'ms_product_origin';

export default function NavigationTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname.startsWith('/product/')) {
      sessionStorage.removeItem(ORIGIN_KEY);
    }
  }, [pathname]);

  return null;
}

export { ORIGIN_KEY };
