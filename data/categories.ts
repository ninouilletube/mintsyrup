import type { Category } from './products';

export const CATEGORIES: { id: Category; fr: string; en: string }[] = [
  { id: 'drops',       fr: 'Derniers drops',    en: 'Latest drops'    },
  { id: 'manteaux',    fr: 'Vestes & Gilets', en: 'Jackets & Vests' },
  { id: 'hauts',       fr: 'Hauts',             en: 'Tops'            },
  { id: 'bas',         fr: 'Bas',               en: 'Bottoms'         },
  { id: 'robes',       fr: 'Robes',             en: 'Dresses'         },
  { id: 'chaussures',  fr: 'Chaussures',        en: 'Shoes'           },
  { id: 'accessoires', fr: 'Accessoires',       en: 'Accessories'     },
  { id: 'ete',         fr: 'SUMMER',            en: 'SUMMER'          },
];
