'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Store,
  Clock,
  Globe,
  Bell,
  Bot,
  CreditCard,
  Shield,
  Palette,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const t = useTranslations();

  // Restaurant settings
  const [restaurantSettings, setRestaurantSettings] = useState({
    name: 'Restaurant AI',
    description: 'El mejor restaurante con tecnología de IA',
    phone: '+1 555-0100',
    email: 'info@restaurant.com',
    address: '123 Main Street, City',
    currency: 'USD',
    timezone: 'America/New_York',
  });

  // Operating hours
  const [hours, setHours] = useState({
    monday: { open: '10:00', close: '22:00', closed: false },
    tuesday: { open: '10:00', close: '22:00', closed: false },
    wednesday: { open: '10:00', close: '22:00', closed: false },
    thursday: { open: '10:00', close: '22:00', closed: false },
    friday: { open: '10:00', close: '23:00', closed: false },
    saturday: { open: '11:00', close: '23:00', closed: false },
    sunday: { open: '11:00', close: '21:00', closed: false },
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    newOrder: true,
    orderReady: true,
    lowStock: true,
    newReservation: true,
    customerFeedback: false,
    dailyReport: true,
  });

  // AI settings
  const [aiSettings, setAiSettings] = useState({
    personality: 'friendly',
    language: 'both',
    voiceEnabled: true,
    autoSuggest: true,
    upselling: true,
    greeting: '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
  });

  const handleSave = () => {
    toast.success('Configuración guardada exitosamente');
  };

  const dayLabels: Record<string, string> = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.settings')}</h1>
          <p className="text-muted-foreground">
            Configura tu restaurante y preferencias
          </p>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Store className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="hours" className="gap-2">
            <Clock className="h-4 w-4" />
            Horarios
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Bot className="h-4 w-4" />
            IA
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Información del Restaurante
              </CardTitle>
              <CardDescription>
                Información básica de tu negocio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre del Restaurante</Label>
                  <Input
                    value={restaurantSettings.name}
                    onChange={(e) =>
                      setRestaurantSettings({ ...restaurantSettings, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={restaurantSettings.phone}
                    onChange={(e) =>
                      setRestaurantSettings({ ...restaurantSettings, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={restaurantSettings.description}
                  onChange={(e) =>
                    setRestaurantSettings({ ...restaurantSettings, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={restaurantSettings.email}
                    onChange={(e) =>
                      setRestaurantSettings({ ...restaurantSettings, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input
                    value={restaurantSettings.address}
                    onChange={(e) =>
                      setRestaurantSettings({ ...restaurantSettings, address: e.target.value })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Moneda
                  </Label>
                  <Select
                    value={restaurantSettings.currency}
                    onValueChange={(value) =>
                      setRestaurantSettings({ ...restaurantSettings, currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="MXN">MXN ($)</SelectItem>
                      <SelectItem value="COP">COP ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Zona Horaria
                  </Label>
                  <Select
                    value={restaurantSettings.timezone}
                    onValueChange={(value) =>
                      setRestaurantSettings({ ...restaurantSettings, timezone: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="America/Mexico_City">Mexico City</SelectItem>
                      <SelectItem value="America/Bogota">Bogotá</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operating Hours */}
        <TabsContent value="hours" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horario de Operación
              </CardTitle>
              <CardDescription>
                Define los horarios de apertura y cierre
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(hours).map(([day, schedule]) => (
                <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
                  <span className="font-medium w-24">{dayLabels[day]}</span>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!schedule.closed}
                      onCheckedChange={(checked) =>
                        setHours({
                          ...hours,
                          [day]: { ...schedule, closed: !checked },
                        })
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      {schedule.closed ? 'Cerrado' : 'Abierto'}
                    </span>
                  </div>
                  {!schedule.closed && (
                    <>
                      <Input
                        type="time"
                        value={schedule.open}
                        onChange={(e) =>
                          setHours({
                            ...hours,
                            [day]: { ...schedule, open: e.target.value },
                          })
                        }
                        className="w-32"
                      />
                      <span className="text-muted-foreground">a</span>
                      <Input
                        type="time"
                        value={schedule.close}
                        onChange={(e) =>
                          setHours({
                            ...hours,
                            [day]: { ...schedule, close: e.target.value },
                          })
                        }
                        className="w-32"
                      />
                    </>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones
              </CardTitle>
              <CardDescription>
                Configura qué notificaciones deseas recibir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Nuevos Pedidos</p>
                  <p className="text-sm text-muted-foreground">
                    Notificación cuando un cliente hace un pedido
                  </p>
                </div>
                <Switch
                  checked={notifications.newOrder}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, newOrder: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Pedido Listo</p>
                  <p className="text-sm text-muted-foreground">
                    Notificación cuando un pedido está listo para servir
                  </p>
                </div>
                <Switch
                  checked={notifications.orderReady}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, orderReady: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Stock Bajo</p>
                  <p className="text-sm text-muted-foreground">
                    Alerta cuando un ingrediente tiene stock bajo
                  </p>
                </div>
                <Switch
                  checked={notifications.lowStock}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, lowStock: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Nuevas Reservaciones</p>
                  <p className="text-sm text-muted-foreground">
                    Notificación cuando un cliente hace una reservación
                  </p>
                </div>
                <Switch
                  checked={notifications.newReservation}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, newReservation: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Feedback de Clientes</p>
                  <p className="text-sm text-muted-foreground">
                    Notificación cuando un cliente deja una reseña
                  </p>
                </div>
                <Switch
                  checked={notifications.customerFeedback}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, customerFeedback: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Reporte Diario</p>
                  <p className="text-sm text-muted-foreground">
                    Resumen diario de ventas y operaciones
                  </p>
                </div>
                <Switch
                  checked={notifications.dailyReport}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, dailyReport: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Settings */}
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                {t('admin.aiSettings')}
              </CardTitle>
              <CardDescription>
                Configura el comportamiento del asistente de IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Personalidad del Asistente</Label>
                  <Select
                    value={aiSettings.personality}
                    onValueChange={(value) =>
                      setAiSettings({ ...aiSettings, personality: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Amigable y Casual</SelectItem>
                      <SelectItem value="professional">Profesional</SelectItem>
                      <SelectItem value="formal">Formal y Elegante</SelectItem>
                      <SelectItem value="playful">Divertido y Juguetón</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Idioma del Asistente</Label>
                  <Select
                    value={aiSettings.language}
                    onValueChange={(value) =>
                      setAiSettings({ ...aiSettings, language: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">Solo Inglés</SelectItem>
                      <SelectItem value="es">Solo Español</SelectItem>
                      <SelectItem value="both">Ambos (Automático)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Saludo Personalizado</Label>
                <Textarea
                  value={aiSettings.greeting}
                  onChange={(e) =>
                    setAiSettings({ ...aiSettings, greeting: e.target.value })
                  }
                  rows={3}
                  placeholder="Mensaje de bienvenida del asistente..."
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Funciones del Asistente</h4>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Pedidos por Voz</p>
                    <p className="text-sm text-muted-foreground">
                      Permite a los clientes ordenar usando voz
                    </p>
                  </div>
                  <Switch
                    checked={aiSettings.voiceEnabled}
                    onCheckedChange={(checked) =>
                      setAiSettings({ ...aiSettings, voiceEnabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Sugerencias Automáticas</p>
                    <p className="text-sm text-muted-foreground">
                      El asistente sugiere platillos basados en preferencias
                    </p>
                  </div>
                  <Switch
                    checked={aiSettings.autoSuggest}
                    onCheckedChange={(checked) =>
                      setAiSettings({ ...aiSettings, autoSuggest: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Venta Adicional (Upselling)</p>
                    <p className="text-sm text-muted-foreground">
                      El asistente sugiere complementos y mejoras
                    </p>
                  </div>
                  <Switch
                    checked={aiSettings.upselling}
                    onCheckedChange={(checked) =>
                      setAiSettings({ ...aiSettings, upselling: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
