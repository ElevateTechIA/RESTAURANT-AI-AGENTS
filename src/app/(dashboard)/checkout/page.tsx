'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Loader2,
  ShoppingBag,
  CreditCard,
  Wallet,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Trash2,
  Plus,
  Minus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCart, CartItem } from '@/context/CartContext';

interface OrderItem {
  id: string;
  menuItemId: string;
  name: { en: string; es: string };
  price: number;
  quantity: number;
}

interface CurrentOrder {
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
}

const TIP_OPTIONS = [
  { value: 0, label: 'No tip', labelEs: 'Sin propina' },
  { value: 15, label: '15%', labelEs: '15%' },
  { value: 18, label: '18%', labelEs: '18%' },
  { value: 20, label: '20%', labelEs: '20%' },
  { value: 'custom', label: 'Custom', labelEs: 'Personalizado' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations();
  const locale = useLocale() as 'en' | 'es';
  const cart = useCart();

  const [order, setOrder] = useState<CurrentOrder | null>(null);
  const [orderSource, setOrderSource] = useState<'chat' | 'cart' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [tipOption, setTipOption] = useState<string>('18');
  const [customTip, setCustomTip] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Load current order from chat session OR cart context
  useEffect(() => {
    async function loadOrder() {
      setIsLoading(true);
      setError(null);

      // First, check if there's an order in the cart context
      if (cart.items.length > 0) {
        setOrder({
          items: cart.items.map(item => ({
            id: item.id,
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          subtotal: cart.subtotal,
          tax: cart.tax,
          total: cart.total,
        });
        setOrderSource('cart');
        setIsLoading(false);
        return;
      }

      // If no cart items, try to load from chat session
      try {
        const sessionId = localStorage.getItem('chat_session_id');

        if (!sessionId) {
          setError(locale === 'es' ? 'Tu carrito esta vacio' : 'Your cart is empty');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`/api/ai/chat?sessionId=${sessionId}`);

        if (!response.ok) {
          throw new Error('Failed to load order');
        }

        const data = await response.json();

        if (data.currentOrder && data.currentOrder.items.length > 0) {
          setOrder(data.currentOrder);
          setOrderSource('chat');
        } else {
          setError(
            locale === 'es'
              ? 'Tu carrito esta vacio. Agrega items desde el menu o el chat.'
              : 'Your cart is empty. Add items from the menu or chat.'
          );
        }
      } catch (err: any) {
        console.error('Error loading order:', err);
        setError(
          locale === 'es'
            ? 'Tu carrito esta vacio. Agrega items desde el menu o el chat.'
            : 'Your cart is empty. Add items from the menu or chat.'
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      loadOrder();
    }
  }, [authLoading, locale, cart.items.length, cart.subtotal, cart.tax, cart.total]);

  // Calculate tip
  const calculateTip = () => {
    if (!order) return 0;

    if (tipOption === 'custom') {
      return parseFloat(customTip) || 0;
    }

    const percentage = parseFloat(tipOption);
    if (isNaN(percentage)) return 0;

    return (order.subtotal * percentage) / 100;
  };

  const tip = calculateTip();
  const finalTotal = order ? order.subtotal + order.tax + tip : 0;

  // Submit order
  const handleSubmit = async () => {
    if (!order) return;

    setIsSubmitting(true);

    try {
      const restaurantId = 'demo_restaurant';
      const tableId = 'table_1';

      let response;

      if (orderSource === 'cart') {
        // Submit order directly from cart
        response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId,
            tableId,
            customerId: user?.id || null,
            items: order.items.map(item => ({
              menuItemId: item.menuItemId,
              name: typeof item.name === 'object' ? item.name.en : item.name,
              price: item.price,
              quantity: item.quantity,
            })),
            subtotal: order.subtotal,
            tax: order.tax,
            tip,
            total: order.subtotal + order.tax + tip,
            specialInstructions: specialInstructions || null,
            source: 'menu',
          }),
        });
      } else {
        // Submit order from chat session
        const sessionId = localStorage.getItem('chat_session_id');
        response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            restaurantId,
            tableId,
            customerId: user?.id || null,
            tip,
            specialInstructions: specialInstructions || null,
            source: 'chat',
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit order');
      }

      const data = await response.json();

      // Clear the cart if order was from cart
      if (orderSource === 'cart') {
        cart.clearCart();
      }

      setCompletedOrderId(data.order.id);
      setOrderComplete(true);

      toast.success(
        locale === 'es' ? 'Pedido realizado con exito!' : 'Order placed successfully!'
      );
    } catch (err: any) {
      console.error('Submit order error:', err);
      toast.error(err.message || 'Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Order complete state
  if (orderComplete) {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">
              {locale === 'es' ? 'Pedido Confirmado!' : 'Order Confirmed!'}
            </CardTitle>
            <CardDescription>
              {locale === 'es'
                ? 'Tu pedido ha sido enviado a la cocina.'
                : 'Your order has been sent to the kitchen.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                {t('checkout.orderNumber')}
              </p>
              <p className="text-xl font-mono font-bold">
                #{completedOrderId?.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {locale === 'es'
                ? 'Tiempo estimado: 15-20 minutos'
                : 'Estimated time: 15-20 minutes'}
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full" onClick={() => router.push('/orders')}>
              {locale === 'es' ? 'Ver Mis Pedidos' : 'View My Orders'}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/dashboard')}
            >
              {locale === 'es' ? 'Volver al Inicio' : 'Back to Home'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Error state - no order
  if (error || !order) {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>{locale === 'es' ? 'Orden Vacia' : 'Empty Order'}</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full" onClick={() => router.push('/chat')}>
              {locale === 'es' ? 'Ir al Chat' : 'Go to Chat'}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/menu')}
            >
              {locale === 'es' ? 'Ver Menu' : 'View Menu'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={orderSource === 'cart' ? '/menu' : '/chat'}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{t('checkout.title')}</h1>
            <p className="text-muted-foreground text-sm">
              {locale === 'es' ? 'Confirma tu pedido' : 'Confirm your order'}
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              {locale === 'es' ? 'Tu Pedido' : 'Your Order'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium">
                    {item.quantity}x{' '}
                    {typeof item.name === 'object' ? item.name[locale] : item.name}
                  </p>
                </div>
                <p className="font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tip Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t('checkout.tipAmount')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={tipOption}
              onValueChange={setTipOption}
              className="grid grid-cols-5 gap-2"
            >
              {TIP_OPTIONS.map((option) => (
                <div key={option.value.toString()}>
                  <RadioGroupItem
                    value={option.value.toString()}
                    id={`tip-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`tip-${option.value}`}
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                  >
                    <span className="text-sm font-medium">
                      {locale === 'es' ? option.labelEs : option.label}
                    </span>
                    {typeof option.value === 'number' && option.value > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ${((order.subtotal * option.value) / 100).toFixed(2)}
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {tipOption === 'custom' && (
              <div className="flex items-center gap-2">
                <span className="text-lg">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value)}
                  className="w-32"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t('checkout.paymentMethod')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="card"
                  id="payment-card"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="payment-card"
                  className="flex items-center gap-3 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>{locale === 'es' ? 'Tarjeta' : 'Card'}</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="cash"
                  id="payment-cash"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="payment-cash"
                  className="flex items-center gap-3 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                >
                  <Wallet className="h-5 w-5" />
                  <span>{locale === 'es' ? 'Efectivo' : 'Cash'}</span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Special Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('order.specialInstructions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={
                locale === 'es'
                  ? 'Alguna instruccion especial para tu pedido?'
                  : 'Any special instructions for your order?'
              }
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Order Total */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('order.subtotal')}</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t('order.tax')}</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              {tip > 0 && (
                <div className="flex justify-between text-sm">
                  <span>{t('order.tip')}</span>
                  <span>${tip.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>{t('order.total')}</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('checkout.processing')}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('checkout.placeOrder')} - ${finalTotal.toFixed(2)}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
