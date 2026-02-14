import { getAdminDb } from './admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: { en: string; es: string };
  description: { en: string; es: string };
  price: number;
  imageUrl: string | null;
  allergens: string[];
  dietaryFlags: string[];
  preparationTime: number;
  calories: number | null;
  ingredients: string[];
  availability: {
    isAvailable: boolean;
    stockCount: number | null;
  };
  modifiers: Array<{
    id: string;
    name: { en: string; es: string };
    price: number;
    isRequired: boolean;
  }>;
  sortOrder: number;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: { en: string; es: string };
  description: { en: string; es: string };
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

const ITEMS_COLLECTION = 'menuItems';
const CATEGORIES_COLLECTION = 'menuCategories';

/**
 * Get all categories for a restaurant
 */
export async function getMenuCategories(restaurantId: string): Promise<MenuCategory[]> {
  const db = getAdminDb();
  const snapshot = await db
    .collection(CATEGORIES_COLLECTION)
    .where('restaurantId', '==', restaurantId)
    .where('isActive', '==', true)
    .orderBy('sortOrder', 'asc')
    .get();

  return snapshot.docs.map((doc) => doc.data() as MenuCategory);
}

/**
 * Get all menu items for a restaurant
 */
export async function getMenuItems(
  restaurantId: string,
  categoryId?: string
): Promise<MenuItem[]> {
  const db = getAdminDb();
  let query = db
    .collection(ITEMS_COLLECTION)
    .where('restaurantId', '==', restaurantId);

  if (categoryId) {
    query = query.where('categoryId', '==', categoryId);
  }

  const snapshot = await query.orderBy('sortOrder', 'asc').get();
  return snapshot.docs.map((doc) => doc.data() as MenuItem);
}

/**
 * Get available menu items only
 */
export async function getAvailableMenuItems(
  restaurantId: string,
  categoryId?: string
): Promise<MenuItem[]> {
  const items = await getMenuItems(restaurantId, categoryId);
  return items.filter((item) => item.availability.isAvailable);
}

/**
 * Get a single menu item by ID
 */
export async function getMenuItem(itemId: string): Promise<MenuItem | null> {
  const db = getAdminDb();
  const doc = await db.collection(ITEMS_COLLECTION).doc(itemId).get();
  return doc.exists ? (doc.data() as MenuItem) : null;
}

/**
 * Create a new menu item
 */
export async function createMenuItem(
  itemData: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<MenuItem> {
  const db = getAdminDb();
  const docRef = db.collection(ITEMS_COLLECTION).doc();

  const item: MenuItem = {
    ...itemData,
    id: docRef.id,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await docRef.set(item);
  return item;
}

/**
 * Update a menu item
 */
export async function updateMenuItem(
  itemId: string,
  updates: Partial<Omit<MenuItem, 'id' | 'createdAt'>>
): Promise<void> {
  const db = getAdminDb();
  await db
    .collection(ITEMS_COLLECTION)
    .doc(itemId)
    .update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    });
}

/**
 * Update menu item availability
 */
export async function updateMenuItemAvailability(
  itemId: string,
  isAvailable: boolean,
  stockCount?: number
): Promise<void> {
  const db = getAdminDb();
  await db
    .collection(ITEMS_COLLECTION)
    .doc(itemId)
    .update({
      availability: {
        isAvailable,
        stockCount: stockCount ?? null,
      },
      updatedAt: FieldValue.serverTimestamp(),
    });
}

/**
 * Delete a menu item
 */
export async function deleteMenuItem(itemId: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(ITEMS_COLLECTION).doc(itemId).delete();
}

/**
 * Create a new category
 */
export async function createMenuCategory(
  categoryData: Omit<MenuCategory, 'id' | 'createdAt' | 'updatedAt'>
): Promise<MenuCategory> {
  const db = getAdminDb();
  const docRef = db.collection(CATEGORIES_COLLECTION).doc();

  const category: MenuCategory = {
    ...categoryData,
    id: docRef.id,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await docRef.set(category);
  return category;
}

/**
 * Update a category
 */
export async function updateMenuCategory(
  categoryId: string,
  updates: Partial<Omit<MenuCategory, 'id' | 'createdAt'>>
): Promise<void> {
  const db = getAdminDb();
  await db
    .collection(CATEGORIES_COLLECTION)
    .doc(categoryId)
    .update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    });
}

/**
 * Delete a category
 */
export async function deleteMenuCategory(categoryId: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(CATEGORIES_COLLECTION).doc(categoryId).delete();
}

/**
 * Seed demo menu data for a restaurant
 */
export async function seedDemoMenu(restaurantId: string): Promise<void> {
  const db = getAdminDb();

  // Check if menu already exists
  const existingItems = await db
    .collection(ITEMS_COLLECTION)
    .where('restaurantId', '==', restaurantId)
    .limit(1)
    .get();

  if (!existingItems.empty) {
    console.log('Menu already exists for restaurant, skipping seed');
    return;
  }

  // Create categories
  const categories = [
    {
      id: 'starters',
      name: { en: 'Starters', es: 'Entradas' },
      description: { en: 'Begin your meal', es: 'Comienza tu comida' },
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
      sortOrder: 1,
    },
    {
      id: 'mains',
      name: { en: 'Main Courses', es: 'Platos Principales' },
      description: { en: 'Our signature dishes', es: 'Nuestros platos insignia' },
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
      sortOrder: 2,
    },
    {
      id: 'desserts',
      name: { en: 'Desserts', es: 'Postres' },
      description: { en: 'Sweet endings', es: 'Dulces finales' },
      imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop',
      sortOrder: 3,
    },
    {
      id: 'drinks',
      name: { en: 'Beverages', es: 'Bebidas' },
      description: { en: 'Refresh yourself', es: 'Refrescate' },
      imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop',
      sortOrder: 4,
    },
  ];

  const menuItems = [
    {
      categoryId: 'starters',
      name: { en: 'Caesar Salad', es: 'Ensalada Cesar' },
      description: {
        en: 'Fresh romaine lettuce with parmesan and croutons',
        es: 'Lechuga romana fresca con parmesano y crutones',
      },
      price: 12.99,
      allergens: ['gluten', 'dairy'],
      dietaryFlags: ['vegetarian'],
      preparationTime: 10,
      ingredients: ['romaine lettuce', 'parmesan', 'croutons', 'caesar dressing'],
      imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop',
      sortOrder: 1,
    },
    {
      categoryId: 'starters',
      name: { en: 'Tomato Soup', es: 'Sopa de Tomate' },
      description: {
        en: 'Homemade tomato soup with fresh basil',
        es: 'Sopa de tomate casera con albahaca fresca',
      },
      price: 8.99,
      allergens: [],
      dietaryFlags: ['vegetarian', 'vegan', 'gluten-free'],
      preparationTime: 5,
      ingredients: ['tomatoes', 'basil', 'garlic', 'olive oil'],
      imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744aec?w=400&h=300&fit=crop',
      sortOrder: 2,
    },
    {
      categoryId: 'mains',
      name: { en: 'Grilled Salmon', es: 'Salmon a la Parrilla' },
      description: {
        en: 'Atlantic salmon with lemon butter sauce and vegetables',
        es: 'Salmon del Atlantico con salsa de limon y vegetales',
      },
      price: 24.99,
      allergens: ['fish'],
      dietaryFlags: ['gluten-free'],
      preparationTime: 20,
      ingredients: ['salmon', 'lemon', 'butter', 'seasonal vegetables'],
      imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
      sortOrder: 1,
    },
    {
      categoryId: 'mains',
      name: { en: 'Pasta Primavera', es: 'Pasta Primavera' },
      description: {
        en: 'Fresh pasta with seasonal vegetables in garlic sauce',
        es: 'Pasta fresca con vegetales de temporada en salsa de ajo',
      },
      price: 18.99,
      allergens: ['gluten', 'dairy'],
      dietaryFlags: ['vegetarian'],
      preparationTime: 15,
      ingredients: ['pasta', 'zucchini', 'peppers', 'garlic', 'parmesan'],
      imageUrl: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&h=300&fit=crop',
      sortOrder: 2,
    },
    {
      categoryId: 'mains',
      name: { en: 'Ribeye Steak', es: 'Bistec Ribeye' },
      description: {
        en: '12oz prime ribeye with garlic mashed potatoes',
        es: 'Ribeye premium de 12oz con pure de papas al ajo',
      },
      price: 34.99,
      allergens: ['dairy'],
      dietaryFlags: ['gluten-free'],
      preparationTime: 25,
      ingredients: ['ribeye', 'potatoes', 'garlic', 'butter', 'herbs'],
      imageUrl: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=300&fit=crop',
      sortOrder: 3,
    },
    {
      categoryId: 'desserts',
      name: { en: 'Chocolate Cake', es: 'Pastel de Chocolate' },
      description: {
        en: 'Rich chocolate cake with vanilla ice cream',
        es: 'Pastel de chocolate con helado de vainilla',
      },
      price: 9.99,
      allergens: ['gluten', 'dairy', 'eggs'],
      dietaryFlags: ['vegetarian'],
      preparationTime: 5,
      ingredients: ['chocolate', 'flour', 'eggs', 'vanilla ice cream'],
      sortOrder: 1,
    },
    {
      categoryId: 'desserts',
      name: { en: 'Tiramisu', es: 'Tiramisu' },
      description: {
        en: 'Classic Italian dessert with espresso and mascarpone',
        es: 'Postre italiano clasico con espresso y mascarpone',
      },
      price: 10.99,
      allergens: ['gluten', 'dairy', 'eggs'],
      dietaryFlags: ['vegetarian'],
      preparationTime: 5,
      ingredients: ['ladyfingers', 'mascarpone', 'espresso', 'cocoa'],
      sortOrder: 2,
    },
    {
      categoryId: 'drinks',
      name: { en: 'Fresh Lemonade', es: 'Limonada Fresca' },
      description: {
        en: 'Freshly squeezed lemonade with mint',
        es: 'Limonada recien exprimida con menta',
      },
      price: 4.99,
      allergens: [],
      dietaryFlags: ['vegan', 'gluten-free'],
      preparationTime: 3,
      ingredients: ['lemon', 'sugar', 'mint', 'water'],
      sortOrder: 1,
    },
    {
      categoryId: 'drinks',
      name: { en: 'Iced Tea', es: 'Te Helado' },
      description: {
        en: 'House-brewed black tea over ice',
        es: 'Te negro casero con hielo',
      },
      price: 3.99,
      allergens: [],
      dietaryFlags: ['vegan', 'gluten-free'],
      preparationTime: 2,
      ingredients: ['black tea', 'ice', 'lemon'],
      sortOrder: 2,
    },
    {
      categoryId: 'drinks',
      name: { en: 'Cappuccino', es: 'Capuchino' },
      description: {
        en: 'Espresso with steamed milk foam',
        es: 'Espresso con espuma de leche',
      },
      price: 5.99,
      allergens: ['dairy'],
      dietaryFlags: ['vegetarian', 'gluten-free'],
      preparationTime: 5,
      ingredients: ['espresso', 'milk'],
      sortOrder: 3,
    },
  ];

  const batch = db.batch();

  // Create categories
  for (const cat of categories) {
    const catRef = db.collection(CATEGORIES_COLLECTION).doc(cat.id);
    batch.set(catRef, {
      ...cat,
      restaurantId,
      imageUrl: null,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  // Create menu items
  for (const item of menuItems) {
    const itemRef = db.collection(ITEMS_COLLECTION).doc();
    batch.set(itemRef, {
      ...item,
      id: itemRef.id,
      restaurantId,
      imageUrl: null,
      calories: null,
      availability: { isAvailable: true, stockCount: null },
      modifiers: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  console.log(`Seeded demo menu for restaurant ${restaurantId}`);
}
