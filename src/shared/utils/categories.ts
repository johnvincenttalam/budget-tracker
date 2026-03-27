import { DEFAULT_CATEGORIES } from '../types';
import type { CustomCategory } from '../types';

export function getAllCategories(customCategories: CustomCategory[]): string[] {
  return [...DEFAULT_CATEGORIES, ...customCategories.map((c) => c.name)];
}

export function getCategoryIconName(
  category: string,
  customCategories: CustomCategory[]
): string {
  if ((DEFAULT_CATEGORIES as readonly string[]).includes(category)) return category;
  const custom = customCategories.find((c) => c.name === category);
  return custom?.icon ?? 'Other';
}
