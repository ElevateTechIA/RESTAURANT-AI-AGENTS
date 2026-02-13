'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, Bot, User, RefreshCw, History, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface AIChatProps {
  sessionId: string;
  restaurantId: string;
  tableId: string;
  language: 'en' | 'es';
  customerId?: string;
  onOrderUpdate?: (action: string, item: any) => void;
  className?: string;
}

const SUGGESTIONS = {
  en: [
    'Show me the menu',
    'What do you recommend?',
    "What's in my order?",
    'I need a server',
  ],
  es: [
    'Muestrame el menu',
    'Que me recomiendas?',
    'Que tengo en mi pedido?',
    'Necesito un mesero',
  ],
};

const GREETING = {
  en: "Hi! I'm your AI assistant. How can I help you today? You can ask me about our menu, get recommendations, or place an order.",
  es: 'Hola! Soy tu asistente de IA. Como puedo ayudarte hoy? Puedes preguntarme sobre nuestro menu, obtener recomendaciones o hacer un pedido.',
};

export function AIChat({
  sessionId,
  restaurantId,
  tableId,
  language,
  customerId,
  onOrderUpdate,
  className,
}: AIChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [currentOrder, setCurrentOrder] = useState<{ items: any[]; total: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyLoaded = useRef(false);

  // Load chat history on mount
  useEffect(() => {
    if (historyLoaded.current) return;
    historyLoaded.current = true;

    async function loadHistory() {
      try {
        const response = await fetch(`/api/ai/chat?sessionId=${sessionId}`);
        if (!response.ok) throw new Error('Failed to load history');

        const data = await response.json();

        // Load current order if exists
        if (data.currentOrder && data.currentOrder.items?.length > 0) {
          setCurrentOrder(data.currentOrder);
        }

        if (data.messages && data.messages.length > 0) {
          // Convert Firestore messages to local format
          const loadedMessages: Message[] = data.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp?._seconds
              ? new Date(msg.timestamp._seconds * 1000)
              : new Date(),
          }));
          setMessages(loadedMessages);
        } else {
          // No history, show greeting
          setMessages([
            {
              id: 'greeting',
              role: 'assistant',
              content: GREETING[language],
              timestamp: new Date(),
            },
          ]);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
        // Show greeting on error
        setMessages([
          {
            id: 'greeting',
            role: 'assistant',
            content: GREETING[language],
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoadingHistory(false);
      }
    }

    loadHistory();
  }, [sessionId, language]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      // Add loading indicator
      const loadingMessage: Message = {
        id: `loading-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isLoading: true,
      };
      setMessages((prev) => [...prev, loadingMessage]);

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            restaurantId,
            tableId,
            message: content,
            language,
            customerId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();

        // Remove loading message and add actual response
        setMessages((prev) => {
          const withoutLoading = prev.filter((m) => !m.isLoading);
          return [
            ...withoutLoading,
            {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: data.message,
              timestamp: new Date(),
            },
          ];
        });

        // Handle any function calls/tool calls
        if (data.toolCalls) {
          for (const toolCall of data.toolCalls) {
            if (
              toolCall.name === 'addToOrder' ||
              toolCall.name === 'removeFromOrder' ||
              toolCall.name === 'modifyOrderItem'
            ) {
              // Refresh order state
              if (toolCall.result?.success) {
                const orderResponse = await fetch(`/api/ai/chat?sessionId=${sessionId}`);
                if (orderResponse.ok) {
                  const orderData = await orderResponse.json();
                  if (orderData.currentOrder) {
                    setCurrentOrder(orderData.currentOrder);
                  } else {
                    setCurrentOrder(null);
                  }
                }
              }
              if (onOrderUpdate) {
                onOrderUpdate(toolCall.name, toolCall.result);
              }
            }
            // Handle proceed to checkout
            if ((toolCall.name === 'proceedToCheckout' || toolCall.name === 'submitOrder') && toolCall.result?.redirectToCheckout) {
              // Redirect to checkout after a short delay to let the message render
              setTimeout(() => {
                router.push('/checkout');
              }, 1500);
            }
          }
        }
      } catch (error) {
        console.error('Chat error:', error);
        // Remove loading message and add error message
        setMessages((prev) => {
          const withoutLoading = prev.filter((m) => !m.isLoading);
          return [
            ...withoutLoading,
            {
              id: `error-${Date.now()}`,
              role: 'assistant',
              content:
                language === 'es'
                  ? 'Lo siento, ocurrio un error. Por favor intenta de nuevo.'
                  : 'Sorry, an error occurred. Please try again.',
              timestamp: new Date(),
            },
          ];
        });
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, restaurantId, tableId, language, customerId, isLoading, onOrderUpdate]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const resetChat = () => {
    setMessages([
      {
        id: 'greeting',
        role: 'assistant',
        content: GREETING[language],
        timestamp: new Date(),
      },
    ]);
    // Note: This only resets locally. The server-side session will persist.
    // In production, you might want to call an API to clear the session.
  };

  // Show loading state while fetching history
  if (isLoadingHistory) {
    return (
      <div
        className={cn(
          'flex flex-col h-full bg-background rounded-lg border items-center justify-center',
          className
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">
          {language === 'es' ? 'Cargando conversacion...' : 'Loading conversation...'}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn('flex flex-col h-full bg-background rounded-lg border', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-semibold">
            {language === 'es' ? 'Asistente IA' : 'AI Assistant'}
          </span>
          {messages.length > 1 && (
            <Badge variant="secondary" className="text-xs">
              <History className="h-3 w-3 mr-1" />
              {messages.length - 1}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {currentOrder && currentOrder.items.length > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push('/checkout')}
              className="gap-1"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">
                {language === 'es' ? 'Pagar' : 'Checkout'}
              </span>
              <span className="font-bold">${currentOrder.total.toFixed(2)}</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={resetChat}
            title={language === 'es' ? 'Reiniciar chat' : 'Reset chat'}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-4 py-2',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                {message.isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">
                      {language === 'es' ? 'Pensando...' : 'Thinking...'}
                    </span>
                  </div>
                ) : (
                  <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                    <ReactMarkdown
                      components={{
                        img: ({ src, alt, ...props }) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={src}
                            alt={alt || ''}
                            className="rounded-lg max-w-[200px] w-full h-auto my-2 shadow-sm border"
                            loading="lazy"
                            {...props}
                          />
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2">
            {language === 'es' ? 'Sugerencias:' : 'Suggestions:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS[language].map((suggestion) => (
              <Badge
                key={suggestion}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              language === 'es'
                ? 'Escribe tu mensaje...'
                : 'Type your message...'
            }
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
