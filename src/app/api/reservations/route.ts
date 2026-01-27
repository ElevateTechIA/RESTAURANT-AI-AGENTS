import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import {
  createReservation,
  getCustomerReservations,
  getRestaurantReservations,
  getReservationsByDate,
  updateReservationStatus,
  assignTableToReservation,
  cancelReservation,
  getReservationStats,
  Reservation,
  ReservationStatus,
} from '@/lib/firebase/reservations';

// POST - Create a new reservation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      restaurantId,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      date,
      time,
      partySize,
      specialRequests,
    } = body;

    // Validate required fields
    if (!restaurantId || !customerName || !customerEmail || !date || !time || !partySize) {
      return NextResponse.json(
        { error: 'Missing required fields: restaurantId, customerName, customerEmail, date, time, partySize' },
        { status: 400 }
      );
    }

    // Create the reservation
    const reservation = await createReservation({
      restaurantId,
      customerId: customerId || null,
      customerName,
      customerEmail,
      customerPhone: customerPhone || '',
      date: Timestamp.fromDate(new Date(date)),
      time,
      partySize: parseInt(partySize),
      tableId: null,
      status: 'pending',
      specialRequests: specialRequests || null,
      notes: null,
    });

    return NextResponse.json({
      success: true,
      reservation: {
        id: reservation.id,
        date: reservation.date,
        time: reservation.time,
        partySize: reservation.partySize,
        status: reservation.status,
        specialRequests: reservation.specialRequests,
      },
      message: 'Reservation created successfully',
    });
  } catch (error: any) {
    console.error('Create reservation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create reservation' },
      { status: 500 }
    );
  }
}

// GET - Get reservations (for customer or restaurant)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const restaurantId = searchParams.get('restaurantId');
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');

    let reservations: Reservation[] = [];

    if (customerId) {
      // Get reservations for customer
      reservations = await getCustomerReservations(customerId, limit);
    } else if (restaurantId) {
      if (date) {
        // Get reservations for a specific date
        reservations = await getReservationsByDate(restaurantId, new Date(date));
      } else {
        // Get all restaurant reservations with optional filters
        const statusArray = status ? status.split(',') as ReservationStatus[] : undefined;
        reservations = await getRestaurantReservations(restaurantId, {
          status: statusArray,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          limit,
        });
      }
    } else {
      return NextResponse.json(
        { error: 'Must provide customerId or restaurantId' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      reservations: reservations.map((res) => ({
        id: res.id,
        restaurantId: res.restaurantId,
        customerId: res.customerId,
        customerName: res.customerName,
        customerEmail: res.customerEmail,
        customerPhone: res.customerPhone,
        date: res.date,
        time: res.time,
        partySize: res.partySize,
        tableId: res.tableId,
        status: res.status,
        specialRequests: res.specialRequests,
        notes: res.notes,
        createdAt: res.createdAt,
        updatedAt: res.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error('Get reservations error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get reservations' },
      { status: 500 }
    );
  }
}

// PATCH - Update reservation (status, table assignment, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservationId, action, ...data } = body;

    if (!reservationId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: reservationId, action' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'updateStatus':
        if (!data.status) {
          return NextResponse.json(
            { error: 'Missing status field' },
            { status: 400 }
          );
        }
        await updateReservationStatus(reservationId, data.status);
        break;

      case 'assignTable':
        if (!data.tableId) {
          return NextResponse.json(
            { error: 'Missing tableId field' },
            { status: 400 }
          );
        }
        await assignTableToReservation(reservationId, data.tableId);
        break;

      case 'cancel':
        await cancelReservation(reservationId, data.reason);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Reservation ${action} successful`,
    });
  } catch (error: any) {
    console.error('Update reservation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update reservation' },
      { status: 500 }
    );
  }
}
