'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  MessageSquare,
  Mic,
  UtensilsCrossed,
  ShoppingBag,
  Calendar,
  User,
  Loader2,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const t = useTranslations();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const quickActions = [
    {
      icon: MessageSquare,
      title: t('ai.title'),
      description: t('home.features.aiChat.description'),
      href: '/chat',
      color: 'bg-blue-500',
    },
    {
      icon: Mic,
      title: t('home.features.voice.title'),
      description: t('home.features.voice.description'),
      href: '/chat?mode=voice',
      color: 'bg-purple-500',
    },
    {
      icon: UtensilsCrossed,
      title: t('menu.title'),
      description: t('home.features.menu.description'),
      href: '/menu',
      color: 'bg-orange-500',
    },
    {
      icon: ShoppingBag,
      title: t('order.title'),
      description: t('order.empty'),
      href: '/orders',
      color: 'bg-green-500',
    },
    {
      icon: Calendar,
      title: t('reservation.title'),
      description: t('home.features.reservations.description'),
      href: '/reservations',
      color: 'bg-pink-500',
    },
    {
      icon: User,
      title: t('account.title'),
      description: t('account.preferences'),
      href: '/account',
      color: 'bg-gray-500',
    },
  ];

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            {t('common.welcome')}, {user.displayName}!
          </h1>
          <p className="text-muted-foreground">
            {t('home.heroDescription')}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader className="pb-2">
                  <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-2`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="flex items-center justify-between">
                    {action.title}
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {action.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* AI Chat Promo */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{t('ai.greeting')}</h3>
                <p className="text-muted-foreground text-sm">
                  {t('ai.placeholder')}
                </p>
              </div>
            </div>
            <Link href="/chat">
              <Button size="lg" className="gap-2">
                {t('ai.title')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('common.totalOrders')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{user.stats?.totalOrders || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('common.totalSpent')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${(user.stats?.totalSpent || 0).toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('common.avgOrder')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${(user.stats?.averageOrderValue || 0).toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
