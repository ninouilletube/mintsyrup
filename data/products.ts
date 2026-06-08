export type Category = 'drops' | 'hauts' | 'bas' | 'manteaux' | 'chaussures' | 'accessoires' | 'ete';

export type Product = {
  id: number;
  brand: string | null;
  title: { fr: string; en: string };
  size: string;
  price: number;
  description: { fr: string; en: string };
  vintedUrl: string;
  image: string | null;
  images?: string[];
  placeholder: [string, string];
  categories: Category[];
  subcategory?: string;
  seasons?: Season[];
  tags?: string[];
  hidden?: boolean;
};

export type Season = 'printemps' | 'ete' | 'automne' | 'hiver';

export const products: Product[] = [];
