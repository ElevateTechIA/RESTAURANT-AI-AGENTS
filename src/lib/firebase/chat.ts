import { getAdminDb } from './admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Timestamp | FieldValue;
  toolCalls?: Array<{
    name: string;
    args: Record<string, unknown>;
    result: unknown;
  }>;
}

export interface ChatSession {
  id: string;
  restaurantId: string;
  tableId: string;
  customerId: string | null;
  language: 'en' | 'es';
  messages: ChatMessage[];
  currentOrder: {
    items: Array<{
      id: string;
      menuItemId: string;
      name: { en: string; es: string };
      price: number;
      quantity: number;
    }>;
    subtotal: number;
    tax: number;
    total: number;
  } | null;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

const COLLECTION = 'chatSessions';

/**
 * Get or create a chat session
 */
export async function getOrCreateChatSession(
  sessionId: string,
  restaurantId: string,
  tableId: string,
  language: 'en' | 'es',
  customerId: string | null = null
): Promise<ChatSession> {
  const db = getAdminDb();
  const docRef = db.collection(COLLECTION).doc(sessionId);
  const doc = await docRef.get();

  if (doc.exists) {
    return doc.data() as ChatSession;
  }

  const newSession: ChatSession = {
    id: sessionId,
    restaurantId,
    tableId,
    customerId,
    language,
    messages: [],
    currentOrder: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await docRef.set(newSession);
  return newSession;
}

/**
 * Get chat session by ID
 */
export async function getChatSession(sessionId: string): Promise<ChatSession | null> {
  const db = getAdminDb();
  const doc = await db.collection(COLLECTION).doc(sessionId).get();
  return doc.exists ? (doc.data() as ChatSession) : null;
}

/**
 * Add a message to the chat session
 */
export async function addMessageToSession(
  sessionId: string,
  message: Omit<ChatMessage, 'timestamp'>
): Promise<void> {
  const db = getAdminDb();
  const docRef = db.collection(COLLECTION).doc(sessionId);

  const messageWithTimestamp: ChatMessage = {
    ...message,
    timestamp: FieldValue.serverTimestamp(),
  };

  await docRef.update({
    messages: FieldValue.arrayUnion(messageWithTimestamp),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Add multiple messages to the chat session
 */
export async function addMessagesToSession(
  sessionId: string,
  messages: Array<Omit<ChatMessage, 'timestamp'>>
): Promise<void> {
  const db = getAdminDb();
  const docRef = db.collection(COLLECTION).doc(sessionId);

  const messagesWithTimestamp = messages.map((msg) => ({
    ...msg,
    timestamp: Timestamp.now(),
  }));

  await docRef.update({
    messages: FieldValue.arrayUnion(...messagesWithTimestamp),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Update the current order in the session
 */
export async function updateSessionOrder(
  sessionId: string,
  order: ChatSession['currentOrder']
): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTION).doc(sessionId).update({
    currentOrder: order,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Get chat history for a session (last N messages)
 */
export async function getChatHistory(
  sessionId: string,
  limit: number = 50
): Promise<ChatMessage[]> {
  const session = await getChatSession(sessionId);
  if (!session) return [];

  const messages = session.messages || [];
  return messages.slice(-limit);
}

/**
 * Get all chat sessions for a customer
 */
export async function getCustomerChatSessions(
  customerId: string,
  limit: number = 10
): Promise<ChatSession[]> {
  const db = getAdminDb();
  const snapshot = await db
    .collection(COLLECTION)
    .where('customerId', '==', customerId)
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => doc.data() as ChatSession);
}

/**
 * Clear chat session (for reset)
 */
export async function clearChatSession(sessionId: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTION).doc(sessionId).update({
    messages: [],
    currentOrder: null,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Delete old chat sessions (cleanup job)
 */
export async function deleteOldSessions(daysOld: number = 30): Promise<number> {
  const db = getAdminDb();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const snapshot = await db
    .collection(COLLECTION)
    .where('updatedAt', '<', Timestamp.fromDate(cutoffDate))
    .get();

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  return snapshot.size;
}
