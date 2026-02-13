import { GoogleGenerativeAI, SchemaType, FunctionDeclaration } from '@google/generative-ai';

// Simplified menu item type for AI context
export interface AIMenuItem {
  id: string;
  name: { en: string; es: string };
  description: { en: string; es: string };
  price: number;
  allergens: string[];
  dietaryFlags: string[];
  preparationTime: number;
  availability: { isAvailable: boolean };
  imageUrl: string | null;
}

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Function declarations for the AI to use
const functionDeclarations: FunctionDeclaration[] = [
  {
    name: 'addToOrder',
    description: 'Add a menu item to the customer order',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        itemId: {
          type: SchemaType.STRING,
          description: 'The unique ID of the menu item to add',
        },
        quantity: {
          type: SchemaType.NUMBER,
          description: 'The quantity to add (default 1)',
        },
        modifiers: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: 'Array of modifier IDs to apply',
        },
        specialInstructions: {
          type: SchemaType.STRING,
          description: 'Special instructions for the item',
        },
      },
      required: ['itemId', 'quantity'],
    },
  },
  {
    name: 'removeFromOrder',
    description: 'Remove an item from the order',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        orderItemId: {
          type: SchemaType.STRING,
          description: 'The ID of the order item to remove',
        },
      },
      required: ['orderItemId'],
    },
  },
  {
    name: 'modifyOrderItem',
    description: 'Modify an existing item in the order',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        orderItemId: {
          type: SchemaType.STRING,
          description: 'The ID of the order item to modify',
        },
        quantity: {
          type: SchemaType.NUMBER,
          description: 'New quantity',
        },
        modifiers: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: 'New modifiers to apply',
        },
        specialInstructions: {
          type: SchemaType.STRING,
          description: 'Updated special instructions',
        },
      },
      required: ['orderItemId'],
    },
  },
  {
    name: 'getRecommendations',
    description: 'Get AI-powered menu recommendations based on context',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        type: {
          type: SchemaType.STRING,
          description: 'Type of recommendation: pairing, popular, dietary, upsell',
        },
        context: {
          type: SchemaType.STRING,
          description: 'Additional context for recommendations',
        },
      },
      required: ['type'],
    },
  },
  {
    name: 'checkAvailability',
    description: 'Check if a specific menu item is currently available',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        itemId: {
          type: SchemaType.STRING,
          description: 'The menu item ID to check',
        },
      },
      required: ['itemId'],
    },
  },
  {
    name: 'requestHumanAssistance',
    description: 'Request a human server to come to the table',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        reason: {
          type: SchemaType.STRING,
          description: 'The reason for requesting human assistance',
        },
      },
      required: ['reason'],
    },
  },
  {
    name: 'getOrderSummary',
    description: 'Get the current order summary with items and totals',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: 'proceedToCheckout',
    description: 'Direct the customer to the checkout page to review their order, add tip, and complete payment. Call this when the customer wants to place/submit/pay for their order.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
];

export interface ChatContext {
  restaurantId: string;
  restaurantName: string;
  tableId: string;
  sessionId: string;
  language: 'en' | 'es';
  menu: AIMenuItem[];
  currentOrder: any | null;
  customerPreferences?: {
    dietaryRestrictions: string[];
    favoriteItems: string[];
  };
}

function generateSystemPrompt(context: ChatContext): string {
  const languageInstructions =
    context.language === 'es'
      ? 'IMPORTANTE: Siempre responde en espanol de manera amigable y profesional. Usa un tono calido y servicial.'
      : 'IMPORTANT: Always respond in English in a friendly and professional manner. Use a warm and helpful tone.';

  const availableItems = context.menu.filter(
    (item) => item.availability.isAvailable
  );

  return `
You are an AI waitress assistant for ${context.restaurantName}. ${languageInstructions}

## Your Responsibilities:
1. Help customers browse the menu and understand dishes
2. Answer questions about ingredients, allergens, and dietary restrictions
3. Make personalized recommendations based on preferences and availability
4. Manage their order (add, remove, modify items)
5. Submit orders when customers are ready (always confirm before submitting)
6. Upsell naturally without being pushy (suggest drinks, sides, desserts)
7. Request human assistance when needed (complex issues, complaints, special requests you can't handle)

## IMPORTANT - Image Display Rules:
- When showing menu items, include the item image using markdown: ![Item Name](imageUrl)
- Only include images when the imageUrl is provided (not null or empty)
- Place each image on its own line, right before the item name and details
- When listing the FULL menu, show images only for the first 2-3 items per category to keep the response concise
- When recommending specific items or when the customer asks about a specific dish, ALWAYS show its image

## Menu Items Available (${availableItems.length} items):
${availableItems
  .map(
    (item) => `
ITEM: ${item.name[context.language]} / ${item.name[context.language === 'es' ? 'en' : 'es']}
- itemId: "${item.id}" (USE THIS EXACT ID when calling addToOrder)
- Price: $${item.price.toFixed(2)}
- Description: ${item.description[context.language]}
- Allergens: ${item.allergens.join(', ') || 'None'}
- Dietary: ${item.dietaryFlags.join(', ') || 'None'}
- Prep time: ${item.preparationTime} min${item.imageUrl ? `\n- Image: ${item.imageUrl}` : ''}
`
  )
  .join('\n')}

## Current Order:
${
  context.currentOrder
    ? `Items: ${context.currentOrder.items
        .map((i: any) => `${i.quantity}x ${i.name}`)
        .join(', ')}
   Subtotal: $${context.currentOrder.subtotal?.toFixed(2) || '0.00'}`
    : 'Empty - no items yet'
}

${
  context.customerPreferences
    ? `
## Customer Preferences:
- Dietary Restrictions: ${context.customerPreferences.dietaryRestrictions.join(', ') || 'None specified'}
- Previously Enjoyed: ${context.customerPreferences.favoriteItems.join(', ') || 'No history'}
`
    : ''
}

## CRITICAL - Function Calling Rules:
- You MUST call the addToOrder function to add items. DO NOT just say you added an item - you must actually call the function.
- When a customer confirms they want to add an item (says "yes", "si", "dale", "ok", "sure", etc.), IMMEDIATELY call addToOrder with the item's ID.
- Use the exact item ID from the menu list above (the "ID:" field for each item).
- If you don't call the function, the item will NOT be added to the order.
- Same applies for removeFromOrder and modifyOrderItem - you must call the actual functions.
- When the customer wants to place/submit/pay their order, call proceedToCheckout. This will direct them to the checkout page where they can review their order, add a tip, and complete payment.

## Guidelines:
- Be conversational and friendly, like a helpful human server
- Always confirm orders before adding - but when confirmed, CALL THE FUNCTION
- Mention allergens proactively for items with common allergens
- Suggest pairings naturally (e.g., "That pasta goes great with our house wine")
- If an item is unavailable, suggest alternatives
- For complex requests or complaints, use requestHumanAssistance
- Never discuss internal pricing strategies
- Keep responses concise but warm

Table: ${context.tableId}
Session: ${context.sessionId}
`;
}

export async function createChatSession(context: ChatContext) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: generateSystemPrompt(context),
    tools: [{ functionDeclarations }],
  });

  return model.startChat({
    history: [],
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 1024,
    },
  });
}

export async function sendMessage(
  chat: any,
  message: string
): Promise<{
  text: string;
  functionCalls: Array<{ name: string; args: any }>;
}> {
  const result = await chat.sendMessage(message);
  const response = result.response;

  const functionCalls: Array<{ name: string; args: any }> = [];
  const parts = response.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    if (part.functionCall) {
      functionCalls.push({
        name: part.functionCall.name,
        args: part.functionCall.args,
      });
    }
  }

  return {
    text: response.text() || '',
    functionCalls,
  };
}

export async function sendFunctionResults(
  chat: any,
  results: Array<{ name: string; result: any }>
) {
  const functionResponses = results.map((r) => ({
    functionResponse: {
      name: r.name,
      response: r.result,
    },
  }));

  const response = await chat.sendMessage(functionResponses);

  return {
    text: response.response.text() || '',
  };
}

// Keep the old function for backwards compatibility but mark as deprecated
export async function sendFunctionResult(
  chat: any,
  functionName: string,
  result: any
) {
  return sendFunctionResults(chat, [{ name: functionName, result }]);
}

export { genAI };
