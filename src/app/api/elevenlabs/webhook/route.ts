import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/elevenlabs/client';
import { getMenuItems, getDocument, updateDocument } from '@/lib/firebase/firestore';

// Webhook endpoint for ElevenLabs server tools
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const payload = JSON.parse(body);

    // Verify webhook signature in production
    // const signature = request.headers.get('x-elevenlabs-signature') || '';
    // const timestamp = request.headers.get('x-elevenlabs-timestamp') || '';
    // if (!verifyWebhookSignature(signature, timestamp, body, process.env.ELEVENLABS_WEBHOOK_SECRET!)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const { tool_name, parameters, conversation_id, agent_id } = payload;

    let result: any;

    switch (tool_name) {
      case 'get_menu':
        result = await handleGetMenu(parameters);
        break;
      case 'check_availability':
        result = await handleCheckAvailability(parameters);
        break;
      case 'add_to_order':
        result = await handleAddToOrder(parameters);
        break;
      case 'remove_from_order':
        result = await handleRemoveFromOrder(parameters);
        break;
      case 'get_order_summary':
        result = await handleGetOrderSummary(parameters);
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

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleGetMenu(params: { restaurantId: string; categoryId?: string }) {
  const { restaurantId, categoryId } = params;

  try {
    const items = await getMenuItems(restaurantId);

    // Filter by category if provided
    const filteredItems = categoryId
      ? items.filter((item: any) => item.categoryId === categoryId)
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
      success: true, // Return success with empty array to not break the conversation
      items: [],
      message: 'Menu is currently loading',
    };
  }
}

async function handleCheckAvailability(params: { restaurantId: string; itemId: string }) {
  const { restaurantId, itemId } = params;

  try {
    // In production, check actual availability
    return {
      success: true,
      isAvailable: true,
      stockCount: null,
    };
  } catch (error) {
    return {
      success: false,
      isAvailable: false,
      message: 'Could not check availability',
    };
  }
}

async function handleAddToOrder(params: {
  sessionId: string;
  itemId: string;
  quantity: number;
  modifiers?: string[];
  specialInstructions?: string;
}) {
  const { sessionId, itemId, quantity, modifiers, specialInstructions } = params;

  try {
    // TODO: Implement actual order creation/update
    return {
      success: true,
      message: `Added ${quantity} item(s) to your order`,
      item: {
        id: `item-${Date.now()}`,
        menuItemId: itemId,
        quantity,
        modifiers: modifiers || [],
        specialInstructions: specialInstructions || '',
      },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to add item to order',
    };
  }
}

async function handleRemoveFromOrder(params: {
  sessionId: string;
  orderItemId: string;
}) {
  const { sessionId, orderItemId } = params;

  try {
    // TODO: Implement actual order item removal
    return {
      success: true,
      message: 'Item removed from your order',
      removedItemId: orderItemId,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to remove item from order',
    };
  }
}

async function handleGetOrderSummary(params: { sessionId: string }) {
  const { sessionId } = params;

  try {
    // TODO: Fetch actual order from database
    return {
      success: true,
      items: [],
      subtotal: 0,
      tax: 0,
      tip: 0,
      total: 0,
      itemCount: 0,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to get order summary',
    };
  }
}

async function handleGetRecommendations(params: {
  sessionId: string;
  type: 'pairing' | 'popular' | 'dietary';
}) {
  const { sessionId, type } = params;

  try {
    // TODO: Implement actual recommendation logic based on:
    // - Current order items (for pairing)
    // - Order history (for popular)
    // - User dietary preferences
    return {
      success: true,
      recommendations: [
        {
          itemId: 'rec-1',
          name: "Chef's Special",
          reason:
            type === 'popular'
              ? 'Our most popular dish this week!'
              : type === 'pairing'
              ? 'This pairs wonderfully with your selection'
              : 'Matches your dietary preferences',
        },
      ],
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
  sessionId: string;
  reason: string;
}) {
  const { sessionId, reason } = params;

  try {
    // TODO: Implement actual staff notification
    // - Send push notification to server's device
    // - Update table status in dashboard
    // - Log the request
    console.log(`Human assistance requested for session ${sessionId}: ${reason}`);

    return {
      success: true,
      message: 'A server has been notified and will be with you shortly.',
      estimatedWait: '2-3 minutes',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Unable to contact a server. Please flag down a staff member.',
    };
  }
}
