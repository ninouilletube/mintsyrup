import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

export async function getData(key: string) {
  const { data } = await supabase.from('mint_data').select('value').eq('key', key).single();
  return data?.value ?? null;
}

export async function setData(key: string, value: unknown) {
  const { error } = await supabase
    .from('mint_data')
    .upsert({ key, value }, { onConflict: 'key' });
  if (error) console.error('[setData]', key, error.message);
}

export async function trackVisit() {
  const existing = (await getData('analytics') as { total: number; days: Record<string, number> } | null) || { total: 0, days: {} };
  const today = new Date().toISOString().split('T')[0];
  await setData('analytics', {
    total: (existing.total || 0) + 1,
    days: { ...existing.days, [today]: (existing.days[today] || 0) + 1 },
  });
}

export async function trackArticleView(productId: number) {
  const stats = (await getData('article_stats') as Record<string, { views: number; vinted: number }> | null) || {};
  const key = String(productId);
  const current = stats[key] || { views: 0, vinted: 0 };
  await setData('article_stats', { ...stats, [key]: { ...current, views: (current.views || 0) + 1 } });
}

export async function trackVintedClick(productId: number) {
  const stats = (await getData('article_stats') as Record<string, { views: number; vinted: number }> | null) || {};
  const key = String(productId);
  const current = stats[key] || { views: 0, vinted: 0 };
  await setData('article_stats', { ...stats, [key]: { ...current, vinted: (current.vinted || 0) + 1 } });
}

export async function uploadPostitImage(file: File, selectionId: string): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const path = `postits/${selectionId}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('mint-assets').upload(path, file);
  if (error) { console.error('[uploadPostitImage]', error.message); return null; }
  const { data } = supabase.storage.from('mint-assets').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadSpecialPostit(file: File, key: 'summer' | 'coeur'): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const path = `postits/special-${key}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('mint-assets').upload(path, file);
  if (error) { console.error('[uploadSpecialPostit]', error.message); return null; }
  const { data } = supabase.storage.from('mint-assets').getPublicUrl(path);
  return data.publicUrl;
}
