import { NextRequest, NextResponse } from 'next/server';
import { createChatSession, sendMessage, sendFunctionResults, AIMenuItem } from '@/lib/ai/gemini';
import { v4 as uuidv4 } from 'uuid';
import {
  getOrCreateChatSession,
  addMessagesToSession,
  updateSessionOrder,
  getChatSession,
  ChatSession,
} from '@/lib/firebase/chat';
import { createOrder, OrderItem } from '@/lib/firebase/orders';
import { getMenuItems, seedDemoMenu, MenuItem } from '@/lib/firebase/menu';

// Store Gemini chat sessions in memory (required for conversation context)
// The messages are persisted in Firestore, but Gemini needs the active chat object
const geminiSessions = new Map<string, any>();

// Store menu items per restaurant to avoid refetching
const menuCache = new Map<string, { items: MenuItem[]; timestamp: number }>();
const MENU_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getMenuForRestaurant(restaurantId: string): Promise<MenuItem[]> {
  const cached = menuCache.get(restaurantId);
  if (cached && Date.now() - cached.timestamp < MENU_CACHE_TTL) {
    return cached.items;
  }

  let items = await getMenuItems(restaurantId);

  // If no menu exists, seed demo data
  if (items.length === 0) {
    await seedDemoMenu(restaurantId);
    items = await getMenuItems(restaurantId);
  }

  menuCache.set(restaurantId, { items, timestamp: Date.now() });
  return items;
}

// Convert Firestore menu items to AI format
function convertToAIMenuItems(items: MenuItem[]): AIMenuItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    allergens: item.allergens,
    dietaryFlags: item.dietaryFlags,
    preparationTime: item.preparationTime,
    availability: item.availability,
    imageUrl: item.imageUrl || null,
  }));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, restaurantId, tableId, message, language, customerId } = body;

    if (!sessionId || !restaurantId || !tableId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create Firestore chat session
    const chatSession = await getOrCreateChatSession(
      sessionId,
      restaurantId,
      tableId,
      language || 'en',
      customerId || null
    );

    // Get menu from Firestore
    const menuItems = await getMenuForRestaurant(restaurantId);
    const aiMenuItems = convertToAIMenuItems(menuItems);

    // Get or create Gemini chat session
    let geminiChat = geminiSessions.get(sessionId);

    console.log('=== Chat API Request ===');
    console.log('Session ID:', sessionId);
    console.log('Restaurant ID:', restaurantId);
    console.log('Message:', message);
    console.log('Menu items loaded:', aiMenuItems.length);
    console.log('Menu item IDs:', aiMenuItems.map(m => ({ id: m.id, name: m.name.en })));

    if (!geminiChat) {
      console.log('Creating new Gemini chat session...');
      // Create new Gemini chat session
      geminiChat = await createChatSession({
        restaurantId,
        restaurantName: 'Restaurant AI Demo',
        tableId,
        sessionId,
        language: language || 'en',
        menu: aiMenuItems,
        currentOrder: chatSession.currentOrder,
      });

      geminiSessions.set(sessionId, geminiChat);
    }

    // Send message to Gemini
    const response = await sendMessage(geminiChat, message);

    // Process function calls if any
    const processedCalls: any[] = [];
    const functionResults: Array<{ name: string; result: any }> = [];

    console.log('=== AI Response ===');
    console.log('Text:', response.text);
    console.log('Function calls:', JSON.stringify(response.functionCalls, null, 2));

    for (const call of response.functionCalls) {
      let result: any = { success: false, message: 'Unknown function' };

      try {
        switch (call.name) {
          case 'addToOrder':
            result = await handleAddToOrder(sessionId, chatSession, call.args);
            break;
          case 'removeFromOrder':
            result = await handleRemoveFromOrder(sessionId, chatSession, call.args);
            break;
          case 'modifyOrderItem':
            result = await handleModifyOrderItem(sessionId, chatSession, call.args);
            break;
          case 'getRecommendations':
            result = await handleGetRecommendations(restaurantId, call.args);
            break;
          case 'checkAvailability':
            result = await handleCheckAvailability(restaurantId, call.args);
            break;
          case 'requestHumanAssistance':
            result = await handleRequestHumanAssistance(sessionId, tableId, call.args);
            break;
          case 'getOrderSummary':
            result = await handleGetOrderSummary(sessionId, chatSession);
            break;
          case 'proceedToCheckout':
            result = await handleProceedToCheckout(sessionId, chatSession);
            break;
          case 'submitOrder':
            // Legacy: redirect to checkout instead of direct submission
            result = await handleProceedToCheckout(sessionId, chatSession);
            break;
        }
      } catch (error: any) {
        result = { success: false, message: error.message };
      }

      processedCalls.push({ name: call.name, args: call.args, result });
      functionResults.push({ name: call.name, result });
    }

    // Send all function results together if there were any function calls
    if (functionResults.length > 0) {
      const followUp = await sendFunctionResults(geminiChat, functionResults);
      if (followUp.text) {
        response.text = followUp.text;
      }
    }

    // Save messages to Firestore
    const assistantMessage: any = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response.text,
    };

    // Only add toolCalls if there are any (Firestore doesn't accept undefined)
    if (processedCalls.length > 0) {
      assistantMessage.toolCalls = processedCalls;
    }

    await addMessagesToSession(sessionId, [
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
      },
      assistantMessage,
    ]);

    return NextResponse.json({
      message: response.text,
      toolCalls: processedCalls,
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve chat history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    console.log('=== GET Chat History ===');
    console.log('Session ID:', sessionId);

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    const session = await getChatSession(sessionId);
    console.log('Session found:', !!session);
    console.log('Messages count:', session?.messages?.length || 0);
    console.log('Current order:', session?.currentOrder ? 'Yes' : 'No');

    if (!session) {
      return NextResponse.json({
        messages: [],
        currentOrder: null,
      });
    }

    return NextResponse.json({
      messages: session.messages,
      currentOrder: session.currentOrder,
    });
  } catch (error: any) {
    console.error('Get chat history error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to add an item to the order
async function handleAddToOrderByItem(
  sessionId: string,
  session: ChatSession,
  menuItem: MenuItem,
  quantity: number
) {
  // Get current order or create new one
  const order = session.currentOrder || { items: [], subtotal: 0, tax: 0, total: 0 };

  // Check if item already exists in order
  const existingItemIndex = order.items.findIndex((item: any) => item.menuItemId === menuItem.id);

  if (existingItemIndex >= 0) {
    order.items[existingItemIndex].quantity += quantity;
  } else {
    order.items.push({
      id: uuidv4(),
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity,
    });
  }

  // Recalculate totals
  order.subtotal = order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  order.tax = order.subtotal * 0.08;
  order.total = order.subtotal + order.tax;

  // Update session in Firestore
  await updateSessionOrder(sessionId, order);
  session.currentOrder = order;

  return {
    success: true,
    message: `Added ${quantity}x ${menuItem.name.en} to order`,
    item: {
      menuItemId: menuItem.id,
      name: menuItem.name,
      quantity: existingItemIndex >= 0 ? order.items[existingItemIndex].quantity : quantity,
      price: menuItem.price,
    },
    orderTotal: Math.round(order.total * 100) / 100,
  };
}

// Function handlers with Firestore persistence
async function handleAddToOrder(sessionId: string, session: ChatSession, args: any) {
  const { itemId, quantity = 1, modifiers, specialInstructions } = args;

  console.log('=== handleAddToOrder called ===');
  console.log('Args:', JSON.stringify(args, null, 2));
  console.log('Session restaurantId:', session.restaurantId);

  const menuItems = await getMenuForRestaurant(session.restaurantId);
  console.log('Menu items count:', menuItems.length);
  console.log('Available item IDs:', menuItems.map(item => item.id));
  console.log('Looking for itemId:', itemId);

  const menuItem = menuItems.find(item => item.id === itemId);
  console.log('Found menuItem:', menuItem ? menuItem.name : 'NOT FOUND');

  if (!menuItem) {
    // Try to find by name as fallback (the AI might send the item name instead of ID)
    const itemByName = menuItems.find(item =>
      item.name.en.toLowerCase() === itemId?.toLowerCase() ||
      item.name.es.toLowerCase() === itemId?.toLowerCase() ||
      item.name.en.toLowerCase().includes(itemId?.toLowerCase()) ||
      item.name.es.toLowerCase().includes(itemId?.toLowerCase())
    );
    if (itemByName) {
      console.log('Found item by name instead:', itemByName.name);
      return handleAddToOrderByItem(sessionId, session, itemByName, quantity);
    }
    console.log('Item not found in menu');
    return { success: false, message: `Item not found in menu. Looking for: ${itemId}. Available items: ${menuItems.map(m => m.name.en).join(', ')}` };
  }

  // Use the helper function
  return handleAddToOrderByItem(sessionId, session, menuItem, quantity);
}

async function handleRemoveFromOrder(sessionId: string, session: ChatSession, args: any) {
  const { orderItemId, itemId } = args;

  if (!session.currentOrder || session.currentOrder.items.length === 0) {
    return { success: false, message: 'Order is empty' };
  }

  const order = session.currentOrder;
  const itemIndex = order.items.findIndex(
    item => item.id === orderItemId || item.menuItemId === itemId
  );

  if (itemIndex === -1) {
    return { success: false, message: 'Item not found in order' };
  }

  const removedItem = order.items[itemIndex];
  order.items.splice(itemIndex, 1);

  // Recalculate totals
  order.subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  order.tax = order.subtotal * 0.08;
  order.total = order.subtotal + order.tax;

  // Update session in Firestore
  await updateSessionOrder(sessionId, order.items.length > 0 ? order : null);
  session.currentOrder = order.items.length > 0 ? order : null;

  return {
    success: true,
    message: `Removed ${removedItem.name.en} from order`,
    orderTotal: Math.round(order.total * 100) / 100,
  };
}

async function handleModifyOrderItem(sessionId: string, session: ChatSession, args: any) {
  const { orderItemId, itemId, quantity, modifiers, specialInstructions } = args;

  if (!session.currentOrder || session.currentOrder.items.length === 0) {
    return { success: false, message: 'Order is empty' };
  }

  const order = session.currentOrder;
  const item = order.items.find(
    item => item.id === orderItemId || item.menuItemId === itemId
  );

  if (!item) {
    return { success: false, message: 'Item not found in order' };
  }

  if (quantity !== undefined) {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      const index = order.items.indexOf(item);
      order.items.splice(index, 1);
    } else {
      item.quantity = quantity;
    }
  }

  // Recalculate totals
  order.subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  order.tax = order.subtotal * 0.08;
  order.total = order.subtotal + order.tax;

  // Update session in Firestore
  await updateSessionOrder(sessionId, order.items.length > 0 ? order : null);
  session.currentOrder = order.items.length > 0 ? order : null;

  return {
    success: true,
    message: `Updated order`,
    orderTotal: Math.round(order.total * 100) / 100,
  };
}

async function handleGetRecommendations(restaurantId: string, args: any) {
  const { type } = args;

  const menuItems = await getMenuForRestaurant(restaurantId);
  const availableItems = menuItems.filter(item => item.availability.isAvailable);

  // Get items by category
  const mains = availableItems.filter(item => item.categoryId === 'mains');
  const starters = availableItems.filter(item => item.categoryId === 'starters');
  const desserts = availableItems.filter(item => item.categoryId === 'desserts');
  const drinks = availableItems.filter(item => item.categoryId === 'drinks');

  let recommendations: Array<{ item: MenuItem; reason: string }> = [];

  if (type === 'popular' && mains.length > 0) {
    recommendations = [
      { item: mains[0], reason: 'Our most popular dish!' },
      ...(mains[1] ? [{ item: mains[1], reason: 'Customer favorite!' }] : []),
    ];
  } else if (type === 'pairing') {
    recommendations = [
      ...(drinks.length > 0 ? [{ item: drinks[0], reason: 'Perfect to refresh your palate' }] : []),
      ...(desserts.length > 0 ? [{ item: desserts[0], reason: 'A sweet finish to your meal' }] : []),
    ];
  } else {
    recommendations = [
      ...(starters.length > 0 ? [{ item: starters[0], reason: 'Light and fresh start' }] : []),
      ...(starters.length > 1 ? [{ item: starters[1], reason: 'Comfort food classic' }] : []),
    ];
  }

  return {
    success: true,
    recommendations: recommendations.map(r => ({
      itemId: r.item.id,
      name: r.item.name,
      price: r.item.price,
      reason: r.reason,
    })),
  };
}

async function handleCheckAvailability(restaurantId: string, args: any) {
  const { itemId } = args;

  const menuItems = await getMenuForRestaurant(restaurantId);
  const menuItem = menuItems.find(item => item.id === itemId);

  if (!menuItem) {
    return {
      success: false,
      isAvailable: false,
      message: 'Item not found',
    };
  }

  return {
    success: true,
    isAvailable: menuItem.availability.isAvailable,
    itemName: menuItem.name,
    stockCount: menuItem.availability.stockCount,
  };
}

async function handleRequestHumanAssistance(
  sessionId: string,
  tableId: string,
  args: any
) {
  const { reason } = args;

  // TODO: Implement actual notification to staff (push notification, SMS, etc.)
  console.log(`Human assistance requested at table ${tableId}: ${reason}`);

  return {
    success: true,
    message: 'A server has been notified and will be with you shortly.',
  };
}

async function handleGetOrderSummary(sessionId: string, session: ChatSession) {
  const order = session.currentOrder;

  if (!order || order.items.length === 0) {
    return {
      success: true,
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      message: 'Your order is empty',
    };
  }

  return {
    success: true,
    items: order.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      itemTotal: Math.round(item.price * item.quantity * 100) / 100,
    })),
    subtotal: Math.round(order.subtotal * 100) / 100,
    tax: Math.round(order.tax * 100) / 100,
    total: Math.round(order.total * 100) / 100,
  };
}

async function handleProceedToCheckout(sessionId: string, session: ChatSession) {
  if (!session.currentOrder || session.currentOrder.items.length === 0) {
    return {
      success: false,
      message: 'Your order is empty. Please add items before proceeding to checkout.',
      redirectToCheckout: false,
    };
  }

  const order = session.currentOrder;

  return {
    success: true,
    message: 'Please proceed to checkout to review your order, add a tip, and complete payment.',
    redirectToCheckout: true,
    checkoutUrl: '/checkout',
    orderSummary: {
      itemCount: order.items.length,
      subtotal: Math.round(order.subtotal * 100) / 100,
      tax: Math.round(order.tax * 100) / 100,
      total: Math.round(order.total * 100) / 100,
    },
  };
}
