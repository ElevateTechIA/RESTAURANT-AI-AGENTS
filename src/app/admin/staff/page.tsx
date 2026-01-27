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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  Shield,
  UserCheck,
  UserX,
} from 'lucide-react';
import { toast } from 'sonner';

// Demo staff data
const DEMO_STAFF = [
  {
    id: '1',
    name: 'Carlos García',
    email: 'carlos@restaurant.com',
    phone: '+1 555-0101',
    role: 'admin',
    status: 'active',
    joinedAt: '2023-01-15',
  },
  {
    id: '2',
    name: 'María López',
    email: 'maria@restaurant.com',
    phone: '+1 555-0102',
    role: 'manager',
    status: 'active',
    joinedAt: '2023-03-20',
  },
  {
    id: '3',
    name: 'Juan Rodríguez',
    email: 'juan@restaurant.com',
    phone: '+1 555-0103',
    role: 'server',
    status: 'active',
    joinedAt: '2023-06-10',
  },
  {
    id: '4',
    name: 'Ana Martínez',
    email: 'ana@restaurant.com',
    phone: '+1 555-0104',
    role: 'server',
    status: 'active',
    joinedAt: '2023-07-05',
  },
  {
    id: '5',
    name: 'Pedro Sánchez',
    email: 'pedro@restaurant.com',
    phone: '+1 555-0105',
    role: 'server',
    status: 'inactive',
    joinedAt: '2023-04-12',
  },
  {
    id: '6',
    name: 'Laura González',
    email: 'laura@restaurant.com',
    phone: '+1 555-0106',
    role: 'manager',
    status: 'active',
    joinedAt: '2023-08-01',
  },
];

type StaffMember = typeof DEMO_STAFF[0];

export default function StaffManagementPage() {
  const t = useTranslations();
  const [staff, setStaff] = useState(DEMO_STAFF);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);

  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'server',
  });

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      superadmin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      admin: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      manager: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      server: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return colors[role] || colors.server;
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      superadmin: 'Super Admin',
      admin: 'Admin',
      manager: 'Gerente',
      server: 'Mesero',
    };
    return labels[role] || role;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAddStaff = () => {
    const id = Date.now().toString();
    const member: StaffMember = {
      id,
      name: newStaff.name,
      email: newStaff.email,
      phone: newStaff.phone,
      role: newStaff.role,
      status: 'active',
      joinedAt: new Date().toISOString().split('T')[0],
    };
    setStaff([...staff, member]);
    setIsAddStaffOpen(false);
    setNewStaff({ name: '', email: '', phone: '', role: 'server' });
    toast.success('Empleado agregado exitosamente');
  };

  const handleToggleStatus = (memberId: string) => {
    setStaff(staff.map((member) =>
      member.id === memberId
        ? { ...member, status: member.status === 'active' ? 'inactive' : 'active' }
        : member
    ));
    toast.success('Estado actualizado');
  };

  const handleDeleteStaff = (memberId: string) => {
    setStaff(staff.filter((member) => member.id !== memberId));
    toast.success('Empleado eliminado');
  };

  const staffCounts = {
    all: staff.length,
    active: staff.filter((s) => s.status === 'active').length,
    admin: staff.filter((s) => s.role === 'admin' || s.role === 'superadmin').length,
    manager: staff.filter((s) => s.role === 'manager').length,
    server: staff.filter((s) => s.role === 'server').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.staff')}</h1>
          <p className="text-muted-foreground">
            Gestiona el personal del restaurante
          </p>
        </div>
        <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Empleado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Empleado</DialogTitle>
              <DialogDescription>
                Agrega un nuevo miembro al equipo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre Completo</Label>
                <Input
                  value={newStaff.name}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, name: e.target.value })
                  }
                  placeholder="Juan Pérez"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, email: e.target.value })
                  }
                  placeholder="juan@restaurant.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={newStaff.phone}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, phone: e.target.value })
                  }
                  placeholder="+1 555-0100"
                />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={newStaff.role}
                  onValueChange={(value) =>
                    setNewStaff({ ...newStaff, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="server">Mesero</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddStaffOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddStaff}>Agregar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{staffCounts.all}</p>
              </div>
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold">{staffCounts.active}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gerentes</p>
                <p className="text-2xl font-bold">{staffCounts.manager}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Meseros</p>
                <p className="text-2xl font-bold">{staffCounts.server}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Gerente</SelectItem>
            <SelectItem value="server">Mesero</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle>Equipo</CardTitle>
          <CardDescription>
            {filteredStaff.length} miembros del equipo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredStaff.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{member.name}</h3>
                      <Badge className={getRoleColor(member.role)}>
                        {getRoleLabel(member.role)}
                      </Badge>
                      {member.status === 'inactive' && (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {member.phone}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(member.id)}
                  >
                    {member.status === 'active' ? (
                      <>
                        <UserX className="h-4 w-4 mr-1" />
                        Desactivar
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-1" />
                        Activar
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteStaff(member.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredStaff.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron empleados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
