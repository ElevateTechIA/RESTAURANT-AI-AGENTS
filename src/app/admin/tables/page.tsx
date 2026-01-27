'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  QrCode,
  Users,
  Edit,
  Trash2,
  Download,
  Eye,
  Coffee,
  UtensilsCrossed,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// Demo tables data
const DEMO_TABLES = [
  { id: '1', number: 1, capacity: 2, status: 'available', zone: 'interior', currentOrder: null },
  { id: '2', number: 2, capacity: 4, status: 'occupied', zone: 'interior', currentOrder: 'ORD-004' },
  { id: '3', number: 3, capacity: 4, status: 'occupied', zone: 'interior', currentOrder: 'ORD-003' },
  { id: '4', number: 4, capacity: 6, status: 'available', zone: 'interior', currentOrder: null },
  { id: '5', number: 5, capacity: 2, status: 'occupied', zone: 'terraza', currentOrder: 'ORD-001' },
  { id: '6', number: 6, capacity: 4, status: 'reserved', zone: 'terraza', currentOrder: null },
  { id: '7', number: 7, capacity: 8, status: 'available', zone: 'privado', currentOrder: null },
  { id: '8', number: 8, capacity: 2, status: 'occupied', zone: 'interior', currentOrder: 'ORD-005' },
  { id: '9', number: 9, capacity: 4, status: 'available', zone: 'terraza', currentOrder: null },
  { id: '10', number: 10, capacity: 6, status: 'reserved', zone: 'privado', currentOrder: null },
  { id: '11', number: 11, capacity: 2, status: 'available', zone: 'interior', currentOrder: null },
  { id: '12', number: 12, capacity: 4, status: 'occupied', zone: 'interior', currentOrder: 'ORD-002' },
];

type Table = typeof DEMO_TABLES[0];

export default function TablesManagementPage() {
  const t = useTranslations();
  const [tables, setTables] = useState(DEMO_TABLES);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [zoneFilter, setZoneFilter] = useState('all');

  const [newTable, setNewTable] = useState({
    number: '',
    capacity: '4',
    zone: 'interior',
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      occupied: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      reserved: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
    return colors[status] || colors.available;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      available: 'Disponible',
      occupied: 'Ocupada',
      reserved: 'Reservada',
    };
    return labels[status] || status;
  };

  const getZoneLabel = (zone: string) => {
    const labels: Record<string, string> = {
      interior: 'Interior',
      terraza: 'Terraza',
      privado: 'Privado',
    };
    return labels[zone] || zone;
  };

  const filteredTables = tables.filter((table) =>
    zoneFilter === 'all' || table.zone === zoneFilter
  );

  const handleAddTable = () => {
    const id = Date.now().toString();
    const table: Table = {
      id,
      number: parseInt(newTable.number) || tables.length + 1,
      capacity: parseInt(newTable.capacity) || 4,
      zone: newTable.zone,
      status: 'available',
      currentOrder: null,
    };
    setTables([...tables, table]);
    setIsAddTableOpen(false);
    setNewTable({ number: '', capacity: '4', zone: 'interior' });
    toast.success('Mesa agregada exitosamente');
  };

  const handleDeleteTable = (tableId: string) => {
    setTables(tables.filter((t) => t.id !== tableId));
    toast.success('Mesa eliminada');
  };

  const handleStatusChange = (tableId: string, newStatus: string) => {
    setTables(tables.map((t) =>
      t.id === tableId ? { ...t, status: newStatus, currentOrder: newStatus === 'available' ? null : t.currentOrder } : t
    ));
    toast.success('Estado actualizado');
  };

  const generateQRCode = (tableNumber: number) => {
    // In production, this would generate an actual QR code
    toast.success(`Código QR generado para Mesa ${tableNumber}`);
  };

  const tableCounts = {
    all: tables.length,
    available: tables.filter((t) => t.status === 'available').length,
    occupied: tables.filter((t) => t.status === 'occupied').length,
    reserved: tables.filter((t) => t.status === 'reserved').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.tables')}</h1>
          <p className="text-muted-foreground">
            Gestiona las mesas y códigos QR del restaurante
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.success('Códigos QR descargados')}>
            <Download className="h-4 w-4 mr-2" />
            Descargar QRs
          </Button>
          <Dialog open={isAddTableOpen} onOpenChange={setIsAddTableOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Mesa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Mesa</DialogTitle>
                <DialogDescription>
                  Agrega una nueva mesa al restaurante
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Número de Mesa</Label>
                  <Input
                    type="number"
                    value={newTable.number}
                    onChange={(e) =>
                      setNewTable({ ...newTable, number: e.target.value })
                    }
                    placeholder={`${tables.length + 1}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Capacidad</Label>
                  <Select
                    value={newTable.capacity}
                    onValueChange={(value) =>
                      setNewTable({ ...newTable, capacity: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 personas</SelectItem>
                      <SelectItem value="4">4 personas</SelectItem>
                      <SelectItem value="6">6 personas</SelectItem>
                      <SelectItem value="8">8 personas</SelectItem>
                      <SelectItem value="10">10 personas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Zona</Label>
                  <Select
                    value={newTable.zone}
                    onValueChange={(value) =>
                      setNewTable({ ...newTable, zone: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interior">Interior</SelectItem>
                      <SelectItem value="terraza">Terraza</SelectItem>
                      <SelectItem value="privado">Privado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddTableOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddTable}>Agregar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Mesas</p>
                <p className="text-2xl font-bold">{tableCounts.all}</p>
              </div>
              <UtensilsCrossed className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponibles</p>
                <p className="text-2xl font-bold">{tableCounts.available}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ocupadas</p>
                <p className="text-2xl font-bold">{tableCounts.occupied}</p>
              </div>
              <Coffee className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reservadas</p>
                <p className="text-2xl font-bold">{tableCounts.reserved}</p>
              </div>
              <Users className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zone Filter */}
      <div className="flex gap-2">
        <Button
          variant={zoneFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setZoneFilter('all')}
        >
          Todas
        </Button>
        <Button
          variant={zoneFilter === 'interior' ? 'default' : 'outline'}
          onClick={() => setZoneFilter('interior')}
        >
          Interior
        </Button>
        <Button
          variant={zoneFilter === 'terraza' ? 'default' : 'outline'}
          onClick={() => setZoneFilter('terraza')}
        >
          Terraza
        </Button>
        <Button
          variant={zoneFilter === 'privado' ? 'default' : 'outline'}
          onClick={() => setZoneFilter('privado')}
        >
          Privado
        </Button>
      </div>

      {/* Tables Grid */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {filteredTables.map((table) => (
          <Card
            key={table.id}
            className={`overflow-hidden transition-all ${
              table.status === 'occupied'
                ? 'border-red-200 dark:border-red-800'
                : table.status === 'reserved'
                ? 'border-yellow-200 dark:border-yellow-800'
                : 'border-green-200 dark:border-green-800'
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Mesa {table.number}</CardTitle>
                <Badge className={getStatusColor(table.status)}>
                  {getStatusLabel(table.status)}
                </Badge>
              </div>
              <CardDescription>
                {getZoneLabel(table.zone)} • {table.capacity} personas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {table.currentOrder && (
                <div className="p-2 bg-muted rounded-lg text-sm">
                  <span className="text-muted-foreground">Pedido activo: </span>
                  <span className="font-medium">{table.currentOrder}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Select
                  value={table.status}
                  onValueChange={(value) => handleStatusChange(table.id, value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="occupied">Ocupada</SelectItem>
                    <SelectItem value="reserved">Reservada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => generateQRCode(table.number)}
                >
                  <QrCode className="h-4 w-4 mr-1" />
                  QR
                </Button>
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteTable(table.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* QR Code Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            {t('admin.qrCodes')}
          </CardTitle>
          <CardDescription>
            Los clientes escanean estos códigos para acceder al menú y ordenar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {tables.slice(0, 4).map((table) => (
              <div
                key={table.id}
                className="p-4 border rounded-lg text-center space-y-2"
              >
                <div className="w-24 h-24 mx-auto bg-muted rounded-lg flex items-center justify-center">
                  <QrCode className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="font-medium">Mesa {table.number}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateQRCode(table.number)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Descargar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
