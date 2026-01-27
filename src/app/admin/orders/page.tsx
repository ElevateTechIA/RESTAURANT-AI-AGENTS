'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Clock,
  CheckCircle,
  UtensilsCrossed,
  AlertCircle,
  Eye,
  ChefHat,
  Truck,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  tax: number;
  tip: number;
  status: string;
  createdAt: any;
  updatedAt: any;
  paymentStatus: string;
}

export default function OrdersManagementPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Demo restaurant ID
  const restaurantId = 'demo_restaurant';

  // Fetch orders from API
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders?restaurantId=${restaurantId}&limit=50`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error(locale === 'es' ? 'Error al cargar pedidos' : 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      preparing: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      ready: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      served: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      paid: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'preparing':
        return <ChefHat className="h-4 w-4" />;
      case 'ready':
        return <UtensilsCrossed className="h-4 w-4" />;
      case 'served':
        return <Truck className="h-4 w-4" />;
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <X className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTimeAgo = (dateValue: any) => {
    let date: Date;
    if (!dateValue) {
      return '-';
    } else if (dateValue._seconds) {
      date = new Date(dateValue._seconds * 1000);
    } else if (dateValue.seconds) {
      date = new Date(dateValue.seconds * 1000);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      date = new Date(dateValue);
    } else {
      return '-';
    }

    if (isNaN(date.getTime())) {
      return '-';
    }

    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMinutes < 1) return locale === 'es' ? 'Ahora' : 'Now';
    if (diffMinutes < 60) return `${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  // Helper to get table display name
  const getTableName = (tableId: string) => {
    if (!tableId) return '-';
    // Convert table_1 to Mesa 1, etc.
    const match = tableId.match(/table_(\d+)/i);
    if (match) {
      return `Mesa ${match[1]}`;
    }
    return tableId;
  };

  // Helper to get item name
  const getItemName = (name: any) => {
    if (typeof name === 'object' && name !== null) {
      return name[locale] || name.en || name.es || 'Item';
    }
    return name || 'Item';
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getTableName(order.tableId).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // Update local state
      setOrders(orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      toast.success(
        locale === 'es'
          ? `Pedido actualizado a ${t(`order.status.${newStatus}`)}`
          : `Order updated to ${t(`order.status.${newStatus}`)}`
      );
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(locale === 'es' ? 'Error al actualizar el pedido' : 'Failed to update order');
    }
  };

  const orderCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    ready: orders.filter((o) => o.status === 'ready').length,
    served: orders.filter((o) => o.status === 'served').length,
    paid: orders.filter((o) => o.status === 'paid').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('navigation.orders')}</h1>
          <p className="text-muted-foreground">
            {locale === 'es' ? 'Gestiona todos los pedidos del restaurante' : 'Manage all restaurant orders'}
          </p>
        </div>
        <Button variant="outline" onClick={fetchOrders} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {locale === 'es' ? 'Actualizar' : 'Refresh'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{orderCounts.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 dark:border-orange-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Preparando</p>
                <p className="text-2xl font-bold">{orderCounts.preparing}</p>
              </div>
              <ChefHat className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Listos</p>
                <p className="text-2xl font-bold">{orderCounts.ready}</p>
              </div>
              <UtensilsCrossed className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Servidos</p>
                <p className="text-2xl font-bold">{orderCounts.served}</p>
              </div>
              <Truck className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pagados</p>
                <p className="text-2xl font-bold">{orderCounts.paid}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID o mesa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">Todos ({orderCounts.all})</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="preparing">Preparando</TabsTrigger>
            <TabsTrigger value="ready">Listos</TabsTrigger>
            <TabsTrigger value="served">Servidos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">#{order.id.slice(0, 8).toUpperCase()}</CardTitle>
                    <CardDescription>{getTableName(order.tableId)}</CardDescription>
                  </div>
                  <Badge
                    className={`${getStatusColor(order.status)} flex items-center gap-1`}
                  >
                    {getStatusIcon(order.status)}
                    {t(`order.status.${order.status}`)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {getItemName(item.name)}
                        {item.notes && (
                          <span className="text-muted-foreground ml-1">
                            ({item.notes})
                          </span>
                        )}
                      </span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {getTimeAgo(order.createdAt)}
                  </div>
                  <p className="font-bold">${order.total.toFixed(2)}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {locale === 'es' ? 'Ver' : 'View'}
                  </Button>
                  {order.status === 'pending' && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                    >
                      <ChefHat className="h-4 w-4 mr-1" />
                      {locale === 'es' ? 'Preparar' : 'Prepare'}
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                    >
                      <UtensilsCrossed className="h-4 w-4 mr-1" />
                      {locale === 'es' ? 'Listo' : 'Ready'}
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => updateOrderStatus(order.id, 'served')}
                    >
                      <Truck className="h-4 w-4 mr-1" />
                      {locale === 'es' ? 'Servir' : 'Serve'}
                    </Button>
                  )}
                  {order.status === 'served' && (
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => updateOrderStatus(order.id, 'paid')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {locale === 'es' ? 'Pagado' : 'Paid'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredOrders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {locale === 'es' ? 'No se encontraron pedidos' : 'No orders found'}
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>#{selectedOrder.id.slice(0, 8).toUpperCase()}</span>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {t(`order.status.${selectedOrder.status}`)}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {getTableName(selectedOrder.tableId)} • {getTimeAgo(selectedOrder.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">{locale === 'es' ? 'Items del pedido' : 'Order items'}</h4>
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between p-2 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {item.quantity}x {getItemName(item.name)}
                        </p>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground">
                            {locale === 'es' ? 'Nota' : 'Note'}: {item.notes}
                          </p>
                        )}
                      </div>
                      <p className="font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>{t('order.subtotal')}</span>
                    <span>${selectedOrder.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('order.tax')}</span>
                    <span>${selectedOrder.tax?.toFixed(2) || '0.00'}</span>
                  </div>
                  {selectedOrder.tip > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>{t('order.tip')}</span>
                      <span>${selectedOrder.tip?.toFixed(2) || '0.00'}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-2">
                    <span>Total</span>
                    <span className="text-lg">${selectedOrder.total?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">{locale === 'es' ? 'Cambiar estado' : 'Change status'}</h4>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => {
                      updateOrderStatus(selectedOrder.id, value);
                      setSelectedOrder({ ...selectedOrder, status: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{t('order.status.pending')}</SelectItem>
                      <SelectItem value="confirmed">{t('order.status.confirmed')}</SelectItem>
                      <SelectItem value="preparing">{t('order.status.preparing')}</SelectItem>
                      <SelectItem value="ready">{t('order.status.ready')}</SelectItem>
                      <SelectItem value="served">{t('order.status.served')}</SelectItem>
                      <SelectItem value="paid">{t('order.status.paid')}</SelectItem>
                      <SelectItem value="cancelled">{t('order.status.cancelled')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
