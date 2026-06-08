'use client';

import { useEffect } from 'react';
import { trackVisit } from '@/lib/supabase';

export default function VisitTracker() {
  useEffect(() => {
    if (window.location.pathname.startsWith('/admin')) return;
    const key = 'ms_visited_' + new Date().toISOString().split('T')[0];
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    trackVisit();
  }, []);
  return null;
}
