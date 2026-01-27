'use client';

import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ShoppingBag,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  UtensilsCrossed,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Demo data for the dashboard
const DEMO_STATS = {
  todayOrders: 47,
  todayRevenue: 2847.50,
  activeCustomers: 23,
  avgOrderValue: 60.58,
};

const DEMO_RECENT_ORDERS = [
  { id: 'ORD-001', table: 5, items: 3, total: 45.99, status: 'preparing', time: '5 min ago' },
  { id: 'ORD-002', table: 12, items: 2, total: 28.50, status: 'ready', time: '8 min ago' },
  { id: 'ORD-003', table: 3, items: 5, total: 89.99, status: 'served', time: '15 min ago' },
  { id: 'ORD-004', table: 8, items: 1, total: 12.99, status: 'pending', time: '2 min ago' },
  { id: 'ORD-005', table: 1, items: 4, total: 67.50, status: 'preparing', time: '10 min ago' },
];

const DEMO_POPULAR_ITEMS = [
  { name: 'Grilled Salmon', orders: 24, revenue: 599.76 },
  { name: 'Caesar Salad', orders: 18, revenue: 233.82 },
  { name: 'Pasta Primavera', orders: 15, revenue: 284.85 },
  { name: 'Chocolate Cake', orders: 12, revenue: 119.88 },
];

export default function AdminDashboardPage() {
  const t = useTranslations();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      preparing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      ready: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      served: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'preparing':
        return <UtensilsCrossed className="h-3 w-3" />;
      case 'ready':
        return <CheckCircle className="h-3 w-3" />;
      case 'served':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">{t('admin.dashboard')}</h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('navigation.orders')}
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{DEMO_STATS.todayOrders}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +12% vs ayer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${DEMO_STATS.todayRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +8% vs ayer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{DEMO_STATS.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">En el restaurante ahora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pedido Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${DEMO_STATS.avgOrderValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +5% vs semana pasada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Popular Items */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recientes</CardTitle>
            <CardDescription>Últimos pedidos del día</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {DEMO_RECENT_ORDERS.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{order.id}</p>
                      <p className="text-sm text-muted-foreground">
                        Mesa {order.table} • {order.items} items
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${order.total.toFixed(2)}</p>
                    <Badge
                      variant="secondary"
                      className={`${getStatusColor(order.status)} text-xs`}
                    >
                      <span className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {t(`order.status.${order.status}`)}
                      </span>
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Popular Items */}
        <Card>
          <CardHeader>
            <CardTitle>Items Populares</CardTitle>
            <CardDescription>Más vendidos hoy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {DEMO_POPULAR_ITEMS.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.orders} pedidos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${item.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Accesos directos a funciones comunes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <a
              href="/admin/menu"
              className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              <span className="font-medium">{t('admin.menuManagement')}</span>
            </a>
            <a
              href="/admin/orders"
              className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <ShoppingBag className="h-5 w-5 text-primary" />
              <span className="font-medium">{t('navigation.orders')}</span>
            </a>
            <a
              href="/admin/tables"
              className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <Users className="h-5 w-5 text-primary" />
              <span className="font-medium">{t('admin.tables')}</span>
            </a>
            <a
              href="/admin/analytics"
              className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-medium">{t('admin.analytics')}</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
