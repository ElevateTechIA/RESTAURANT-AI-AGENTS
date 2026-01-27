import { Timestamp } from 'firebase/firestore';

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'seated'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type ReservationSource = 'website' | 'phone' | 'ai_chat' | 'walk_in';

export interface Reservation {
  id: string;
  restaurantId: string;
  customerId: string | null;
  tableId: string | null;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  partySize: number;
  dateTime: Timestamp;
  duration: number;
  status: ReservationStatus;
  specialRequests: string;
  occasion: string | null;
  source: ReservationSource;
  reminderSent: boolean;
  confirmationSent: boolean;
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ReservationFormData = {
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  partySize: number;
  dateTime: Date;
  duration?: number;
  specialRequests?: string;
  occasion?: string;
};

export const OCCASIONS = [
  'birthday',
  'anniversary',
  'business',
  'date_night',
  'celebration',
  'other',
] as const;

export type Occasion = typeof OCCASIONS[number];
