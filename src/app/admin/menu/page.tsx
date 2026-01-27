'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Leaf,
  Wheat,
  GripVertical,
  ImagePlus,
} from 'lucide-react';
import { toast } from 'sonner';

// Demo categories
const DEMO_CATEGORIES = [
  { id: 'starters', name: { en: 'Starters', es: 'Entradas' }, order: 1 },
  { id: 'mains', name: { en: 'Main Courses', es: 'Platos Principales' }, order: 2 },
  { id: 'desserts', name: { en: 'Desserts', es: 'Postres' }, order: 3 },
  { id: 'drinks', name: { en: 'Drinks', es: 'Bebidas' }, order: 4 },
];

// Demo menu items
const DEMO_ITEMS = [
  {
    id: '1',
    categoryId: 'starters',
    name: { en: 'Caesar Salad', es: 'Ensalada Cesar' },
    description: {
      en: 'Fresh romaine lettuce with parmesan and croutons',
      es: 'Lechuga romana fresca con parmesano y crutones',
    },
    price: 12.99,
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    prepTime: 10,
    available: true,
  },
  {
    id: '2',
    categoryId: 'starters',
    name: { en: 'Tomato Soup', es: 'Sopa de Tomate' },
    description: {
      en: 'Homemade tomato soup with fresh basil',
      es: 'Sopa de tomate casera con albahaca fresca',
    },
    price: 8.99,
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    prepTime: 5,
    available: true,
  },
  {
    id: '3',
    categoryId: 'mains',
    name: { en: 'Grilled Salmon', es: 'Salmon a la Parrilla' },
    description: {
      en: 'Atlantic salmon with lemon butter sauce',
      es: 'Salmon del Atlantico con salsa de limon',
    },
    price: 24.99,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: true,
    prepTime: 20,
    available: true,
  },
  {
    id: '4',
    categoryId: 'mains',
    name: { en: 'Pasta Primavera', es: 'Pasta Primavera' },
    description: {
      en: 'Fresh pasta with seasonal vegetables',
      es: 'Pasta fresca con vegetales de temporada',
    },
    price: 18.99,
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    prepTime: 15,
    available: true,
  },
  {
    id: '5',
    categoryId: 'desserts',
    name: { en: 'Chocolate Cake', es: 'Pastel de Chocolate' },
    description: {
      en: 'Rich chocolate cake with vanilla ice cream',
      es: 'Pastel de chocolate con helado de vainilla',
    },
    price: 9.99,
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    prepTime: 5,
    available: true,
  },
  {
    id: '6',
    categoryId: 'drinks',
    name: { en: 'Fresh Lemonade', es: 'Limonada Fresca' },
    description: {
      en: 'Freshly squeezed lemonade with mint',
      es: 'Limonada recien exprimida con menta',
    },
    price: 4.99,
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    prepTime: 3,
    available: true,
  },
];

type MenuItem = typeof DEMO_ITEMS[0];
type Category = typeof DEMO_CATEGORIES[0];

export default function MenuManagementPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [items, setItems] = useState(DEMO_ITEMS);
  const [categories, setCategories] = useState(DEMO_CATEGORIES);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form states
  const [newItem, setNewItem] = useState({
    name: { en: '', es: '' },
    description: { en: '', es: '' },
    price: '',
    categoryId: '',
    prepTime: '',
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    available: true,
  });

  const [newCategory, setNewCategory] = useState({
    name: { en: '', es: '' },
  });

  const locale = 'es'; // Default to Spanish for admin

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name[locale].toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description[locale].toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === 'all' || item.categoryId === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddItem = () => {
    const id = Date.now().toString();
    const item: MenuItem = {
      id,
      categoryId: newItem.categoryId,
      name: newItem.name,
      description: newItem.description,
      price: parseFloat(newItem.price) || 0,
      prepTime: parseInt(newItem.prepTime) || 10,
      isVegetarian: newItem.isVegetarian,
      isVegan: newItem.isVegan,
      isGlutenFree: newItem.isGlutenFree,
      available: newItem.available,
    };
    setItems([...items, item]);
    setIsAddItemOpen(false);
    setNewItem({
      name: { en: '', es: '' },
      description: { en: '', es: '' },
      price: '',
      categoryId: '',
      prepTime: '',
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      available: true,
    });
    toast.success('Item agregado exitosamente');
  };

  const handleAddCategory = () => {
    const id = newCategory.name.en.toLowerCase().replace(/\s+/g, '-');
    const category: Category = {
      id,
      name: newCategory.name,
      order: categories.length + 1,
    };
    setCategories([...categories, category]);
    setIsAddCategoryOpen(false);
    setNewCategory({ name: { en: '', es: '' } });
    toast.success('Categoría agregada exitosamente');
  };

  const handleToggleAvailability = (itemId: string) => {
    setItems(items.map((item) =>
      item.id === itemId ? { ...item, available: !item.available } : item
    ));
    toast.success('Disponibilidad actualizada');
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId));
    toast.success('Item eliminado');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.menuManagement')}</h1>
          <p className="text-muted-foreground">
            Gestiona las categorías y artículos del menú
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Categoría
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Categoría</DialogTitle>
                <DialogDescription>
                  Agrega una nueva categoría al menú
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre (Inglés)</Label>
                  <Input
                    value={newCategory.name.en}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        name: { ...newCategory.name, en: e.target.value },
                      })
                    }
                    placeholder="Category name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nombre (Español)</Label>
                  <Input
                    value={newCategory.name.es}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        name: { ...newCategory.name, es: e.target.value },
                      })
                    }
                    placeholder="Nombre de categoría"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddCategory}>Agregar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuevo Item del Menú</DialogTitle>
                <DialogDescription>
                  Agrega un nuevo artículo al menú
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nombre (Inglés)</Label>
                    <Input
                      value={newItem.name.en}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          name: { ...newItem.name, en: e.target.value },
                        })
                      }
                      placeholder="Item name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre (Español)</Label>
                    <Input
                      value={newItem.name.es}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          name: { ...newItem.name, es: e.target.value },
                        })
                      }
                      placeholder="Nombre del item"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Descripción (Inglés)</Label>
                    <Textarea
                      value={newItem.description.en}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          description: { ...newItem.description, en: e.target.value },
                        })
                      }
                      placeholder="Description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción (Español)</Label>
                    <Textarea
                      value={newItem.description.es}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          description: { ...newItem.description, es: e.target.value },
                        })
                      }
                      placeholder="Descripción"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select
                      value={newItem.categoryId}
                      onValueChange={(value) =>
                        setNewItem({ ...newItem, categoryId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name[locale]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Precio ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newItem.price}
                      onChange={(e) =>
                        setNewItem({ ...newItem, price: e.target.value })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tiempo Prep. (min)</Label>
                    <Input
                      type="number"
                      value={newItem.prepTime}
                      onChange={(e) =>
                        setNewItem({ ...newItem, prepTime: e.target.value })
                      }
                      placeholder="10"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Opciones Dietéticas</Label>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newItem.isVegetarian}
                        onCheckedChange={(checked) =>
                          setNewItem({ ...newItem, isVegetarian: checked })
                        }
                      />
                      <Label>Vegetariano</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newItem.isVegan}
                        onCheckedChange={(checked) =>
                          setNewItem({ ...newItem, isVegan: checked })
                        }
                      />
                      <Label>Vegano</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newItem.isGlutenFree}
                        onCheckedChange={(checked) =>
                          setNewItem({ ...newItem, isGlutenFree: checked })
                        }
                      />
                      <Label>Sin Gluten</Label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={newItem.available}
                    onCheckedChange={(checked) =>
                      setNewItem({ ...newItem, available: checked })
                    }
                  />
                  <Label>Disponible</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddItem}>Agregar Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id}>
                {cat.name[locale]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Menu Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.items')}</CardTitle>
          <CardDescription>
            {filteredItems.length} items en el menú
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    🍽️
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{item.name[locale]}</h3>
                      {!item.available && (
                        <Badge variant="secondary" className="text-xs">
                          No disponible
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {item.description[locale]}
                    </p>
                    <div className="flex gap-1 mt-1">
                      {item.isVegetarian && (
                        <Badge variant="outline" className="text-xs">
                          <Leaf className="h-3 w-3 mr-1" />
                          Veg
                        </Badge>
                      )}
                      {item.isGlutenFree && (
                        <Badge variant="outline" className="text-xs">
                          <Wheat className="h-3 w-3 mr-1" />
                          GF
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold">${item.price.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.prepTime} min
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.available}
                      onCheckedChange={() => handleToggleAvailability(item.id)}
                    />
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron items
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories Management */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.categories')}</CardTitle>
          <CardDescription>
            Gestiona las categorías del menú
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  <div>
                    <h3 className="font-medium">{category.name[locale]}</h3>
                    <p className="text-sm text-muted-foreground">
                      {items.filter((i) => i.categoryId === category.id).length} items
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
