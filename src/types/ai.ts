import { Timestamp } from 'firebase/firestore';

export type ConversationType = 'ordering' | 'reservation' | 'support';
export type ConversationChannel = 'voice' | 'chat' | 'sms';
export type MessageRole = 'user' | 'assistant' | 'system';
export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface ToolCall {
  name: string;
  parameters: Record<string, unknown>;
  result: unknown;
}

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  audioUrl: string | null;
  timestamp: Timestamp;
  toolCalls: ToolCall[];
}

export interface Conversation {
  id: string;
  restaurantId: string;
  tableId: string | null;
  customerId: string | null;
  sessionId: string;
  orderId: string | null;
  type: ConversationType;
  channel: ConversationChannel;
  language: 'en' | 'es';
  messages: ConversationMessage[];
  summary: string | null;
  sentiment: Sentiment;
  resolved: boolean;
  humanTakeover: boolean;
  duration: number;
  startedAt: Timestamp;
  endedAt: Timestamp | null;
  metadata: {
    deviceType: string;
    userAgent: string;
    ipAddress: string;
  };
}

export interface ChatRequest {
  sessionId: string;
  restaurantId: string;
  tableId: string;
  message: string;
  language: 'en' | 'es';
}

export interface ChatResponse {
  message: string;
  toolCalls?: ToolCall[];
  suggestions?: string[];
}

export interface AIRecommendation {
  itemId: string;
  itemName: string;
  reason: string;
  type: 'pairing' | 'popular' | 'dietary' | 'upsell';
}

export interface VoiceAgentConfig {
  agentId: string;
  language: 'en' | 'es';
  restaurantId: string;
  tableId: string;
  sessionId: string;
}
