'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingBag,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Truck,
  Receipt,
  CreditCard,
  RefreshCw,
} from 'lucide-react';

interface OrderItem {
  name: string | { en: string; es: string };
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  restaurantId: string;
  tableId: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'bg-yellow-500', labelKey: 'pending' },
  confirmed: { icon: CheckCircle, color: 'bg-blue-400', labelKey: 'confirmed' },
  preparing: { icon: ChefHat, color: 'bg-blue-500', labelKey: 'preparing' },
  ready: { icon: CheckCircle, color: 'bg-green-500', labelKey: 'ready' },
  served: { icon: Truck, color: 'bg-green-600', labelKey: 'served' },
  paid: { icon: CreditCard, color: 'bg-gray-500', labelKey: 'paid' },
  cancelled: { icon: XCircle, color: 'bg-red-500', labelKey: 'cancelled' },
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations();
  const locale = useLocale();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders from API
  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let url = '/api/orders?';

      if (user) {
        // Authenticated user - fetch by customerId
        url += `customerId=${user.id}`;
      } else {
        // Anonymous user - fetch by sessionId from localStorage
        const sessionId = localStorage.getItem('chat_session_id');
        if (sessionId) {
          url += `sessionId=${sessionId}`;
        } else {
          // No session, no orders to show
          setOrders([]);
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchOrders();
    }
  }, [user, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatDate = (dateValue: any) => {
    let date: Date;

    // Handle different date formats
    if (!dateValue) {
      return '-';
    } else if (dateValue._seconds) {
      // Firestore Timestamp object
      date = new Date(dateValue._seconds * 1000);
    } else if (dateValue.seconds) {
      // Firestore Timestamp (alternative format)
      date = new Date(dateValue.seconds * 1000);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      date = new Date(dateValue);
    } else {
      return '-';
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '-';
    }

    return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShoppingBag className="h-8 w-8" />
              {t('order.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('order.history')}
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={fetchOrders}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="py-4 text-center text-destructive">
              {error}
              <Button variant="link" onClick={fetchOrders} className="ml-2">
                {t('common.retry')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {!error && orders.length === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <Receipt className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('order.empty')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('order.emptyDescription') || 'Start ordering from our menu'}
              </p>
              <Button onClick={() => router.push('/menu')}>
                {t('menu.title')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              return (
                <Card key={order.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          #{order.id.slice(0, 8)}
                        </CardTitle>
                        {order.tableId && (
                          <Badge variant="outline">{order.tableId}</Badge>
                        )}
                      </div>
                      <Badge className={`${statusConfig.color} text-white`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {t(`order.status.${statusConfig.labelKey}`)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {formatDate(order.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>
                            {item.quantity}x {typeof item.name === 'object' ? item.name[locale as 'en' | 'es'] || item.name.en : item.name}
                          </span>
                          <span className="text-muted-foreground">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-2 space-y-1 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>{t('order.subtotal')}</span>
                          <span>${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>{t('order.tax')}</span>
                          <span>${order.tax.toFixed(2)}</span>
                        </div>
                        {order.tip > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>{t('order.tip')}</span>
                            <span>${order.tip.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold text-base pt-1">
                          <span>{t('order.total')}</span>
                          <span>${order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
