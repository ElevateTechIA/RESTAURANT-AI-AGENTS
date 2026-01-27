import { NextRequest, NextResponse } from 'next/server';
import { seedDemoMenu } from '@/lib/firebase/menu';
import { seedDemoReservations } from '@/lib/firebase/reservations';

const RESTAURANT_ID = 'demo_restaurant';

// POST - Seed initial data for testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { type = 'all' } = body;

    const results: Record<string, string> = {};

    if (type === 'all' || type === 'menu') {
      await seedDemoMenu(RESTAURANT_ID);
      results.menu = 'Menu seeded successfully';
    }

    if (type === 'all' || type === 'reservations') {
      await seedDemoReservations(RESTAURANT_ID);
      results.reservations = 'Reservations seeded successfully';
    }

    return NextResponse.json({
      success: true,
      message: 'Data seeded successfully',
      results,
      restaurantId: RESTAURANT_ID,
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed data' },
      { status: 500 }
    );
  }
}

// GET - Check if data exists
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      message: 'Use POST to seed data. Body options: { type: "all" | "menu" | "reservations" }',
      restaurantId: RESTAURANT_ID,
    });
  } catch (error: any) {
    console.error('Seed check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check data' },
      { status: 500 }
    );
  }
}
