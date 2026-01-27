'use client';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { User, UserRole, UserPreferences } from '@/types';

const googleProvider = new GoogleAuthProvider();

const defaultPreferences: UserPreferences = {
  language: 'en',
  theme: 'system',
  dietaryRestrictions: [],
  favoriteItems: [],
  pushNotifications: true,
  smsNotifications: true,
  emailMarketing: false,
};

export async function signIn(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const userData = await getUserData(credential.user.uid);

  // Update last login
  await setDoc(
    doc(db, 'users', credential.user.uid),
    { lastLoginAt: serverTimestamp() },
    { merge: true }
  );

  return userData;
}

export async function signUp(
  email: string,
  password: string,
  displayName: string,
  role: UserRole = 'customer'
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  // Update Firebase user profile
  await updateProfile(credential.user, { displayName });

  // Send verification email
  await sendEmailVerification(credential.user);

  // Create user document in Firestore
  const userData: Omit<User, 'id'> = {
    email,
    displayName,
    phone: null,
    photoUrl: null,
    role,
    restaurantIds: [],
    primaryRestaurantId: null,
    preferences: defaultPreferences,
    stats: {
      totalOrders: 0,
      totalSpent: 0,
      lastVisit: null,
      averageOrderValue: 0,
    },
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
    lastLoginAt: serverTimestamp() as any,
    isVerified: false,
    status: 'active',
  };

  await setDoc(doc(db, 'users', credential.user.uid), {
    id: credential.user.uid,
    ...userData,
  });

  return { id: credential.user.uid, ...userData } as User;
}

export async function signInWithGoogle(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);

  // Check if user exists
  const userDoc = await getDoc(doc(db, 'users', credential.user.uid));

  if (!userDoc.exists()) {
    // Create new user document
    const userData: Omit<User, 'id'> = {
      email: credential.user.email!,
      displayName: credential.user.displayName || 'User',
      phone: credential.user.phoneNumber,
      photoUrl: credential.user.photoURL,
      role: 'customer',
      restaurantIds: [],
      primaryRestaurantId: null,
      preferences: defaultPreferences,
      stats: {
        totalOrders: 0,
        totalSpent: 0,
        lastVisit: null,
        averageOrderValue: 0,
      },
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      lastLoginAt: serverTimestamp() as any,
      isVerified: true,
      status: 'active',
    };

    await setDoc(doc(db, 'users', credential.user.uid), {
      id: credential.user.uid,
      ...userData,
    });

    return { id: credential.user.uid, ...userData } as User;
  }

  // Update last login
  await setDoc(
    doc(db, 'users', credential.user.uid),
    { lastLoginAt: serverTimestamp() },
    { merge: true }
  );

  return userDoc.data() as User;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function getUserData(uid: string): Promise<User> {
  const userDoc = await getDoc(doc(db, 'users', uid));

  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  return userDoc.data() as User;
}

export async function updateUserData(uid: string, data: Partial<User>): Promise<void> {
  await setDoc(
    doc(db, 'users', uid),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export { auth };
