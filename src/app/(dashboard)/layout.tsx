'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ThemeSwitcher } from '@/components/common/ThemeSwitcher';
import { LanguageSwitcherSimple } from '@/components/common/LanguageSwitcherSimple';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const t = useTranslations();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Restaurant AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcherSimple />
            <ThemeSwitcher />
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user.displayName || user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  {t('auth.logout')}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <main className="flex-1">
          <CartProvider>{children}</CartProvider>
        </main>
      <footer className="py-4 text-center text-sm text-muted-foreground border-t">
        <p>Restaurant AI Agents</p>
      </footer>
    </div>
  );
}
