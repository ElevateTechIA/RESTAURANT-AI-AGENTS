import { getAdminDb } from './admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface Reservation {
  id: string;
  restaurantId: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: Timestamp;
  time: string;
  partySize: number;
  tableId: string | null;
  status: ReservationStatus;
  specialRequests: string | null;
  notes: string | null;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  confirmedAt: Timestamp | null;
  completedAt: Timestamp | null;
}

const COLLECTION = 'reservations';

/**
 * Create a new reservation
 */
export async function createReservation(
  reservationData: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'confirmedAt' | 'completedAt'>
): Promise<Reservation> {
  const db = getAdminDb();
  const docRef = db.collection(COLLECTION).doc();

  const reservation: Reservation = {
    ...reservationData,
    id: docRef.id,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    confirmedAt: null,
    completedAt: null,
  };

  await docRef.set(reservation);
  return reservation;
}

/**
 * Get reservation by ID
 */
export async function getReservationById(reservationId: string): Promise<Reservation | null> {
  const db = getAdminDb();
  const doc = await db.collection(COLLECTION).doc(reservationId).get();
  return doc.exists ? (doc.data() as Reservation) : null;
}

/**
 * Get reservations for a customer
 */
export async function getCustomerReservations(
  customerId: string,
  limit: number = 20
): Promise<Reservation[]> {
  const db = getAdminDb();
  const snapshot = await db
    .collection(COLLECTION)
    .where('customerId', '==', customerId)
    .orderBy('date', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => doc.data() as Reservation);
}

/**
 * Get reservations for a restaurant
 */
export async function getRestaurantReservations(
  restaurantId: string,
  options?: {
    status?: ReservationStatus[];
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<Reservation[]> {
  const db = getAdminDb();
  let query = db
    .collection(COLLECTION)
    .where('restaurantId', '==', restaurantId);

  if (options?.status && options.status.length > 0) {
    query = query.where('status', 'in', options.status);
  }

  if (options?.startDate) {
    query = query.where('date', '>=', Timestamp.fromDate(options.startDate));
  }

  if (options?.endDate) {
    query = query.where('date', '<=', Timestamp.fromDate(options.endDate));
  }

  const snapshot = await query
    .orderBy('date', 'asc')
    .limit(options?.limit || 100)
    .get();

  return snapshot.docs.map((doc) => doc.data() as Reservation);
}

/**
 * Get reservations for a specific date
 */
export async function getReservationsByDate(
  restaurantId: string,
  date: Date
): Promise<Reservation[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return getRestaurantReservations(restaurantId, {
    startDate: startOfDay,
    endDate: endOfDay,
  });
}

/**
 * Update reservation status
 */
export async function updateReservationStatus(
  reservationId: string,
  status: ReservationStatus
): Promise<void> {
  const db = getAdminDb();
  const updateData: Record<string, any> = {
    status,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (status === 'confirmed') {
    updateData.confirmedAt = FieldValue.serverTimestamp();
  } else if (status === 'completed') {
    updateData.completedAt = FieldValue.serverTimestamp();
  }

  await db.collection(COLLECTION).doc(reservationId).update(updateData);
}

/**
 * Assign table to reservation
 */
export async function assignTableToReservation(
  reservationId: string,
  tableId: string
): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTION).doc(reservationId).update({
    tableId,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Update reservation details
 */
export async function updateReservation(
  reservationId: string,
  updates: Partial<Omit<Reservation, 'id' | 'createdAt'>>
): Promise<void> {
  const db = getAdminDb();
  await db
    .collection(COLLECTION)
    .doc(reservationId)
    .update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    });
}

/**
 * Cancel reservation
 */
export async function cancelReservation(
  reservationId: string,
  reason?: string
): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTION).doc(reservationId).update({
    status: 'cancelled',
    notes: reason || null,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Get reservation statistics for a restaurant
 */
export async function getReservationStats(
  restaurantId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalReservations: number;
  confirmedReservations: number;
  cancelledReservations: number;
  completedReservations: number;
  noShowReservations: number;
  averagePartySize: number;
}> {
  const db = getAdminDb();
  const snapshot = await db
    .collection(COLLECTION)
    .where('restaurantId', '==', restaurantId)
    .where('date', '>=', Timestamp.fromDate(startDate))
    .where('date', '<=', Timestamp.fromDate(endDate))
    .get();

  const reservations = snapshot.docs.map((doc) => doc.data() as Reservation);

  const statusCounts = reservations.reduce(
    (acc, res) => {
      acc[res.status] = (acc[res.status] || 0) + 1;
      return acc;
    },
    {} as Record<ReservationStatus, number>
  );

  const totalPartySize = reservations.reduce((sum, res) => sum + res.partySize, 0);

  return {
    totalReservations: reservations.length,
    confirmedReservations: statusCounts.confirmed || 0,
    cancelledReservations: statusCounts.cancelled || 0,
    completedReservations: statusCounts.completed || 0,
    noShowReservations: statusCounts.no_show || 0,
    averagePartySize: reservations.length > 0 ? totalPartySize / reservations.length : 0,
  };
}

/**
 * Seed demo reservations for a restaurant
 */
export async function seedDemoReservations(restaurantId: string): Promise<void> {
  const db = getAdminDb();

  // Check if reservations already exist
  const existingReservations = await db
    .collection(COLLECTION)
    .where('restaurantId', '==', restaurantId)
    .limit(1)
    .get();

  if (!existingReservations.empty) {
    console.log('Reservations already exist for restaurant, skipping seed');
    return;
  }

  const now = new Date();

  const demoReservations = [
    // Upcoming reservations
    {
      customerName: 'Maria Garcia',
      customerEmail: 'maria.garcia@email.com',
      customerPhone: '+1 555-0101',
      date: Timestamp.fromDate(new Date(now.getTime() + 86400000)), // Tomorrow
      time: '19:00',
      partySize: 4,
      status: 'confirmed' as ReservationStatus,
      tableId: 'T-08',
      specialRequests: 'Birthday celebration - please prepare a cake',
    },
    {
      customerName: 'John Smith',
      customerEmail: 'john.smith@email.com',
      customerPhone: '+1 555-0102',
      date: Timestamp.fromDate(new Date(now.getTime() + 86400000)), // Tomorrow
      time: '20:30',
      partySize: 2,
      status: 'pending' as ReservationStatus,
      tableId: null,
      specialRequests: 'Window seat preferred',
    },
    {
      customerName: 'Carlos Rodriguez',
      customerEmail: 'carlos.r@email.com',
      customerPhone: '+1 555-0103',
      date: Timestamp.fromDate(new Date(now.getTime() + 86400000 * 2)), // 2 days from now
      time: '18:00',
      partySize: 6,
      status: 'confirmed' as ReservationStatus,
      tableId: 'T-12',
      specialRequests: 'Business dinner - need quiet area',
    },
    {
      customerName: 'Emily Chen',
      customerEmail: 'emily.chen@email.com',
      customerPhone: '+1 555-0104',
      date: Timestamp.fromDate(new Date(now.getTime() + 86400000 * 3)), // 3 days from now
      time: '19:30',
      partySize: 3,
      status: 'pending' as ReservationStatus,
      tableId: null,
      specialRequests: 'One guest has gluten allergy',
    },
    {
      customerName: 'Robert Wilson',
      customerEmail: 'rwilson@email.com',
      customerPhone: '+1 555-0105',
      date: Timestamp.fromDate(new Date(now.getTime() + 86400000 * 5)), // 5 days from now
      time: '20:00',
      partySize: 8,
      status: 'confirmed' as ReservationStatus,
      tableId: 'T-15',
      specialRequests: 'Anniversary dinner - champagne on arrival',
    },
    // Today's reservations
    {
      customerName: 'Ana Martinez',
      customerEmail: 'ana.m@email.com',
      customerPhone: '+1 555-0106',
      date: Timestamp.fromDate(now),
      time: '12:00',
      partySize: 2,
      status: 'completed' as ReservationStatus,
      tableId: 'T-03',
      specialRequests: null,
    },
    {
      customerName: 'Michael Brown',
      customerEmail: 'mbrown@email.com',
      customerPhone: '+1 555-0107',
      date: Timestamp.fromDate(now),
      time: '13:30',
      partySize: 4,
      status: 'completed' as ReservationStatus,
      tableId: 'T-07',
      specialRequests: 'High chair needed',
    },
    {
      customerName: 'Sophie Taylor',
      customerEmail: 'sophie.t@email.com',
      customerPhone: '+1 555-0108',
      date: Timestamp.fromDate(now),
      time: '19:00',
      partySize: 2,
      status: 'confirmed' as ReservationStatus,
      tableId: 'T-02',
      specialRequests: null,
    },
    // Past reservations
    {
      customerName: 'David Lee',
      customerEmail: 'david.lee@email.com',
      customerPhone: '+1 555-0109',
      date: Timestamp.fromDate(new Date(now.getTime() - 86400000 * 2)), // 2 days ago
      time: '20:00',
      partySize: 5,
      status: 'completed' as ReservationStatus,
      tableId: 'T-10',
      specialRequests: null,
    },
    {
      customerName: 'Jennifer Adams',
      customerEmail: 'jadams@email.com',
      customerPhone: '+1 555-0110',
      date: Timestamp.fromDate(new Date(now.getTime() - 86400000 * 3)), // 3 days ago
      time: '19:30',
      partySize: 2,
      status: 'cancelled' as ReservationStatus,
      tableId: null,
      specialRequests: 'Cancelled due to travel delay',
    },
    {
      customerName: 'Thomas Anderson',
      customerEmail: 'tanderson@email.com',
      customerPhone: '+1 555-0111',
      date: Timestamp.fromDate(new Date(now.getTime() - 86400000 * 5)), // 5 days ago
      time: '18:30',
      partySize: 4,
      status: 'no_show' as ReservationStatus,
      tableId: 'T-05',
      specialRequests: null,
    },
  ];

  const batch = db.batch();

  for (const reservation of demoReservations) {
    const docRef = db.collection(COLLECTION).doc();
    batch.set(docRef, {
      ...reservation,
      id: docRef.id,
      restaurantId,
      customerId: null,
      notes: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      confirmedAt: reservation.status === 'confirmed' || reservation.status === 'completed'
        ? FieldValue.serverTimestamp()
        : null,
      completedAt: reservation.status === 'completed'
        ? FieldValue.serverTimestamp()
        : null,
    });
  }

  await batch.commit();
  console.log(`Seeded demo reservations for restaurant ${restaurantId}`);
}
