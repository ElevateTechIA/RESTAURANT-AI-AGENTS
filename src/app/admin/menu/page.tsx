'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Leaf,
  Wheat,
  GripVertical,
  ImagePlus,
  Loader2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminMenuItem {
  id: string;
  categoryId: string;
  name: { en: string; es: string };
  description: { en: string; es: string };
  price: number;
  imageUrl: string | null;
  dietaryFlags: string[];
  preparationTime: number;
  availability: {
    isAvailable: boolean;
    stockCount: number | null;
  };
}

interface AdminCategory {
  id: string;
  name: { en: string; es: string };
  sortOrder: number;
}

// Fallback demo data when API is unavailable
const DEMO_CATEGORIES: AdminCategory[] = [
  { id: 'starters', name: { en: 'Starters', es: 'Entradas' }, sortOrder: 1 },
  { id: 'mains', name: { en: 'Main Courses', es: 'Platos Principales' }, sortOrder: 2 },
  { id: 'desserts', name: { en: 'Desserts', es: 'Postres' }, sortOrder: 3 },
  { id: 'drinks', name: { en: 'Drinks', es: 'Bebidas' }, sortOrder: 4 },
];

const DEMO_ITEMS: AdminMenuItem[] = [
  {
    id: '1',
    categoryId: 'starters',
    name: { en: 'Caesar Salad', es: 'Ensalada Cesar' },
    description: {
      en: 'Fresh romaine lettuce with parmesan and croutons',
      es: 'Lechuga romana fresca con parmesano y crutones',
    },
    price: 12.99,
    imageUrl: null,
    dietaryFlags: ['vegetarian'],
    preparationTime: 10,
    availability: { isAvailable: true, stockCount: null },
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
    imageUrl: null,
    dietaryFlags: ['vegetarian', 'vegan', 'gluten-free'],
    preparationTime: 5,
    availability: { isAvailable: true, stockCount: null },
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
    imageUrl: null,
    dietaryFlags: ['gluten-free'],
    preparationTime: 20,
    availability: { isAvailable: true, stockCount: null },
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
    imageUrl: null,
    dietaryFlags: ['vegetarian'],
    preparationTime: 15,
    availability: { isAvailable: true, stockCount: null },
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
    imageUrl: null,
    dietaryFlags: ['vegetarian'],
    preparationTime: 5,
    availability: { isAvailable: true, stockCount: null },
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
    imageUrl: null,
    dietaryFlags: ['vegan', 'gluten-free'],
    preparationTime: 3,
    availability: { isAvailable: true, stockCount: null },
  },
];

export default function MenuManagementPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [items, setItems] = useState<AdminMenuItem[]>(DEMO_ITEMS);
  const [categories, setCategories] = useState<AdminCategory[]>(DEMO_CATEGORIES);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminMenuItem | null>(null);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedItemIdRef = useRef<string | null>(null);

  const restaurantId = 'demo_restaurant';
  const locale = 'es';

  // Fetch menu data from API
  useEffect(() => {
    async function fetchMenu() {
      try {
        const response = await fetch(
          `/api/menu?restaurantId=${restaurantId}&availableOnly=false`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.categories?.length > 0) {
            setCategories(
              data.categories.map((c: any) => ({
                id: c.id,
                name: c.name,
                sortOrder: c.sortOrder,
              }))
            );
          }
          if (data.items?.length > 0) {
            setItems(
              data.items.map((item: any) => ({
                id: item.id,
                categoryId: item.categoryId,
                name: item.name,
                description: item.description,
                price: item.price,
                imageUrl: item.imageUrl || null,
                dietaryFlags: item.dietaryFlags || [],
                preparationTime: item.preparationTime || 10,
                availability: item.availability || {
                  isAvailable: true,
                  stockCount: null,
                },
              }))
            );
          }
        }
      } catch (err) {
        console.error('Error fetching menu, using demo data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMenu();
  }, []);

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
    const dietaryFlags: string[] = [];
    if (newItem.isVegetarian) dietaryFlags.push('vegetarian');
    if (newItem.isVegan) dietaryFlags.push('vegan');
    if (newItem.isGlutenFree) dietaryFlags.push('gluten-free');

    const item: AdminMenuItem = {
      id,
      categoryId: newItem.categoryId,
      name: newItem.name,
      description: newItem.description,
      price: parseFloat(newItem.price) || 0,
      imageUrl: null,
      dietaryFlags,
      preparationTime: parseInt(newItem.prepTime) || 10,
      availability: { isAvailable: newItem.available, stockCount: null },
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
    const category: AdminCategory = {
      id,
      name: newCategory.name,
      sortOrder: categories.length + 1,
    };
    setCategories([...categories, category]);
    setIsAddCategoryOpen(false);
    setNewCategory({ name: { en: '', es: '' } });
    toast.success('Categoria agregada exitosamente');
  };

  const handleToggleAvailability = (itemId: string) => {
    setItems(
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              availability: {
                ...item.availability,
                isAvailable: !item.availability.isAvailable,
              },
            }
          : item
      )
    );
    toast.success('Disponibilidad actualizada');
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId));
    toast.success('Item eliminado');
  };

  const handleImageClick = (itemId: string) => {
    selectedItemIdRef.current = itemId;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const itemId = selectedItemIdRef.current;

    if (!file || !itemId) return;

    // Reset input so the same file can be selected again
    e.target.value = '';

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato no soportado. Usa JPEG, PNG, WebP o AVIF.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen es muy grande. Maximo 5MB.');
      return;
    }

    setUploadingItemId(itemId);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('itemId', itemId);
      formData.append('restaurantId', restaurantId);

      const response = await fetch('/api/menu/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al subir la imagen');
      }

      const { imageUrl } = await response.json();

      // Update the item in local state
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, imageUrl } : item
        )
      );

      toast.success('Imagen actualizada exitosamente');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Error al subir la imagen');
    } finally {
      setUploadingItemId(null);
      selectedItemIdRef.current = null;
    }
  };

  const handleRemoveImage = async (itemId: string) => {
    try {
      const response = await fetch('/api/menu/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, restaurantId, removeImage: true }),
      });

      // Even if the API fails, remove locally
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, imageUrl: null } : item
        )
      );
      toast.success('Imagen eliminada');
    } catch {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, imageUrl: null } : item
        )
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.menuManagement')}</h1>
          <p className="text-muted-foreground">
            Gestiona las categorias y articulos del menu
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Categoria</DialogTitle>
                <DialogDescription>
                  Agrega una nueva categoria al menu
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre (Ingles)</Label>
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
                  <Label>Nombre (Espanol)</Label>
                  <Input
                    value={newCategory.name.es}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        name: { ...newCategory.name, es: e.target.value },
                      })
                    }
                    placeholder="Nombre de categoria"
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
                <DialogTitle>Nuevo Item del Menu</DialogTitle>
                <DialogDescription>
                  Agrega un nuevo articulo al menu
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nombre (Ingles)</Label>
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
                    <Label>Nombre (Espanol)</Label>
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
                    <Label>Descripcion (Ingles)</Label>
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
                    <Label>Descripcion (Espanol)</Label>
                    <Textarea
                      value={newItem.description.es}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          description: { ...newItem.description, es: e.target.value },
                        })
                      }
                      placeholder="Descripcion"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Categoria</Label>
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
                  <Label>Opciones Dieteticas</Label>
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
            {filteredItems.length} items en el menu
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

                  {/* Clickable image area */}
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => handleImageClick(item.id)}
                      disabled={uploadingItemId === item.id}
                      className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden border-2 border-transparent hover:border-primary/50 transition-colors cursor-pointer disabled:cursor-wait"
                      title="Cambiar imagen"
                    >
                      {uploadingItemId === item.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name[locale]}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <ImagePlus className="h-5 w-5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">Imagen</span>
                        </div>
                      )}
                    </button>

                    {/* Overlay on hover when image exists */}
                    {item.imageUrl && uploadingItemId !== item.id && (
                      <>
                        <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ImagePlus className="h-5 w-5 text-white" />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(item.id);
                          }}
                          className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                          title="Eliminar imagen"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{item.name[locale]}</h3>
                      {!item.availability.isAvailable && (
                        <Badge variant="secondary" className="text-xs">
                          No disponible
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {item.description[locale]}
                    </p>
                    <div className="flex gap-1 mt-1">
                      {item.dietaryFlags.includes('vegetarian') && (
                        <Badge variant="outline" className="text-xs">
                          <Leaf className="h-3 w-3 mr-1" />
                          Veg
                        </Badge>
                      )}
                      {item.dietaryFlags.includes('gluten-free') && (
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
                      {item.preparationTime} min
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.availability.isAvailable}
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
            Gestiona las categorias del menu
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
