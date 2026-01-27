'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { AIChat } from '@/components/features/ai/AIChat';
import { VoiceAgent } from '@/components/features/ai/VoiceAgent';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MessageSquare, Mic, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const t = useTranslations();

  // Get locale from localStorage or default to 'en'
  const [locale, setLocale] = useState<'en' | 'es'>('en');
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLocale = localStorage.getItem('locale') as 'en' | 'es';
      if (storedLocale) {
        setLocale(storedLocale);
      }

      // Get or create a persistent session ID
      let storedSessionId = localStorage.getItem('chat_session_id');
      const storedSessionUserId = localStorage.getItem('chat_session_user_id');

      // If user changed or no session exists, create a new one
      const currentUserId = user?.id || 'anonymous';
      if (!storedSessionId || storedSessionUserId !== currentUserId) {
        storedSessionId = `session_${currentUserId}_${Date.now()}`;
        localStorage.setItem('chat_session_id', storedSessionId);
        localStorage.setItem('chat_session_user_id', currentUserId);
      }

      setSessionId(storedSessionId);
    }
  }, [user]);

  const initialMode = searchParams.get('mode') === 'voice' ? 'voice' : 'chat';
  const [activeTab, setActiveTab] = useState(initialMode);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !sessionId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Demo restaurant and table IDs (in production, these would come from QR scan or selection)
  const restaurantId = 'demo_restaurant';
  const tableId = 'table_1';

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{t('ai.title')}</h1>
              <p className="text-muted-foreground text-sm">
                {t('ai.placeholder')}
              </p>
            </div>
          </div>
        </div>

        {/* Chat/Voice Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-2">
              <Mic className="h-4 w-4" />
              {t('home.features.voice.title')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-4">
            <Card className="h-[600px] flex flex-col">
              <CardContent className="flex-1 p-0 overflow-hidden">
                <AIChat
                  sessionId={sessionId}
                  restaurantId={restaurantId}
                  tableId={tableId}
                  language={locale}
                  customerId={user?.id}
                  className="h-full"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voice" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  {t('home.features.voice.title')}
                </CardTitle>
                <CardDescription>
                  {t('home.features.voice.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-12">
                <VoiceAgent
                  restaurantId={restaurantId}
                  tableId={tableId}
                  sessionId={sessionId}
                  language={locale}
                  onOrderUpdate={(action, item) => console.log('Order update:', action, item)}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Tips */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              <strong>Tip:</strong> {locale === 'es'
                ? 'Puedes preguntar sobre el menu, pedir recomendaciones, agregar items a tu orden, o solicitar un mesero.'
                : 'You can ask about the menu, get recommendations, add items to your order, or request a server.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
