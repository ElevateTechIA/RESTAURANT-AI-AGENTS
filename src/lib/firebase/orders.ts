import { getAdminDb } from './admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'delivered' | 'paid' | 'cancelled';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: { en: string; es: string };
  price: number;
  quantity: number;
  modifiers: string[];
  specialInstructions: string;
}

export interface Order {
  id: string;
  restaurantId: string;
  tableId: string;
  sessionId: string;
  customerId: string | null;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string | null;
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed';
  specialInstructions: string | null;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  confirmedAt: Timestamp | null;
  completedAt: Timestamp | null;
}

const COLLECTION = 'orders';

/**
 * Create a new order
 */
export async function createOrder(
  orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'confirmedAt' | 'completedAt'>
): Promise<Order> {
  const db = getAdminDb();
  const docRef = db.collection(COLLECTION).doc();

  const order: Order = {
    ...orderData,
    id: docRef.id,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    confirmedAt: null,
    completedAt: null,
  };

  await docRef.set(order);
  return order;
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  const db = getAdminDb();
  const doc = await db.collection(COLLECTION).doc(orderId).get();
  return doc.exists ? (doc.data() as Order) : null;
}

/**
 * Get orders for a customer
 */
export async function getCustomerOrders(
  customerId: string,
  limit: number = 20
): Promise<Order[]> {
  const db = getAdminDb();
  const snapshot = await db
    .collection(COLLECTION)
    .where('customerId', '==', customerId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => doc.data() as Order);
}

/**
 * Get orders for a session (for anonymous users)
 */
export async function getSessionOrders(
  sessionId: string,
  limit: number = 20
): Promise<Order[]> {
  const db = getAdminDb();
  const snapshot = await db
    .collection(COLLECTION)
    .where('sessionId', '==', sessionId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => doc.data() as Order);
}

/**
 * Get orders for a restaurant
 */
export async function getRestaurantOrders(
  restaurantId: string,
  status?: OrderStatus[],
  limit: number = 50
): Promise<Order[]> {
  const db = getAdminDb();
  let query = db
    .collection(COLLECTION)
    .where('restaurantId', '==', restaurantId);

  if (status && status.length > 0) {
    query = query.where('status', 'in', status);
  }

  const snapshot = await query
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => doc.data() as Order);
}

/**
 * Get active orders for a table
 */
export async function getTableOrders(
  restaurantId: string,
  tableId: string
): Promise<Order[]> {
  const db = getAdminDb();
  const snapshot = await db
    .collection(COLLECTION)
    .where('restaurantId', '==', restaurantId)
    .where('tableId', '==', tableId)
    .where('status', 'not-in', ['paid', 'cancelled'])
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => doc.data() as Order);
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const db = getAdminDb();
  const updateData: Record<string, any> = {
    status,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (status === 'confirmed') {
    updateData.confirmedAt = FieldValue.serverTimestamp();
  } else if (status === 'paid' || status === 'delivered') {
    updateData.completedAt = FieldValue.serverTimestamp();
  }

  await db.collection(COLLECTION).doc(orderId).update(updateData);
}

/**
 * Update order items
 */
export async function updateOrderItems(
  orderId: string,
  items: OrderItem[],
  subtotal: number,
  tax: number,
  total: number
): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTION).doc(orderId).update({
    items,
    subtotal,
    tax,
    total,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Add tip to order
 */
export async function addTipToOrder(orderId: string, tip: number): Promise<void> {
  const db = getAdminDb();
  const doc = await db.collection(COLLECTION).doc(orderId).get();

  if (!doc.exists) {
    throw new Error('Order not found');
  }

  const order = doc.data() as Order;
  const newTotal = order.subtotal + order.tax + tip;

  await db.collection(COLLECTION).doc(orderId).update({
    tip,
    total: newTotal,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: Order['paymentStatus'],
  paymentMethod?: string
): Promise<void> {
  const db = getAdminDb();
  const updateData: Record<string, any> = {
    paymentStatus,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (paymentMethod) {
    updateData.paymentMethod = paymentMethod;
  }

  if (paymentStatus === 'completed') {
    updateData.status = 'paid';
    updateData.completedAt = FieldValue.serverTimestamp();
  }

  await db.collection(COLLECTION).doc(orderId).update(updateData);
}

/**
 * Cancel order
 */
export async function cancelOrder(orderId: string, reason?: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTION).doc(orderId).update({
    status: 'cancelled',
    cancellationReason: reason || null,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Get order statistics for a restaurant
 */
export async function getOrderStats(
  restaurantId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
}> {
  const db = getAdminDb();
  const snapshot = await db
    .collection(COLLECTION)
    .where('restaurantId', '==', restaurantId)
    .where('createdAt', '>=', Timestamp.fromDate(startDate))
    .where('createdAt', '<=', Timestamp.fromDate(endDate))
    .get();

  const orders = snapshot.docs.map((doc) => doc.data() as Order);

  const paidOrders = orders.filter((o) => o.status === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

  const ordersByStatus = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<OrderStatus, number>);

  return {
    totalOrders: orders.length,
    totalRevenue,
    averageOrderValue: paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0,
    ordersByStatus,
  };
}
