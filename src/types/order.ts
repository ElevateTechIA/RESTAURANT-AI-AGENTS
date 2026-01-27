import { Timestamp } from 'firebase/firestore';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'paid'
  | 'cancelled';

export type OrderItemStatus = 'pending' | 'preparing' | 'ready' | 'served';

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';

export type OrderType = 'dine_in' | 'takeout' | 'delivery';

export interface OrderItemModifier {
  id: string;
  name: string;
  priceAdjustment: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  modifiers: OrderItemModifier[];
  specialInstructions: string;
  status: OrderItemStatus;
  addedAt: Timestamp;
  addedBy: 'ai' | 'customer' | 'server';
}

export interface Order {
  id: string;
  restaurantId: string;
  tableId: string;
  sessionId: string;
  customerId: string | null;
  serverId: string | null;
  status: OrderStatus;
  type: OrderType;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  paymentIntentId: string | null;
  specialRequests: string;
  aiAssisted: boolean;
  humanAssistanceRequested: boolean;
  humanAssistanceReason: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
}

export interface OrderSession {
  id: string;
  restaurantId: string;
  tableId: string;
  orderId: string | null;
  customerId: string | null;
  language: 'en' | 'es';
  startedAt: Timestamp;
  endedAt: Timestamp | null;
  isActive: boolean;
}

export type AddToOrderData = {
  menuItemId: string;
  quantity: number;
  modifiers?: { id: string; name: string; priceAdjustment: number }[];
  specialInstructions?: string;
};

export type ModifyOrderItemData = {
  orderItemId: string;
  quantity?: number;
  modifiers?: { id: string; name: string; priceAdjustment: number }[];
  specialInstructions?: string;
};
