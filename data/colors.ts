export type ColorId = string;

export type Color = {
  id: ColorId;
  label: string;
  bg: string;
};

export const COLORS: Color[] = [
  // Neutres
  { id: 'noir',         label: 'Noir',        bg: '#1C1C1C' },
  { id: 'blanc',        label: 'Blanc',       bg: '#F5F0EB' },
  { id: 'creme',        label: 'Crème',       bg: '#E8D5B0' },
  { id: 'nude',         label: 'Nude',        bg: '#C9956A' },
  { id: 'gris',         label: 'Gris',        bg: '#A0A0A0' },
  // Chauds
  { id: 'rose',         label: 'Rose',        bg: '#E05878' },
  { id: 'rouge',        label: 'Rouge',       bg: '#C02830' },
  { id: 'bordeaux',     label: 'Bordeaux',    bg: '#6B1020' },
  { id: 'orange',       label: 'Orange',      bg: '#E8621A' },
  { id: 'jaune-beurre', label: 'Jaune beurre', bg: '#F5C842' },
  { id: 'marron',       label: 'Marron',      bg: '#6B3A28' },
  // Froids
  { id: 'pistache',     label: 'Pistache',    bg: '#C8DC90' },
  { id: 'vert-feuille', label: 'Vert feuille', bg: '#2E6840' },
  { id: 'bleu-marine',  label: 'Bleu marine', bg: '#1A2848' },
  { id: 'mint',         label: 'Mint',        bg: '#5ECEC0' },
  { id: 'bleu',         label: 'Bleu',        bg: '#5A8EC8' },
  { id: 'lavande',      label: 'Lavande',     bg: '#C4A8D4' },
  { id: 'prune',        label: 'Prune',       bg: '#4A1848' },
  // Métalliques
  { id: 'dore',    label: 'Doré',    bg: 'linear-gradient(135deg, #A07010 0%, #F5C842 35%, #E8B830 55%, #A07010 100%)' },
  { id: 'argente', label: 'Argenté', bg: 'linear-gradient(135deg, #888 0%, #E8E8E8 35%, #C8C8C8 55%, #888 100%)' },
  { id: 'bronze',  label: 'Bronze',  bg: 'linear-gradient(135deg, #6B3A20 0%, #CD8040 35%, #A86030 55%, #6B3A20 100%)' },
  {
    id: 'irise', label: 'Irisé',
    bg: 'linear-gradient(135deg, rgba(255,255,255,0.7) 38%, rgba(255,255,255,0.9) 44%, rgba(255,255,255,0.9) 56%, rgba(255,255,255,0.7) 62%), linear-gradient(135deg, #FFB3BA, #FFDFBA, #FFFFBA, #BAFFC9, #BAE1FF, #E8BAFF)',
  },
];

export function getColor(id: string): Color | undefined {
  return COLORS.find((c) => c.id === id);
}
