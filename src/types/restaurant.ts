import { Timestamp } from 'firebase/firestore';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  phone: string;
  email: string;
  timezone: string;
  currency: string;
  defaultLanguage: 'en' | 'es';
  supportedLanguages: string[];
  theme: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    bannerUrl: string;
  };
  operatingHours: {
    [day: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  features: {
    aiOrdering: boolean;
    voiceAgent: boolean;
    reservations: boolean;
    smsNotifications: boolean;
  };
  taxRate: number;
  tipOptions: number[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'active' | 'suspended' | 'pending';
}

export interface Table {
  id: string;
  restaurantId: string;
  tableNumber: string;
  displayName: string;
  capacity: number;
  section: string;
  qrCodeUrl: string;
  qrCodeData: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  currentOrderId: string | null;
  currentSessionId: string | null;
  assignedServerId: string | null;
  features: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type RestaurantFormData = Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>;
export type TableFormData = Omit<Table, 'id' | 'createdAt' | 'updatedAt' | 'qrCodeUrl' | 'qrCodeData'>;
