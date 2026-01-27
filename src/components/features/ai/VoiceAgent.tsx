'use client';

import { useState, useCallback, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceAgentProps {
  restaurantId: string;
  tableId: string;
  sessionId: string;
  language: 'en' | 'es';
  onOrderUpdate?: (action: string, item: any) => void;
  className?: string;
}

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
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);

  // Client tools for the voice agent to trigger UI updates
  const clientTools: Record<string, (parameters: any) => Promise<string>> = {
    update_ui_order: async ({ action, item }: { action: string; item: any }): Promise<string> => {
      if (onOrderUpdate) {
        onOrderUpdate(action, item);
      }
      return 'Order updated successfully';
    },
    show_menu_item: async ({ itemId }: { itemId: string }): Promise<string> => {
      // Trigger navigation or modal to show item
      console.log('Show menu item:', itemId);
      return 'Showing menu item';
    },
    navigate_to: async ({ page }: { page: string }): Promise<string> => {
      // Trigger navigation
      console.log('Navigate to:', page);
      return 'Navigating to ' + page;
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
    onMessage: (message) => {
      console.log('Voice message:', message);
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

      {/* Instructions */}
      {!isConnected && !error && isConfigured && (
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
