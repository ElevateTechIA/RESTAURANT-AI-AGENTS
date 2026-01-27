'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  QueryConstraint,
  DocumentData,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import {
  Restaurant,
  Table,
  MenuItem,
  MenuCategory,
  Order,
  Reservation,
  User,
} from '@/types';

// Collection references
export const collections = {
  users: 'users',
  restaurants: 'restaurants',
  orders: 'orders',
  reservations: 'reservations',
  conversations: 'conversations',
} as const;

// Subcollection helpers
export const getMenuItemsCollection = (restaurantId: string) =>
  `restaurants/${restaurantId}/menuItems`;
export const getCategoriesCollection = (restaurantId: string) =>
  `restaurants/${restaurantId}/categories`;
export const getTablesCollection = (restaurantId: string) =>
  `restaurants/${restaurantId}/tables`;

// Generic CRUD operations
export async function createDocument<T extends DocumentData>(
  collectionPath: string,
  id: string,
  data: T
): Promise<void> {
  await setDoc(doc(db, collectionPath, id), {
    ...data,
    id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getDocument<T>(
  collectionPath: string,
  id: string
): Promise<T | null> {
  const docSnap = await getDoc(doc(db, collectionPath, id));
  return docSnap.exists() ? (docSnap.data() as T) : null;
}

export async function updateDocument<T extends DocumentData>(
  collectionPath: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  await updateDoc(doc(db, collectionPath, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocument(
  collectionPath: string,
  id: string
): Promise<void> {
  await deleteDoc(doc(db, collectionPath, id));
}

export async function queryDocuments<T>(
  collectionPath: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const q = query(collection(db, collectionPath), ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as T);
}

// Restaurant operations
export async function getRestaurant(id: string): Promise<Restaurant | null> {
  return getDocument<Restaurant>(collections.restaurants, id);
}

export async function getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const restaurants = await queryDocuments<Restaurant>(
    collections.restaurants,
    where('slug', '==', slug),
    limit(1)
  );
  return restaurants[0] || null;
}

export async function getUserRestaurants(userId: string): Promise<Restaurant[]> {
  return queryDocuments<Restaurant>(
    collections.restaurants,
    where('ownerId', '==', userId),
    orderBy('createdAt', 'desc')
  );
}

// Menu operations
export async function getMenuItems(restaurantId: string): Promise<MenuItem[]> {
  return queryDocuments<MenuItem>(
    getMenuItemsCollection(restaurantId),
    where('availability.isAvailable', '==', true),
    orderBy('sortOrder', 'asc')
  );
}

export async function getMenuItemsByCategory(
  restaurantId: string,
  categoryId: string
): Promise<MenuItem[]> {
  return queryDocuments<MenuItem>(
    getMenuItemsCollection(restaurantId),
    where('categoryId', '==', categoryId),
    where('availability.isAvailable', '==', true),
    orderBy('sortOrder', 'asc')
  );
}

export async function getCategories(restaurantId: string): Promise<MenuCategory[]> {
  return queryDocuments<MenuCategory>(
    getCategoriesCollection(restaurantId),
    where('isActive', '==', true),
    orderBy('sortOrder', 'asc')
  );
}

// Table operations
export async function getTables(restaurantId: string): Promise<Table[]> {
  return queryDocuments<Table>(
    getTablesCollection(restaurantId),
    orderBy('tableNumber', 'asc')
  );
}

export async function getTable(
  restaurantId: string,
  tableId: string
): Promise<Table | null> {
  return getDocument<Table>(getTablesCollection(restaurantId), tableId);
}

// Order operations
export async function getOrder(orderId: string): Promise<Order | null> {
  return getDocument<Order>(collections.orders, orderId);
}

export async function getTableOrders(
  restaurantId: string,
  tableId: string
): Promise<Order[]> {
  return queryDocuments<Order>(
    collections.orders,
    where('restaurantId', '==', restaurantId),
    where('tableId', '==', tableId),
    where('status', 'not-in', ['paid', 'cancelled']),
    orderBy('createdAt', 'desc')
  );
}

export async function getRestaurantOrders(
  restaurantId: string,
  status?: string[]
): Promise<Order[]> {
  const constraints: QueryConstraint[] = [
    where('restaurantId', '==', restaurantId),
    orderBy('createdAt', 'desc'),
  ];

  if (status && status.length > 0) {
    constraints.push(where('status', 'in', status));
  }

  return queryDocuments<Order>(collections.orders, ...constraints);
}

// Reservation operations
export async function getReservation(id: string): Promise<Reservation | null> {
  return getDocument<Reservation>(collections.reservations, id);
}

export async function getRestaurantReservations(
  restaurantId: string,
  date?: Date
): Promise<Reservation[]> {
  const constraints: QueryConstraint[] = [
    where('restaurantId', '==', restaurantId),
    orderBy('dateTime', 'asc'),
  ];

  // Note: Date filtering would need to be done client-side or with a date range
  return queryDocuments<Reservation>(collections.reservations, ...constraints);
}

// Real-time subscriptions
export function subscribeToOrders(
  restaurantId: string,
  callback: (orders: Order[]) => void
): Unsubscribe {
  const q = query(
    collection(db, collections.orders),
    where('restaurantId', '==', restaurantId),
    where('status', 'not-in', ['paid', 'cancelled']),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map((doc) => doc.data() as Order);
    callback(orders);
  });
}

export function subscribeToTable(
  restaurantId: string,
  tableId: string,
  callback: (table: Table | null) => void
): Unsubscribe {
  const docRef = doc(db, getTablesCollection(restaurantId), tableId);

  return onSnapshot(docRef, (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data() as Table) : null);
  });
}

export function subscribeToReservations(
  restaurantId: string,
  callback: (reservations: Reservation[]) => void
): Unsubscribe {
  const q = query(
    collection(db, collections.reservations),
    where('restaurantId', '==', restaurantId),
    where('status', 'in', ['pending', 'confirmed']),
    orderBy('dateTime', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const reservations = snapshot.docs.map((doc) => doc.data() as Reservation);
    callback(reservations);
  });
}
