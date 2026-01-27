import { Timestamp } from 'firebase/firestore';

export interface LocalizedString {
  en: string;
  es: string;
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: LocalizedString;
  description: LocalizedString;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  displayTimes: {
    from: string;
    to: string;
  } | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MenuItemModifierOption {
  id: string;
  name: LocalizedString;
  priceAdjustment: number;
  isDefault: boolean;
}

export interface MenuItemModifier {
  id: string;
  name: LocalizedString;
  options: MenuItemModifierOption[];
  required: boolean;
  maxSelections: number;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: LocalizedString;
  description: LocalizedString;
  price: number;
  images: string[];
  ingredients: {
    en: string[];
    es: string[];
  };
  allergens: string[];
  dietaryFlags: string[];
  calories: number | null;
  preparationTime: number;
  availability: {
    isAvailable: boolean;
    stockCount: number | null;
    availableFrom: string | null;
    availableTo: string | null;
  };
  modifiers: MenuItemModifier[];
  upsellItems: string[];
  recommendedWith: string[];
  tags: string[];
  sortOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type MenuCategoryFormData = Omit<MenuCategory, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>;
export type MenuItemFormData = Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>;

export const ALLERGENS = [
  'gluten',
  'dairy',
  'nuts',
  'peanuts',
  'soy',
  'eggs',
  'fish',
  'shellfish',
  'sesame',
  'sulfites',
] as const;

export const DIETARY_FLAGS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'keto',
  'halal',
  'kosher',
] as const;

export type Allergen = typeof ALLERGENS[number];
export type DietaryFlag = typeof DIETARY_FLAGS[number];
