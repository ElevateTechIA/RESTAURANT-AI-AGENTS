export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ElevenLabs webhook types
export interface ElevenLabsWebhookPayload {
  tool_name: string;
  parameters: Record<string, unknown>;
  conversation_id: string;
  agent_id: string;
}

export interface ElevenLabsPostCallPayload {
  conversation_id: string;
  agent_id: string;
  transcript: {
    role: 'user' | 'agent';
    content: string;
    timestamp: number;
  }[];
  analysis: {
    summary: string;
    sentiment: string;
  };
  duration: number;
  audio_url?: string;
}

// Twilio webhook types
export interface TwilioSmsWebhook {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia: string;
  MediaUrl0?: string;
}

export interface TwilioVoiceWebhook {
  CallSid: string;
  AccountSid: string;
  From: string;
  To: string;
  CallStatus: string;
  Direction: string;
}
