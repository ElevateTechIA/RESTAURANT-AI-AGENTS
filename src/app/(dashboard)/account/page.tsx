'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Phone,
  Shield,
  Bell,
  Palette,
  Globe,
  LogOut,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { changeLocale } from '@/components/providers/IntlProvider';

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, signOut, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const t = useTranslations();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success(t('account.preferencesSaved'));
      router.push('/login');
    } catch (error) {
      toast.error(t('errors.tryAgain'));
    }
  };

  const handlePreferenceChange = async (
    key: string,
    value: string | boolean
  ) => {
    if (!user) return;
    try {
      await updateUser({
        preferences: {
          ...user.preferences,
          [key]: value,
        },
      });
      toast.success(t('account.preferencesSaved'));
    } catch (error) {
      toast.error(t('errors.tryAgain'));
    }
  };

  const handleLanguageChange = (value: string) => {
    // Update user preference in database
    handlePreferenceChange('language', value);
    // Also update the app language
    changeLocale(value as 'en' | 'es');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      customer: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      server: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      manager: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      admin: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      superadmin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[role] || colors.customer;
  };

  const roleLabels: Record<string, string> = {
    customer: t('common.customer') || 'Customer',
    server: t('common.server') || 'Server',
    manager: t('common.manager') || 'Manager',
    admin: t('common.admin') || 'Admin',
    superadmin: t('common.superadmin') || 'Super Admin',
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('account.title')}</h1>
            <p className="text-muted-foreground">
              {t('account.preferences')}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            {t('auth.logout')}
          </Button>
        </div>

        <Separator />

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('account.profile')}
            </CardTitle>
            <CardDescription>
              {t('auth.displayName')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.photoUrl || undefined} />
                <AvatarFallback className="text-lg">
                  {getInitials(user.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">{user.displayName}</h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                      user.role
                    )}`}
                  >
                    {roleLabels[user.role] || user.role}
                  </span>
                  {user.isVerified && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {t('common.verified') || 'Verified'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('auth.phone')}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={user.phone || t('common.notProvided') || 'Not provided'}
                    disabled
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t('account.preferences')}
            </CardTitle>
            <CardDescription>
              {t('account.dietary')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t('account.language')}
                </Label>
                <Select
                  value={user.preferences.language}
                  onValueChange={handleLanguageChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('account.language')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  {t('account.theme')}
                </Label>
                <Select
                  value={theme || 'system'}
                  onValueChange={setTheme}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('account.theme')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t('account.themes.light')}</SelectItem>
                    <SelectItem value="dark">{t('account.themes.dark')}</SelectItem>
                    <SelectItem value="system">{t('account.themes.system')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('account.notifications')}
            </CardTitle>
            <CardDescription>
              {t('account.marketing')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('common.pushNotifications') || 'Push Notifications'}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('common.pushNotificationsDesc') || 'Receive notifications in your browser'}
                </p>
              </div>
              <Switch
                checked={user.preferences.pushNotifications}
                onCheckedChange={(checked) =>
                  handlePreferenceChange('pushNotifications', checked)
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('common.smsNotifications') || 'SMS Notifications'}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('common.smsNotificationsDesc') || 'Receive order updates via SMS'}
                </p>
              </div>
              <Switch
                checked={user.preferences.smsNotifications}
                onCheckedChange={(checked) =>
                  handlePreferenceChange('smsNotifications', checked)
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('common.emailMarketing') || 'Email Marketing'}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('common.emailMarketingDesc') || 'Receive promotions and news via email'}
                </p>
              </div>
              <Switch
                checked={user.preferences.emailMarketing}
                onCheckedChange={(checked) =>
                  handlePreferenceChange('emailMarketing', checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('account.orderHistory')}
            </CardTitle>
            <CardDescription>
              {t('common.summary') || 'Your activity summary'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{user.stats.totalOrders}</p>
                <p className="text-sm text-muted-foreground">{t('common.totalOrders') || 'Total Orders'}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">
                  ${user.stats.totalSpent.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">{t('common.totalSpent') || 'Total Spent'}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">
                  ${user.stats.averageOrderValue.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">{t('common.avgOrder') || 'Avg. Order'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
