'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
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
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  RefreshCw,
  Search,
  Filter,
  CalendarDays,
  UserCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Reservation {
  id: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: { _seconds: number; _nanoseconds: number } | string;
  time: string;
  partySize: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  tableId: string | null;
  specialRequests: string | null;
  notes: string | null;
  createdAt: { _seconds: number; _nanoseconds: number } | string;
}

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-500', label: 'Pendiente', labelEn: 'Pending' },
  confirmed: { color: 'bg-green-500', label: 'Confirmada', labelEn: 'Confirmed' },
  cancelled: { color: 'bg-red-500', label: 'Cancelada', labelEn: 'Cancelled' },
  completed: { color: 'bg-gray-500', label: 'Completada', labelEn: 'Completed' },
  no_show: { color: 'bg-orange-500', label: 'No asistio', labelEn: 'No Show' },
};

const AVAILABLE_TABLES = ['T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06', 'T-08', 'T-10', 'T-12', 'T-15'];

const RESTAURANT_ID = 'demo_restaurant';

export default function AdminReservationsPage() {
  const t = useTranslations();
  const locale = useLocale() as 'en' | 'es';
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Fetch reservations from API
  const fetchReservations = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      let url = `/api/reservations?restaurantId=${RESTAURANT_ID}`;

      if (statusFilter && statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }

      if (dateFilter) {
        url += `&date=${dateFilter}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch reservations');
      }

      const data = await response.json();
      setReservations(data.reservations || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error(
        locale === 'es'
          ? 'Error al cargar reservaciones'
          : 'Error loading reservations'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [locale, statusFilter, dateFilter]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const getDateFromTimestamp = (date: Reservation['date']): Date => {
    if (typeof date === 'string') return new Date(date);
    if (date && '_seconds' in date) {
      return new Date(date._seconds * 1000);
    }
    return new Date();
  };

  const formatDate = (date: Reservation['date']) => {
    const d = getDateFromTimestamp(date);
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(d);
  };

  const formatDateISO = (date: Reservation['date']): string => {
    const d = getDateFromTimestamp(date);
    return d.toISOString().split('T')[0];
  };

  const handleStatusChange = async (reservationId: string, newStatus: Reservation['status']) => {
    try {
      const response = await fetch('/api/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId,
          action: newStatus === 'cancelled' ? 'cancel' : 'updateStatus',
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success(
        locale === 'es'
          ? 'Estado de reservacion actualizado'
          : 'Reservation status updated'
      );

      fetchReservations(true);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(
        locale === 'es'
          ? 'Error al actualizar estado'
          : 'Error updating status'
      );
    }
  };

  const handleAssignTable = async (reservationId: string, tableId: string) => {
    try {
      const response = await fetch('/api/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId,
          action: 'assignTable',
          tableId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign table');
      }

      // Also confirm the reservation if it's pending
      if (selectedReservation?.status === 'pending') {
        await fetch('/api/reservations', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reservationId,
            action: 'updateStatus',
            status: 'confirmed',
          }),
        });
      }

      toast.success(
        locale === 'es'
          ? `Mesa ${tableId} asignada`
          : `Table ${tableId} assigned`
      );

      fetchReservations(true);
    } catch (error) {
      console.error('Error assigning table:', error);
      toast.error(
        locale === 'es'
          ? 'Error al asignar mesa'
          : 'Error assigning table'
      );
    }
  };

  const filteredReservations = reservations.filter((r) => {
    const matchesSearch =
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerPhone.includes(searchQuery);
    // Status filter is now applied on the API side, but keep for client-side filtering during search
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    // Date filter is now applied on the API side
    return matchesSearch && matchesStatus;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayReservations = reservations.filter((r) => {
    const dateStr = formatDateISO(r.date);
    return dateStr === todayStr && r.status !== 'cancelled';
  });

  const pendingCount = reservations.filter((r) => r.status === 'pending').length;
  const confirmedTodayCount = todayReservations.filter((r) => r.status === 'confirmed').length;

  const openReservationDetail = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsDetailDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6" />
            {t('navigation.reservations')}
          </h1>
          <p className="text-muted-foreground">
            {locale === 'es'
              ? 'Gestiona las reservaciones del restaurante'
              : 'Manage restaurant reservations'}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fetchReservations(true)}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {locale === 'es' ? 'Pendientes' : 'Pending'}
            </CardDescription>
            <CardTitle className="text-3xl text-yellow-500">{pendingCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {locale === 'es'
                ? 'Reservaciones por confirmar'
                : 'Reservations to confirm'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {locale === 'es' ? 'Hoy' : 'Today'}
            </CardDescription>
            <CardTitle className="text-3xl text-green-500">{confirmedTodayCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {locale === 'es'
                ? 'Reservaciones confirmadas para hoy'
                : 'Confirmed reservations for today'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {locale === 'es' ? 'Total Invitados Hoy' : 'Total Guests Today'}
            </CardDescription>
            <CardTitle className="text-3xl">
              {todayReservations.reduce((sum, r) => sum + r.partySize, 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {locale === 'es'
                ? 'Personas esperadas hoy'
                : 'People expected today'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={
                    locale === 'es'
                      ? 'Buscar por nombre, email o telefono...'
                      : 'Search by name, email or phone...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-40"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={locale === 'es' ? 'Estado' : 'Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {locale === 'es' ? 'Todos' : 'All'}
                  </SelectItem>
                  <SelectItem value="pending">
                    {locale === 'es' ? 'Pendiente' : 'Pending'}
                  </SelectItem>
                  <SelectItem value="confirmed">
                    {locale === 'es' ? 'Confirmada' : 'Confirmed'}
                  </SelectItem>
                  <SelectItem value="completed">
                    {locale === 'es' ? 'Completada' : 'Completed'}
                  </SelectItem>
                  <SelectItem value="cancelled">
                    {locale === 'es' ? 'Cancelada' : 'Cancelled'}
                  </SelectItem>
                  <SelectItem value="no-show">
                    {locale === 'es' ? 'No asistio' : 'No Show'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{locale === 'es' ? 'Cliente' : 'Customer'}</TableHead>
                <TableHead>{locale === 'es' ? 'Fecha' : 'Date'}</TableHead>
                <TableHead>{locale === 'es' ? 'Hora' : 'Time'}</TableHead>
                <TableHead>{locale === 'es' ? 'Invitados' : 'Guests'}</TableHead>
                <TableHead>{locale === 'es' ? 'Mesa' : 'Table'}</TableHead>
                <TableHead>{locale === 'es' ? 'Estado' : 'Status'}</TableHead>
                <TableHead>{locale === 'es' ? 'Acciones' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {locale === 'es' ? 'Cargando...' : 'Loading...'}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredReservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {locale === 'es'
                      ? 'No se encontraron reservaciones'
                      : 'No reservations found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredReservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCircle className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{reservation.customerName}</p>
                          <p className="text-xs text-muted-foreground">
                            {reservation.customerPhone}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(reservation.date)}</TableCell>
                    <TableCell>{reservation.time}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {reservation.partySize}
                      </div>
                    </TableCell>
                    <TableCell>
                      {reservation.tableId ? (
                        <Badge variant="outline">{reservation.tableId}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${STATUS_CONFIG[reservation.status].color} text-white`}
                      >
                        {locale === 'es'
                          ? STATUS_CONFIG[reservation.status].label
                          : STATUS_CONFIG[reservation.status].labelEn}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openReservationDetail(reservation)}
                        >
                          {locale === 'es' ? 'Ver' : 'View'}
                        </Button>
                        {reservation.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600"
                            onClick={() => handleStatusChange(reservation.id, 'confirmed')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reservation Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-md">
          {selectedReservation && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {locale === 'es' ? 'Detalle de Reservacion' : 'Reservation Detail'}
                </DialogTitle>
                <DialogDescription>
                  #{selectedReservation.id}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Customer Info */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">
                    {locale === 'es' ? 'Cliente' : 'Customer'}
                  </Label>
                  <div className="flex items-center gap-3">
                    <UserCircle className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{selectedReservation.customerName}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {selectedReservation.customerEmail}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {selectedReservation.customerPhone}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reservation Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">
                      {locale === 'es' ? 'Fecha' : 'Date'}
                    </Label>
                    <p className="font-medium">{formatDate(selectedReservation.date)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      {locale === 'es' ? 'Hora' : 'Time'}
                    </Label>
                    <p className="font-medium">{selectedReservation.time}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      {locale === 'es' ? 'Invitados' : 'Guests'}
                    </Label>
                    <p className="font-medium">{selectedReservation.partySize}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      {locale === 'es' ? 'Estado' : 'Status'}
                    </Label>
                    <Badge
                      className={`${STATUS_CONFIG[selectedReservation.status].color} text-white mt-1`}
                    >
                      {locale === 'es'
                        ? STATUS_CONFIG[selectedReservation.status].label
                        : STATUS_CONFIG[selectedReservation.status].labelEn}
                    </Badge>
                  </div>
                </div>

                {/* Special Requests */}
                {selectedReservation.specialRequests && (
                  <div>
                    <Label className="text-muted-foreground">
                      {locale === 'es' ? 'Solicitudes Especiales' : 'Special Requests'}
                    </Label>
                    <p className="text-sm mt-1 p-2 bg-muted rounded">
                      {selectedReservation.specialRequests}
                    </p>
                  </div>
                )}

                {/* Assign Table */}
                {(selectedReservation.status === 'pending' || selectedReservation.status === 'confirmed') && (
                  <div>
                    <Label className="text-muted-foreground">
                      {locale === 'es' ? 'Asignar Mesa' : 'Assign Table'}
                    </Label>
                    <Select
                      value={selectedReservation.tableId || ''}
                      onValueChange={async (value) => {
                        await handleAssignTable(selectedReservation.id, value);
                        setIsDetailDialogOpen(false);
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue
                          placeholder={
                            locale === 'es' ? 'Seleccionar mesa' : 'Select table'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_TABLES.map((table) => (
                          <SelectItem key={table} value={table}>
                            {table}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Status Actions */}
                {selectedReservation.status !== 'completed' &&
                  selectedReservation.status !== 'cancelled' && (
                    <div className="flex gap-2 pt-4">
                      {selectedReservation.status === 'pending' && (
                        <Button
                          className="flex-1"
                          onClick={async () => {
                            await handleStatusChange(selectedReservation.id, 'confirmed');
                            setIsDetailDialogOpen(false);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {locale === 'es' ? 'Confirmar' : 'Confirm'}
                        </Button>
                      )}
                      {selectedReservation.status === 'confirmed' && (
                        <Button
                          className="flex-1"
                          onClick={async () => {
                            await handleStatusChange(selectedReservation.id, 'completed');
                            setIsDetailDialogOpen(false);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {locale === 'es' ? 'Completar' : 'Complete'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="text-destructive"
                        onClick={async () => {
                          await handleStatusChange(selectedReservation.id, 'cancelled');
                          setIsDetailDialogOpen(false);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {locale === 'es' ? 'Cancelar' : 'Cancel'}
                      </Button>
                    </div>
                  )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
