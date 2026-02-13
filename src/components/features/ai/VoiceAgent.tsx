'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, Loader2, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuItemCard, MenuItemDisplay } from './MenuItemCard';

interface VoiceAgentProps {
  restaurantId: string;
  tableId: string;
  sessionId: string;
  language: 'en' | 'es';
  onOrderUpdate?: (action: string, item: any) => void;
  className?: string;
}

interface TranscriptMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

const PAGE_ROUTES: Record<string, string> = {
  menu: '/menu',
  order: '/orders',
  checkout: '/checkout',
  assistance: '/menu',
};

const STATUS_TEXT = {
  en: {
    idle: 'Tap to speak',
    connecting: 'Connecting...',
    connected: 'Listening',
    speaking: 'AI is speaking',
    error: 'Connection error',
    notConfigured: 'Voice service not available',
  },
  es: {
    idle: 'Toca para hablar',
    connecting: 'Conectando...',
    connected: 'Escuchando',
    speaking: 'IA hablando',
    error: 'Error de conexion',
    notConfigured: 'Servicio de voz no disponible',
  },
};

export function VoiceAgent({
  restaurantId,
  tableId,
  sessionId,
  language,
  onOrderUpdate,
  className,
}: VoiceAgentProps) {
  const router = useRouter();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [menuItems, setMenuItems] = useState<Map<string, MenuItemDisplay>>(new Map());
  const [displayedItems, setDisplayedItems] = useState<MenuItemDisplay[]>([]);

  // Client tools for the voice agent to trigger UI updates
  const clientTools: Record<string, (parameters: any) => Promise<string>> = {
    update_ui_order: async ({ action, item }: { action: string; item: any }): Promise<string> => {
      if (onOrderUpdate) {
        onOrderUpdate(action, item);
      }
      return 'Order updated successfully';
    },
    show_menu_item: async ({ itemId }: { itemId: string }): Promise<string> => {
      console.log('Show menu item:', itemId);
      const item = menuItems.get(itemId);
      if (item) {
        setDisplayedItems((prev) => {
          if (prev.some((i) => i.id === item.id)) return prev;
          return [...prev, item];
        });
        return `Showing ${item.name} on screen`;
      }
      return 'Item not found in menu';
    },
    show_menu: async (): Promise<string> => {
      const allItems = Array.from(menuItems.values());
      if (allItems.length > 0) {
        setDisplayedItems(allItems);
        return `Showing ${allItems.length} menu items on screen`;
      }
      return 'Menu not loaded yet';
    },
    navigate_to: async ({ page }: { page: string }): Promise<string> => {
      console.log('Navigate to:', page);
      const route = PAGE_ROUTES[page];
      if (route) {
        setTimeout(() => {
          router.push(route);
        }, 1500);
        return 'Navigating to ' + page;
      }
      return 'Unknown page: ' + page;
    },
  };

  const conversation = useConversation({
    clientTools,
    onConnect: () => {
      setError(null);
      console.log('Voice agent connected');
    },
    onDisconnect: () => {
      console.log('Voice agent disconnected');
    },
    onMessage: (message: any) => {
      console.log('Voice message:', message);
      if (message.message) {
        const role = message.role === 'user' ? 'user' : 'agent';
        setTranscript((prev) => [
          ...prev,
          {
            id: `${role}-${Date.now()}-${Math.random()}`,
            role,
            content: message.message,
            timestamp: new Date(),
          },
        ]);

        // Auto-show menu when agent talks about menu items
        if (role === 'agent') {
          const text = message.message.toLowerCase();
          const menuKeywords = [
            'menu', 'menú', 'platos', 'dishes', 'carta',
            'tenemos', 'ofrecemos', 'opciones', 'categoría',
            'entradas', 'starters', 'principales', 'main',
            'postres', 'desserts', 'bebidas', 'beverages', 'drinks',
          ];
          const mentionsMenu = menuKeywords.some((kw) => text.includes(kw));
          if (mentionsMenu && menuItems.size > 0 && displayedItems.length === 0) {
            setDisplayedItems(Array.from(menuItems.values()));
          }

          // Auto-detect checkout/payment intent and redirect
          const checkoutKeywords = [
            'proceed to checkout', 'proceder al pago', 'pagar', 'payment',
            'checkout', 'complete your order', 'completar tu pedido',
            'finalizar', 'confirmar pedido', 'confirm your order',
            'te redirijo', 'redirect', 'proceso de pago',
            'listo para pagar', 'ready to pay',
          ];
          const mentionsCheckout = checkoutKeywords.some((kw) => text.includes(kw));
          if (mentionsCheckout) {
            setTimeout(async () => {
              try {
                await conversation.endSession();
              } catch {
                // ignore
              }
              router.push('/checkout');
            }, 2000);
          }
        }
      }
    },
    onError: (error) => {
      console.error('Voice agent error:', error);
      setError(typeof error === 'string' ? error : 'Connection error');
    },
  });

  const fetchSignedUrl = useCallback(async () => {
    setIsLoadingUrl(true);
    setError(null);
    try {
      const response = await fetch('/api/elevenlabs/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, tableId, sessionId, language }),
      });

      const data = await response.json();

      // Check if service is not configured
      if (response.status === 503 || data.configured === false) {
        setIsConfigured(false);
        setError(language === 'es'
          ? 'El servicio de voz no esta configurado'
          : 'Voice service is not configured');
        return null;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get signed URL');
      }

      setSignedUrl(data.signedUrl);
      return data.signedUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
      return null;
    } finally {
      setIsLoadingUrl(false);
    }
  }, [restaurantId, tableId, sessionId, language]);

  const startConversation = useCallback(async () => {
    let url = signedUrl;

    if (!url) {
      url = await fetchSignedUrl();
    }

    if (url) {
      try {
        setTranscript([]);
        setDisplayedItems([]);
        await conversation.startSession({ signedUrl: url });
      } catch (err: any) {
        setError(err.message || 'Failed to start conversation');
        // Try to get a new signed URL on next attempt
        setSignedUrl(null);
      }
    }
  }, [signedUrl, fetchSignedUrl, conversation]);

  const endConversation = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (err) {
      console.error('Error ending conversation:', err);
    }
  }, [conversation]);

  const toggleConversation = useCallback(async () => {
    if (conversation.status === 'connected') {
      await endConversation();
    } else {
      await startConversation();
    }
  }, [conversation.status, startConversation, endConversation]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    // Note: ElevenLabs SDK may have its own mute functionality
  }, []);

  // Fetch menu items on mount for displaying images
  useEffect(() => {
    async function fetchMenu() {
      try {
        const response = await fetch(`/api/menu?restaurantId=${restaurantId}&availableOnly=true`);
        if (response.ok) {
          const data = await response.json();
          const itemMap = new Map<string, MenuItemDisplay>();
          for (const item of data.items) {
            itemMap.set(item.id, {
              id: item.id,
              name: item.name[language] || item.name.en,
              description: item.description[language] || item.description.en,
              price: item.price,
              imageUrl: item.imageUrl,
              dietaryFlags: item.dietaryFlags,
            });
          }
          setMenuItems(itemMap);
        }
      } catch (err) {
        console.error('Failed to fetch menu for voice display:', err);
      }
    }
    fetchMenu();
  }, [restaurantId, language]);

  // Check if ElevenLabs is configured on mount
  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        const response = await fetch('/api/elevenlabs/signed-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restaurantId, tableId, sessionId, language }),
        });

        if (response.status === 503) {
          const data = await response.json();
          if (data.configured === false) {
            setIsConfigured(false);
          }
        }
      } catch {
        // Ignore errors on configuration check
      }
    };

    checkConfiguration();
  }, [restaurantId, tableId, sessionId, language]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversation.status === 'connected') {
        conversation.endSession();
      }
    };
  }, []);

  const isConnected = conversation.status === 'connected';
  const isSpeaking = conversation.isSpeaking;
  const isConnecting = isLoadingUrl || conversation.status === 'connecting';

  const getStatusText = () => {
    if (error) return STATUS_TEXT[language].error;
    if (isConnecting) return STATUS_TEXT[language].connecting;
    if (isSpeaking) return STATUS_TEXT[language].speaking;
    if (isConnected) return STATUS_TEXT[language].connected;
    return STATUS_TEXT[language].idle;
  };

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Main Voice Button */}
      <div className="relative">
        {/* Pulsing ring when active */}
        {isConnected && (
          <div
            className={cn(
              'absolute inset-0 rounded-full animate-ping bg-primary/20',
              isSpeaking && 'bg-green-500/20'
            )}
          />
        )}

        <Button
          onClick={toggleConversation}
          disabled={isConnecting || !isConfigured}
          size="lg"
          className={cn(
            'relative w-24 h-24 rounded-full transition-all duration-300',
            isConnected && 'bg-red-500 hover:bg-red-600',
            isSpeaking && 'bg-green-500 hover:bg-green-600',
            error && 'bg-destructive',
            !isConfigured && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isConnecting ? (
            <Loader2 className="h-10 w-10 animate-spin" />
          ) : isConnected ? (
            <PhoneOff className="h-10 w-10" />
          ) : (
            <Mic className="h-10 w-10" />
          )}
        </Button>
      </div>

      {/* Status Text */}
      <p
        className={cn(
          'text-sm font-medium',
          error && 'text-destructive',
          isSpeaking && 'text-green-500',
          isConnected && !isSpeaking && 'text-primary'
        )}
      >
        {getStatusText()}
      </p>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-destructive text-center max-w-[200px]">
          {error}
        </p>
      )}

      {/* Controls when connected */}
      {isConnected && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Waveform Visualizer (placeholder) */}
      {isConnected && (
        <div className="flex items-center gap-1 h-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-1 bg-primary rounded-full transition-all duration-150',
                isSpeaking
                  ? 'animate-pulse'
                  : 'h-2'
              )}
              style={{
                height: isSpeaking
                  ? `${Math.random() * 24 + 8}px`
                  : '8px',
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Menu Items Display */}
      {displayedItems.length > 0 && (
        <div className="w-full max-w-md max-h-80 overflow-y-auto border rounded-lg p-3 bg-background">
          <div className="flex items-center justify-between mb-2 sticky top-0 bg-background pb-1">
            <p className="text-xs text-muted-foreground font-medium">
              {language === 'es' ? `Menu (${displayedItems.length} items)` : `Menu (${displayedItems.length} items)`}
            </p>
            <button
              onClick={() => setDisplayedItems([])}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2">
            {displayedItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
              />
            ))}
          </div>
        </div>
      )}

      {/* Conversation Transcript */}
      {transcript.length > 0 && (
        <div className="w-full max-w-md max-h-64 overflow-y-auto border rounded-lg p-3 bg-background">
          <p className="text-xs text-muted-foreground mb-2 font-medium">
            {language === 'es' ? 'Conversacion' : 'Conversation'}
          </p>
          <div className="space-y-3">
            {transcript.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-2',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'agent' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-3 py-1.5 text-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}

      {/* Instructions */}
      {!isConnected && !error && isConfigured && transcript.length === 0 && (
        <p className="text-xs text-muted-foreground text-center max-w-[200px]">
          {language === 'es'
            ? 'Presiona el boton para hablar con el asistente'
            : 'Press the button to talk with the assistant'}
        </p>
      )}

      {/* Not configured message */}
      {!isConfigured && (
        <p className="text-xs text-muted-foreground text-center max-w-[250px]">
          {language === 'es'
            ? 'Usa el chat de texto mientras tanto'
            : 'Use the text chat in the meantime'}
        </p>
      )}
    </div>
  );
}
