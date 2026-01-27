'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Calendar,
  Loader2,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Plus,
  CalendarDays,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Reservation {
  id: string;
  date: { _seconds: number; _nanoseconds: number } | Date;
  time: string;
  partySize: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  specialRequests?: string | null;
  tableId?: string | null;
  customerName?: string;
}

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'bg-yellow-500', label: 'Pending' },
  confirmed: { icon: CheckCircle, color: 'bg-green-500', label: 'Confirmed' },
  cancelled: { icon: XCircle, color: 'bg-red-500', label: 'Cancelled' },
  completed: { icon: CheckCircle, color: 'bg-gray-500', label: 'Completed' },
  no_show: { icon: AlertCircle, color: 'bg-orange-500', label: 'No Show' },
};

const RESTAURANT_ID = 'demo_restaurant';

export default function ReservationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const t = useTranslations();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReservation, setNewReservation] = useState({
    date: '',
    time: '19:00',
    partySize: '2',
    specialRequests: '',
  });

  // Fetch reservations from API
  const fetchReservations = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/reservations?customerId=${user.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch reservations');
      }

      const data = await response.json();
      setReservations(data.reservations || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error(t('common.error') || 'Error loading reservations');
    } finally {
      setIsLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user, fetchReservations]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getDateFromTimestamp = (date: Reservation['date']): Date => {
    if (date instanceof Date) return date;
    if (date && '_seconds' in date) {
      return new Date(date._seconds * 1000);
    }
    return new Date();
  };

  const formatDate = (date: Reservation['date']) => {
    const d = getDateFromTimestamp(date);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  };

  const handleCreateReservation = async () => {
    if (!newReservation.date || !newReservation.time) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: RESTAURANT_ID,
          customerId: user.id,
          customerName: user.displayName || 'Guest',
          customerEmail: user.email || '',
          customerPhone: '',
          date: newReservation.date,
          time: newReservation.time,
          partySize: newReservation.partySize,
          specialRequests: newReservation.specialRequests || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create reservation');
      }

      toast.success(t('reservation.success') || 'Reservation created successfully');
      setIsDialogOpen(false);
      setNewReservation({ date: '', time: '19:00', partySize: '2', specialRequests: '' });
      fetchReservations();
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      toast.error(error.message || 'Failed to create reservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelReservation = async (id: string) => {
    try {
      const response = await fetch('/api/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: id,
          action: 'cancel',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel reservation');
      }

      toast.success(t('reservation.cancelled') || 'Reservation cancelled');
      fetchReservations();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast.error(t('common.error') || 'Failed to cancel reservation');
    }
  };

  const now = new Date();
  const upcomingReservations = reservations.filter((r) => {
    const reservationDate = getDateFromTimestamp(r.date);
    return (r.status === 'pending' || r.status === 'confirmed') && reservationDate >= now;
  });
  const pastReservations = reservations.filter((r) => {
    const reservationDate = getDateFromTimestamp(r.date);
    return r.status === 'completed' || r.status === 'cancelled' || r.status === 'no_show' || reservationDate < now;
  });

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              {t('reservation.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('reservation.manage')}
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t('reservation.new')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('reservation.new')}</DialogTitle>
                <DialogDescription>
                  {t('reservation.newDescription') || 'Book a table at our restaurant'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="date">{t('reservation.date')}</Label>
                  <Input
                    id="date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={newReservation.date}
                    onChange={(e) =>
                      setNewReservation({ ...newReservation, date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">{t('reservation.time')}</Label>
                  <Select
                    value={newReservation.time}
                    onValueChange={(value) =>
                      setNewReservation({ ...newReservation, time: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'].map(
                        (time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partySize">{t('reservation.guests')}</Label>
                  <Select
                    value={newReservation.partySize}
                    onValueChange={(value) =>
                      setNewReservation({ ...newReservation, partySize: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size} {size === 1 ? 'guest' : 'guests'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialRequests">
                    {t('reservation.specialRequests')}
                  </Label>
                  <Input
                    id="specialRequests"
                    placeholder={t('reservation.specialRequestsPlaceholder') || 'Any special requests?'}
                    value={newReservation.specialRequests}
                    onChange={(e) =>
                      setNewReservation({
                        ...newReservation,
                        specialRequests: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleCreateReservation} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('common.loading') || 'Loading...'}
                    </>
                  ) : (
                    t('reservation.book')
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Upcoming Reservations */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {t('reservation.upcoming')}
          </h2>
          {upcomingReservations.length === 0 ? (
            <Card className="py-8">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {t('reservation.noUpcoming') || 'No upcoming reservations'}
                </p>
              </CardContent>
            </Card>
          ) : (
            upcomingReservations.map((reservation) => {
              const StatusIcon = STATUS_CONFIG[reservation.status].icon;
              return (
                <Card key={reservation.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {formatDate(reservation.date)}
                      </CardTitle>
                      <Badge
                        className={`${STATUS_CONFIG[reservation.status].color} text-white`}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {STATUS_CONFIG[reservation.status].label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{reservation.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {reservation.partySize}{' '}
                          {reservation.partySize === 1 ? 'guest' : 'guests'}
                        </span>
                      </div>
                      {reservation.tableId && (
                        <Badge variant="outline">{reservation.tableId}</Badge>
                      )}
                    </div>
                    {reservation.specialRequests && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Note: {reservation.specialRequests}
                      </p>
                    )}
                    {reservation.status !== 'cancelled' && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleCancelReservation(reservation.id)}
                        >
                          {t('reservation.cancel')}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Past Reservations */}
        {pastReservations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-muted-foreground">
              {t('reservation.past')}
            </h2>
            {pastReservations.map((reservation) => {
              const StatusIcon = STATUS_CONFIG[reservation.status].icon;
              return (
                <Card key={reservation.id} className="opacity-60">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {formatDate(reservation.date)}
                      </CardTitle>
                      <Badge variant="secondary">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {STATUS_CONFIG[reservation.status].label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{reservation.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {reservation.partySize}{' '}
                          {reservation.partySize === 1 ? 'guest' : 'guests'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
