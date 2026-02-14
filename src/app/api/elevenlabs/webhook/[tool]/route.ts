import { NextRequest, NextResponse } from 'next/server';
import { getMenuItems } from '@/lib/firebase/firestore';
import {
  getOrCreateChatSession,
  getChatSession,
  updateSessionOrder,
} from '@/lib/firebase/chat';
import { v4 as uuidv4 } from 'uuid';

// Default values (matches chat page)
const DEFAULT_RESTAURANT_ID = 'demo_restaurant';
const DEFAULT_TABLE_ID = 'table_1';
const DEFAULT_LANGUAGE = 'es';
const TAX_RATE = 0.08;

// Dynamic route: /api/elevenlabs/webhook/[tool]
// ElevenLabs calls each tool at its own URL path
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tool: string }> }
) {
  try {
    const { tool: tool_name } = await params;
    const body = await request.text();
    const parameters = body ? JSON.parse(body) : {};

    console.log(`[ElevenLabs Webhook] Tool: ${tool_name}, Params:`, JSON.stringify(parameters));

    const conversation_id = parameters.conversation_id;

    let result: any;

    switch (tool_name) {
      case 'get_menu':
        result = await handleGetMenu(parameters);
        break;
      case 'check_availability':
        result = await handleCheckAvailability(parameters);
        break;
      case 'add_to_order':
        result = await handleAddToOrder(parameters, conversation_id);
        break;
      case 'remove_from_order':
        result = await handleRemoveFromOrder(parameters, conversation_id);
        break;
      case 'get_order_summary':
        result = await handleGetOrderSummary(parameters, conversation_id);
        break;
      case 'get_recommendations':
        result = await handleGetRecommendations(parameters);
        break;
      case 'request_human_assistance':
        result = await handleRequestHumanAssistance(parameters);
        break;
      default:
        result = { error: `Unknown tool: ${tool_name}` };
    }

    console.log(`[ElevenLabs Webhook] Result:`, JSON.stringify(result));
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

function resolveSessionId(params: { sessionId?: string }, conversationId?: string): string {
  return params.sessionId || conversationId || `voice_${Date.now()}`;
}

async function handleGetMenu(params: { restaurantId?: string; categoryId?: string }) {
  const restaurantId = params.restaurantId || DEFAULT_RESTAURANT_ID;

  try {
    const items = await getMenuItems(restaurantId);

    const filteredItems = params.categoryId
      ? items.filter((item: any) => item.categoryId === params.categoryId)
      : items;

    return {
      success: true,
      items: filteredItems.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        available: item.availability?.isAvailable ?? true,
        allergens: item.allergens || [],
        dietaryFlags: item.dietaryFlags || [],
        imageUrl: item.imageUrl || null,
      })),
    };
  } catch (error) {
    return {
      success: true,
      items: [],
      message: 'Menu is currently loading',
    };
  }
}

async function handleCheckAvailability(params: { restaurantId?: string; itemId: string }) {
  const restaurantId = params.restaurantId || DEFAULT_RESTAURANT_ID;

  try {
    const items = await getMenuItems(restaurantId);
    const menuItem = items.find((item: any) => item.id === params.itemId);

    if (!menuItem) {
      return { success: false, isAvailable: false, message: 'Item not found' };
    }

    return {
      success: true,
      isAvailable: menuItem.availability?.isAvailable ?? true,
      itemName: menuItem.name,
    };
  } catch (error) {
    return {
      success: false,
      isAvailable: false,
      message: 'Could not check availability',
    };
  }
}

async function handleAddToOrder(
  params: {
    sessionId?: string;
    restaurantId?: string;
    itemId: string;
    quantity: number;
    modifiers?: string[];
    specialInstructions?: string;
  },
  conversationId?: string
) {
  const sessionId = resolveSessionId(params, conversationId);
  const restaurantId = params.restaurantId || DEFAULT_RESTAURANT_ID;
  const { itemId, quantity = 1 } = params;

  console.log(`[AddToOrder] sessionId=${sessionId}, restaurantId=${restaurantId}, itemId=${itemId}, qty=${quantity}`);

  try {
    const session = await getOrCreateChatSession(
      sessionId,
      restaurantId,
      DEFAULT_TABLE_ID,
      DEFAULT_LANGUAGE
    );

    const menuItems = await getMenuItems(restaurantId);
    console.log(`[AddToOrder] Menu items loaded: ${menuItems.length}`);

    let menuItem = menuItems.find((item: any) => item.id === itemId);

    if (!menuItem) {
      menuItem = menuItems.find((item: any) =>
        item.name?.en?.toLowerCase().includes(itemId?.toLowerCase()) ||
        item.name?.es?.toLowerCase().includes(itemId?.toLowerCase())
      );
    }

    if (!menuItem) {
      const availableNames = menuItems.map((m: any) => m.name?.en || m.id).join(', ');
      console.log(`[AddToOrder] Item not found: ${itemId}. Available: ${availableNames}`);
      return {
        success: false,
        message: `Item not found: ${itemId}. Available items: ${availableNames}`,
      };
    }

    console.log(`[AddToOrder] Found item: ${menuItem.name?.en}`);

    const order = session.currentOrder || { items: [], subtotal: 0, tax: 0, total: 0 };

    const existingIndex = order.items.findIndex((item: any) => item.menuItemId === menuItem.id);

    if (existingIndex >= 0) {
      order.items[existingIndex].quantity += quantity;
    } else {
      order.items.push({
        id: uuidv4(),
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
      });
    }

    order.subtotal = order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    order.tax = order.subtotal * TAX_RATE;
    order.total = order.subtotal + order.tax;

    await updateSessionOrder(sessionId, order);
    console.log(`[AddToOrder] Order saved. Total: $${order.total.toFixed(2)}, Items: ${order.items.length}`);

    return {
      success: true,
      message: `Added ${quantity}x ${menuItem.name?.en || menuItem.name} to your order. Order total: $${order.total.toFixed(2)}`,
      item: {
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: existingIndex >= 0 ? order.items[existingIndex].quantity : quantity,
        price: menuItem.price,
      },
      orderTotal: Math.round(order.total * 100) / 100,
    };
  } catch (error: any) {
    console.error('[AddToOrder] Error:', error);
    return {
      success: false,
      message: 'Failed to add item to order: ' + error.message,
    };
  }
}

async function handleRemoveFromOrder(
  params: {
    sessionId?: string;
    orderItemId?: string;
    itemId?: string;
  },
  conversationId?: string
) {
  const sessionId = resolveSessionId(params, conversationId);

  try {
    const session = await getChatSession(sessionId);

    if (!session?.currentOrder || session.currentOrder.items.length === 0) {
      return { success: false, message: 'Order is empty' };
    }

    const order = session.currentOrder;
    const itemIndex = order.items.findIndex(
      (item: any) => item.id === params.orderItemId || item.menuItemId === params.itemId
    );

    if (itemIndex === -1) {
      return { success: false, message: 'Item not found in order' };
    }

    const removedItem = order.items[itemIndex];
    order.items.splice(itemIndex, 1);

    order.subtotal = order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    order.tax = order.subtotal * TAX_RATE;
    order.total = order.subtotal + order.tax;

    await updateSessionOrder(sessionId, order.items.length > 0 ? order : null);

    return {
      success: true,
      message: `Removed ${removedItem.name?.en || removedItem.name} from your order`,
      orderTotal: Math.round(order.total * 100) / 100,
    };
  } catch (error: any) {
    console.error('[RemoveFromOrder] Error:', error);
    return {
      success: false,
      message: 'Failed to remove item from order',
    };
  }
}

async function handleGetOrderSummary(
  params: { sessionId?: string },
  conversationId?: string
) {
  const sessionId = resolveSessionId(params, conversationId);

  try {
    const session = await getChatSession(sessionId);
    const order = session?.currentOrder;

    if (!order || order.items.length === 0) {
      return {
        success: true,
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        itemCount: 0,
        message: 'Your order is empty',
      };
    }

    return {
      success: true,
      items: order.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        itemTotal: Math.round(item.price * item.quantity * 100) / 100,
      })),
      subtotal: Math.round(order.subtotal * 100) / 100,
      tax: Math.round(order.tax * 100) / 100,
      total: Math.round(order.total * 100) / 100,
      itemCount: order.items.length,
    };
  } catch (error: any) {
    console.error('[GetOrderSummary] Error:', error);
    return {
      success: false,
      message: 'Failed to get order summary',
    };
  }
}

async function handleGetRecommendations(params: {
  restaurantId?: string;
  type: 'pairing' | 'popular' | 'dietary';
}) {
  const restaurantId = params.restaurantId || DEFAULT_RESTAURANT_ID;

  try {
    const menuItems = await getMenuItems(restaurantId);
    const availableItems = menuItems.filter((item: any) => item.availability?.isAvailable !== false);

    const mains = availableItems.filter((item: any) => item.categoryId === 'mains');
    const starters = availableItems.filter((item: any) => item.categoryId === 'starters');
    const desserts = availableItems.filter((item: any) => item.categoryId === 'desserts');
    const drinks = availableItems.filter((item: any) => item.categoryId === 'drinks');

    let recommendations: Array<{ item: any; reason: string }> = [];

    if (params.type === 'popular' && mains.length > 0) {
      recommendations = [
        { item: mains[0], reason: 'Our most popular dish!' },
        ...(mains[1] ? [{ item: mains[1], reason: 'Customer favorite!' }] : []),
      ];
    } else if (params.type === 'pairing') {
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
  } catch (error) {
    return {
      success: false,
      recommendations: [],
      message: 'Unable to get recommendations at this time',
    };
  }
}

async function handleRequestHumanAssistance(params: {
  sessionId?: string;
  reason: string;
}) {
  console.log(`Human assistance requested for session ${params.sessionId}: ${params.reason}`);

  return {
    success: true,
    message: 'A server has been notified and will be with you shortly.',
    estimatedWait: '2-3 minutes',
  };
}
