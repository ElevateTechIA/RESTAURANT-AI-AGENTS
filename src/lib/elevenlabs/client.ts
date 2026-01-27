// ElevenLabs Voice Agent Configuration

export interface ElevenLabsAgentConfig {
  agentId: string;
  language: 'en' | 'es';
  restaurantId: string;
  tableId: string;
  sessionId: string;
}

export interface SignedUrlResponse {
  signedUrl: string;
  expiresAt: number;
}

// Voice IDs for different languages
const VOICE_CONFIG = {
  en: {
    voiceId: process.env.ELEVENLABS_VOICE_EN || 'default-voice-id',
    firstMessage:
      'Hello! Welcome to our restaurant. I am your AI assistant. How can I help you today?',
  },
  es: {
    voiceId: process.env.ELEVENLABS_VOICE_ES || 'default-voice-id',
    firstMessage:
      'Hola! Bienvenido a nuestro restaurante. Soy tu asistente de IA. Como puedo ayudarte hoy?',
  },
};

// Server tools that the ElevenLabs agent can call
export const serverTools = [
  {
    name: 'get_menu',
    description: 'Retrieve the current menu for the restaurant',
    parameters: {
      type: 'object',
      properties: {
        restaurantId: { type: 'string', description: 'Restaurant ID' },
        categoryId: {
          type: 'string',
          description: 'Optional category filter',
        },
      },
      required: ['restaurantId'],
    },
  },
  {
    name: 'check_availability',
    description: 'Check if a specific menu item is available',
    parameters: {
      type: 'object',
      properties: {
        restaurantId: { type: 'string', description: 'Restaurant ID' },
        itemId: { type: 'string', description: 'Menu item ID' },
      },
      required: ['restaurantId', 'itemId'],
    },
  },
  {
    name: 'add_to_order',
    description: 'Add an item to the customer order',
    parameters: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
        itemId: { type: 'string', description: 'Menu item ID' },
        quantity: { type: 'number', description: 'Quantity to add' },
        modifiers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Modifier IDs',
        },
        specialInstructions: {
          type: 'string',
          description: 'Special instructions',
        },
      },
      required: ['sessionId', 'itemId', 'quantity'],
    },
  },
  {
    name: 'remove_from_order',
    description: 'Remove an item from the order',
    parameters: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
        orderItemId: { type: 'string', description: 'Order item ID' },
      },
      required: ['sessionId', 'orderItemId'],
    },
  },
  {
    name: 'get_order_summary',
    description: 'Get the current order summary',
    parameters: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'get_recommendations',
    description: 'Get AI-powered recommendations',
    parameters: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
        type: {
          type: 'string',
          enum: ['pairing', 'popular', 'dietary'],
          description: 'Type of recommendation',
        },
      },
      required: ['sessionId', 'type'],
    },
  },
  {
    name: 'request_human_assistance',
    description: 'Request a human server to come to the table',
    parameters: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
        reason: { type: 'string', description: 'Reason for assistance' },
      },
      required: ['sessionId', 'reason'],
    },
  },
];

// Client tools that run in the browser
export const clientTools = [
  {
    name: 'update_ui_order',
    description: 'Update the order display in the UI',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['add', 'remove', 'modify', 'refresh'],
        },
        item: { type: 'object' },
      },
      required: ['action'],
    },
  },
  {
    name: 'show_menu_item',
    description: 'Display a specific menu item in the UI',
    parameters: {
      type: 'object',
      properties: {
        itemId: { type: 'string' },
      },
      required: ['itemId'],
    },
  },
  {
    name: 'navigate_to',
    description: 'Navigate to a specific page',
    parameters: {
      type: 'object',
      properties: {
        page: {
          type: 'string',
          enum: ['menu', 'order', 'checkout', 'assistance'],
        },
      },
      required: ['page'],
    },
  },
];

/**
 * Generate a signed URL for secure client-side voice agent connection
 * Uses ElevenLabs Conversational AI API
 * @see https://elevenlabs.io/docs/conversational-ai/api-reference/get-conversational-ai-signed-url
 */
export async function generateSignedUrl(
  config: ElevenLabsAgentConfig
): Promise<SignedUrlResponse> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  // Check if ElevenLabs is configured
  if (!apiKey || !agentId) {
    throw new Error('ElevenLabs not configured. Please set ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID environment variables.');
  }

  // ElevenLabs signed URL endpoint uses GET method
  const url = new URL('https://api.elevenlabs.io/v1/convai/conversation/get_signed_url');
  url.searchParams.set('agent_id', agentId);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'xi-api-key': apiKey,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to generate signed URL: ${error}`);
  }

  const data = await response.json();
  return {
    signedUrl: data.signed_url,
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes from now
  };
}

/**
 * Get WebSocket URL for public agents (no signed URL needed)
 */
export function getPublicAgentWebSocketUrl(agentId: string): string {
  return `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;
}

/**
 * Verify ElevenLabs webhook signature
 */
export function verifyWebhookSignature(
  signature: string,
  timestamp: string,
  body: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  const signaturePayload = `${timestamp}.${body}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signaturePayload)
    .digest('hex');

  const [, providedSignature] = signature.split('v0=');
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(providedSignature || '')
  );
}
