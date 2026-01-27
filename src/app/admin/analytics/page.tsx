'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
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
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Clock,
  Star,
  Calendar,
} from 'lucide-react';

// Demo analytics data
const DEMO_STATS = {
  revenue: {
    today: 2847.50,
    yesterday: 2634.25,
    thisWeek: 18450.75,
    thisMonth: 67892.50,
  },
  orders: {
    today: 47,
    yesterday: 42,
    thisWeek: 312,
    thisMonth: 1245,
  },
  avgOrderValue: {
    today: 60.58,
    yesterday: 62.72,
    thisWeek: 59.13,
    thisMonth: 54.53,
  },
  customers: {
    today: 38,
    newThisWeek: 24,
    returning: 67,
    total: 1892,
  },
};

const DEMO_TOP_ITEMS = [
  { name: 'Grilled Salmon', orders: 156, revenue: 3898.44, trend: 12 },
  { name: 'Pasta Primavera', orders: 134, revenue: 2544.66, trend: 8 },
  { name: 'Caesar Salad', orders: 128, revenue: 1662.72, trend: -3 },
  { name: 'Chocolate Cake', orders: 98, revenue: 979.02, trend: 15 },
  { name: 'Tomato Soup', orders: 87, revenue: 782.13, trend: 5 },
];

const DEMO_HOURLY_DATA = [
  { hour: '10:00', orders: 5, revenue: 287.50 },
  { hour: '11:00', orders: 8, revenue: 456.75 },
  { hour: '12:00', orders: 18, revenue: 1089.25 },
  { hour: '13:00', orders: 25, revenue: 1524.50 },
  { hour: '14:00', orders: 15, revenue: 892.00 },
  { hour: '15:00', orders: 8, revenue: 478.25 },
  { hour: '16:00', orders: 6, revenue: 345.75 },
  { hour: '17:00', orders: 10, revenue: 612.50 },
  { hour: '18:00', orders: 22, revenue: 1345.00 },
  { hour: '19:00', orders: 32, revenue: 1945.75 },
  { hour: '20:00', orders: 28, revenue: 1698.50 },
  { hour: '21:00', orders: 18, revenue: 1089.25 },
];

const DEMO_WEEKLY_DATA = [
  { day: 'Lun', orders: 42, revenue: 2534.50 },
  { day: 'Mar', orders: 38, revenue: 2289.75 },
  { day: 'Mié', orders: 45, revenue: 2712.25 },
  { day: 'Jue', orders: 48, revenue: 2892.00 },
  { day: 'Vie', orders: 62, revenue: 3745.50 },
  { day: 'Sáb', orders: 78, revenue: 4698.25 },
  { day: 'Dom', orders: 65, revenue: 3912.75 },
];

export default function AnalyticsPage() {
  const t = useTranslations();
  const [period, setPeriod] = useState('today');

  const getPercentChange = (current: number, previous: number) => {
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const revenueChange = parseFloat(getPercentChange(DEMO_STATS.revenue.today, DEMO_STATS.revenue.yesterday));
  const ordersChange = parseFloat(getPercentChange(DEMO_STATS.orders.today, DEMO_STATS.orders.yesterday));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.analytics')}</h1>
          <p className="text-muted-foreground">
            Estadísticas y métricas del restaurante
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoy</SelectItem>
            <SelectItem value="week">Esta Semana</SelectItem>
            <SelectItem value="month">Este Mes</SelectItem>
            <SelectItem value="year">Este Año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${DEMO_STATS.revenue.today.toFixed(2)}
            </div>
            <p className={`text-xs flex items-center gap-1 ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {revenueChange >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {revenueChange >= 0 ? '+' : ''}{revenueChange}% vs ayer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{DEMO_STATS.orders.today}</div>
            <p className={`text-xs flex items-center gap-1 ${ordersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {ordersChange >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {ordersChange >= 0 ? '+' : ''}{ordersChange}% vs ayer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${DEMO_STATS.avgOrderValue.today.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              ${DEMO_STATS.avgOrderValue.thisMonth.toFixed(2)} promedio mensual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{DEMO_STATS.customers.today}</div>
            <p className="text-xs text-muted-foreground">
              {DEMO_STATS.customers.newThisWeek} nuevos esta semana
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hourly Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Actividad por Hora
            </CardTitle>
            <CardDescription>Pedidos e ingresos durante el día</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DEMO_HOURLY_DATA.map((data) => (
                <div key={data.hour} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-12">
                    {data.hour}
                  </span>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${(data.orders / 32) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-16 text-right">
                    {data.orders} ord
                  </span>
                  <span className="text-sm text-muted-foreground w-20 text-right">
                    ${data.revenue.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Actividad Semanal
            </CardTitle>
            <CardDescription>Rendimiento de la semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {DEMO_WEEKLY_DATA.map((data) => (
                <div key={data.day} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-10">{data.day}</span>
                  <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-primary/80 rounded-lg transition-all flex items-center justify-end pr-2"
                      style={{
                        width: `${(data.orders / 78) * 100}%`,
                      }}
                    >
                      <span className="text-xs text-primary-foreground font-medium">
                        {data.orders}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-medium w-24 text-right">
                    ${data.revenue.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Items */}
      <Card>
        <CardHeader>
          <CardTitle>Items Más Vendidos</CardTitle>
          <CardDescription>
            Productos con mejor rendimiento este mes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DEMO_TOP_ITEMS.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.orders} pedidos
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${item.revenue.toFixed(2)}</p>
                  <p className={`text-xs flex items-center justify-end gap-1 ${item.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.trend >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {item.trend >= 0 ? '+' : ''}{item.trend}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Esta Semana</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ingresos</span>
              <span className="font-medium">${DEMO_STATS.revenue.thisWeek.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pedidos</span>
              <span className="font-medium">{DEMO_STATS.orders.thisWeek}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ticket Prom.</span>
              <span className="font-medium">${DEMO_STATS.avgOrderValue.thisWeek.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Este Mes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ingresos</span>
              <span className="font-medium">${DEMO_STATS.revenue.thisMonth.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pedidos</span>
              <span className="font-medium">{DEMO_STATS.orders.thisMonth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ticket Prom.</span>
              <span className="font-medium">${DEMO_STATS.avgOrderValue.thisMonth.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Clientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">{DEMO_STATS.customers.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nuevos (semana)</span>
              <span className="font-medium">{DEMO_STATS.customers.newThisWeek}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recurrentes</span>
              <span className="font-medium">{DEMO_STATS.customers.returning}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
