import { NextRequest, NextResponse } from 'next/server';
import {
  getMenuItems,
  getMenuCategories,
  getAvailableMenuItems,
  seedDemoMenu,
} from '@/lib/firebase/menu';

// GET - Get menu items and categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const categoryId = searchParams.get('categoryId');
    const availableOnly = searchParams.get('availableOnly') === 'true';

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID required' },
        { status: 400 }
      );
    }

    // Get categories
    const categories = await getMenuCategories(restaurantId);

    // Get items
    const items = availableOnly
      ? await getAvailableMenuItems(restaurantId, categoryId || undefined)
      : await getMenuItems(restaurantId, categoryId || undefined);

    // If no menu exists yet, seed demo data
    if (items.length === 0 && categories.length === 0) {
      await seedDemoMenu(restaurantId);
      // Fetch again after seeding
      const seededCategories = await getMenuCategories(restaurantId);
      const seededItems = await getMenuItems(restaurantId);

      return NextResponse.json({
        categories: seededCategories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          imageUrl: cat.imageUrl,
          sortOrder: cat.sortOrder,
        })),
        items: seededItems.map((item) => ({
          id: item.id,
          categoryId: item.categoryId,
          name: item.name,
          description: item.description,
          price: item.price,
          imageUrl: item.imageUrl,
          allergens: item.allergens,
          dietaryFlags: item.dietaryFlags,
          preparationTime: item.preparationTime,
          calories: item.calories,
          availability: item.availability,
          modifiers: item.modifiers,
        })),
      });
    }

    return NextResponse.json({
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        imageUrl: cat.imageUrl,
        sortOrder: cat.sortOrder,
      })),
      items: items.map((item) => ({
        id: item.id,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        allergens: item.allergens,
        dietaryFlags: item.dietaryFlags,
        preparationTime: item.preparationTime,
        calories: item.calories,
        availability: item.availability,
        modifiers: item.modifiers,
      })),
    });
  } catch (error: any) {
    console.error('Get menu error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get menu' },
      { status: 500 }
    );
  }
}
