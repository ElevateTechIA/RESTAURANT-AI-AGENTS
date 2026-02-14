import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;
let adminStorage: Storage;

function parsePrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;

  // Try JSON.parse first (handles keys stored as JSON strings with quotes)
  try {
    const parsed = JSON.parse(key);
    if (typeof parsed === 'string') return parsed;
  } catch {
    // Not a JSON string, continue
  }

  // Replace literal \n with actual newlines
  return key.replace(/\\n/g, '\n');
}

function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    const privateKey = parsePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);

    if (!privateKey || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      throw new Error('Firebase Admin credentials not configured');
    }

    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } else {
    adminApp = getApps()[0];
  }

  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);
  adminStorage = getStorage(adminApp);

  return { adminApp, adminAuth, adminDb, adminStorage };
}

export function getAdminAuth(): Auth {
  if (!adminAuth) {
    initializeFirebaseAdmin();
  }
  return adminAuth;
}

export function getAdminDb(): Firestore {
  if (!adminDb) {
    initializeFirebaseAdmin();
  }
  return adminDb;
}

export function getAdminStorage(): Storage {
  if (!adminStorage) {
    initializeFirebaseAdmin();
  }
  return adminStorage;
}

export { initializeFirebaseAdmin };
