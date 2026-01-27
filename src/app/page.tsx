'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/common/ThemeSwitcher';
import { LanguageSwitcherSimple } from '@/components/common/LanguageSwitcherSimple';
import {
  MessageSquare,
  Mic,
  QrCode,
  UtensilsCrossed,
  Calendar,
  BarChart3,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const t = useTranslations();

  // Redirect logged-in users to the appropriate dashboard
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin' || user.role === 'superadmin' || user.role === 'manager') {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, router]);

  const features = [
    {
      icon: MessageSquare,
      title: t('home.features.aiChat.title'),
      description: t('home.features.aiChat.description'),
    },
    {
      icon: Mic,
      title: t('home.features.voice.title'),
      description: t('home.features.voice.description'),
    },
    {
      icon: QrCode,
      title: t('home.features.qrCode.title'),
      description: t('home.features.qrCode.description'),
    },
    {
      icon: UtensilsCrossed,
      title: t('home.features.menu.title'),
      description: t('home.features.menu.description'),
    },
    {
      icon: Calendar,
      title: t('home.features.reservations.title'),
      description: t('home.features.reservations.description'),
    },
    {
      icon: BarChart3,
      title: t('home.features.analytics.title'),
      description: t('home.features.analytics.description'),
    },
  ];

  // Show loading state while checking auth or redirecting
  if (loading || user) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <UtensilsCrossed className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">Restaurant AI</span>
            </Link>
            <div className="flex items-center space-x-4">
              <LanguageSwitcherSimple />
              <ThemeSwitcher />
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Restaurant AI</span>
          </Link>

          <div className="flex items-center space-x-4">
            <LanguageSwitcherSimple />
            <ThemeSwitcher />
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  {t('home.signIn')}
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">{t('home.getStarted')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            {t('home.heroTitle')}{' '}
            <span className="text-primary">{t('home.heroTitleHighlight')}</span>
            {t('home.heroTitleEnd') && ` ${t('home.heroTitleEnd')}`}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('home.heroDescription')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                {t('home.startFreeTrial')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                {t('home.signIn')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t('home.featuresTitle')}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-background">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t('home.howItWorksTitle')}
          </h2>
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {t('home.howItWorks.step1.title')}
                </h3>
                <p className="text-muted-foreground">
                  {t('home.howItWorks.step1.description')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {t('home.howItWorks.step2.title')}
                </h3>
                <p className="text-muted-foreground">
                  {t('home.howItWorks.step2.description')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {t('home.howItWorks.step3.title')}
                </h3>
                <p className="text-muted-foreground">
                  {t('home.howItWorks.step3.description')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {t('home.howItWorks.step4.title')}
                </h3>
                <p className="text-muted-foreground">
                  {t('home.howItWorks.step4.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">
            {t('home.ctaTitle')}
          </h2>
          <p className="text-lg mb-8 opacity-90">
            {t('home.ctaDescription')}
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="gap-2">
              {t('home.getStartedFree')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              <span className="font-semibold">Restaurant AI Agents</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground">
                {t('home.footer.terms')}
              </Link>
              <Link href="/privacy" className="hover:text-foreground">
                {t('home.footer.privacy')}
              </Link>
              <Link href="/contact" className="hover:text-foreground">
                {t('home.footer.contact')}
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('home.footer.poweredBy')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
