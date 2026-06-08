import type { Category } from './products';

export type Subcategory = {
  id: string;
  label: string;
  parentCategory: Category;
};
