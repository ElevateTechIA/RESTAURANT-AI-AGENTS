import { Timestamp } from 'firebase/firestore';

export type UserRole = 'customer' | 'server' | 'manager' | 'admin' | 'superadmin';

export interface UserPreferences {
  language: 'en' | 'es';
  theme: 'light' | 'dark' | 'system';
  dietaryRestrictions: string[];
  favoriteItems: string[];
  pushNotifications: boolean;
  smsNotifications: boolean;
  emailMarketing: boolean;
}

export interface UserStats {
  totalOrders: number;
  totalSpent: number;
  lastVisit: Timestamp | null;
  averageOrderValue: number;
}

export interface User {
  id: string;
  email: string;
  phone: string | null;
  displayName: string;
  photoUrl: string | null;
  role: UserRole;
  restaurantIds: string[];
  primaryRestaurantId: string | null;
  preferences: UserPreferences;
  stats: UserStats;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
  isVerified: boolean;
  status: 'active' | 'suspended';
}

export interface StaffMember extends User {
  role: 'server' | 'manager' | 'admin';
  shifts?: {
    day: string;
    start: string;
    end: string;
  }[];
  sections?: string[];
}

export type UserFormData = {
  email: string;
  displayName: string;
  phone?: string;
  role: UserRole;
  restaurantIds?: string[];
};

export type UserRegistrationData = {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
};
