import type { Season } from '@/data/products';

export type SeasonKey = 'summer' | 'autumn' | 'winter' | 'spring';

export function getCurrentSeason(): SeasonKey {
  const month = new Date().getMonth() + 1;
  if (month >= 6 && month <= 8)   return 'summer';
  if (month >= 9 && month <= 11)  return 'autumn';
  if (month === 12 || month <= 2) return 'winter';
  return 'spring';
}

export const SEASON_TO_ID: Record<SeasonKey, Season> = {
  summer: 'ete',
  autumn: 'automne',
  winter: 'hiver',
  spring: 'printemps',
};
