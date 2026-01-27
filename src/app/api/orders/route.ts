import { NextRequest, NextResponse } from 'next/server';
import {
  createOrder,
  getCustomerOrders,
  getSessionOrders,
  getRestaurantOrders,
  updateOrderStatus,
  Order,
  OrderItem,
  OrderStatus,
} from '@/lib/firebase/orders';
import { getChatSession, updateSessionOrder } from '@/lib/firebase/chat';
import { v4 as uuidv4 } from 'uuid';

// POST - Create a new order (from chat session OR directly from cart)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      restaurantId,
      tableId,
      customerId,
      tip = 0,
      specialInstructions,
      source = 'chat', // 'chat' or 'menu'
      items: directItems, // Items passed directly (for menu/cart orders)
      subtotal: directSubtotal,
      tax: directTax,
      total: directTotal,
    } = body;

    if (!restaurantId || !tableId) {
      return NextResponse.json(
        { error: 'Missing required fields: restaurantId, tableId' },
        { status: 400 }
      );
    }

    let orderItems: OrderItem[];
    let subtotal: number;
    let tax: number;
    let total: number;

    if (source === 'menu' && directItems && directItems.length > 0) {
      // Order created directly from menu/cart
      orderItems = directItems.map((item: any) => ({
        id: uuidv4(),
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        modifiers: [],
        specialInstructions: '',
      }));
      subtotal = directSubtotal;
      tax = directTax;
      total = directTotal || (subtotal + tax + tip);
    } else if (sessionId) {
      // Order created from chat session
      const chatSession = await getChatSession(sessionId);

      if (!chatSession || !chatSession.currentOrder || chatSession.currentOrder.items.length === 0) {
        return NextResponse.json(
          { error: 'No items in order' },
          { status: 400 }
        );
      }

      const { currentOrder } = chatSession;

      orderItems = currentOrder.items.map((item) => ({
        id: uuidv4(),
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        modifiers: [],
        specialInstructions: '',
      }));

      subtotal = currentOrder.subtotal;
      tax = currentOrder.tax;
      total = subtotal + tax + tip;

      // Clear the chat session order
      await updateSessionOrder(sessionId, null);
    } else {
      return NextResponse.json(
        { error: 'No items provided. Either provide items directly or a sessionId with items.' },
        { status: 400 }
      );
    }

    // Create the order
    const order = await createOrder({
      restaurantId,
      tableId,
      sessionId: sessionId || null,
      customerId: customerId || null,
      items: orderItems,
      subtotal,
      tax,
      tip,
      total,
      status: 'pending',
      paymentMethod: null,
      paymentStatus: 'pending',
      specialInstructions: specialInstructions || null,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        tip: order.tip,
        total: order.total,
      },
      message: 'Order submitted successfully',
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}

// GET - Get orders (for customer or restaurant)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const sessionId = searchParams.get('sessionId');
    const restaurantId = searchParams.get('restaurantId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    let orders: Order[] = [];

    if (customerId) {
      // Get orders for authenticated customer
      orders = await getCustomerOrders(customerId, limit);
    } else if (sessionId) {
      // Get orders for anonymous session
      orders = await getSessionOrders(sessionId, limit);
    } else if (restaurantId) {
      // Get orders for restaurant (admin view)
      const statusArray = status ? status.split(',') as Order['status'][] : undefined;
      orders = await getRestaurantOrders(restaurantId, statusArray, limit);
    } else {
      return NextResponse.json(
        { error: 'Must provide customerId, sessionId, or restaurantId' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,
        restaurantId: order.restaurantId,
        tableId: order.tableId,
        status: order.status,
        items: order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal: order.subtotal,
        tax: order.tax,
        tip: order.tip,
        total: order.total,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get orders' },
      { status: 500 }
    );
  }
}

// PATCH - Update order status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, status' },
        { status: 400 }
      );
    }

    const validStatuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'delivered', 'paid', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    await updateOrderStatus(orderId, status);

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}`,
    });
  } catch (error: any) {
    console.error('Update order status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}
