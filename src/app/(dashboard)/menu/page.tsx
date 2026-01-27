'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Search,
  Plus,
  Leaf,
  Wheat,
  Clock,
  ShoppingCart,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface MenuItem {
  id: string;
  categoryId: string;
  name: { en: string; es: string };
  description: { en: string; es: string };
  price: number;
  imageUrl: string | null;
  allergens: string[];
  dietaryFlags: string[];
  preparationTime: number;
  calories: number | null;
  availability: {
    isAvailable: boolean;
    stockCount: number | null;
  };
}

interface MenuCategory {
  id: string;
  name: { en: string; es: string };
  description: { en: string; es: string };
  imageUrl: string | null;
  sortOrder: number;
}

export default function MenuPage() {
  const t = useTranslations();
  const locale = useLocale() as 'en' | 'es';
  const { addItem, itemCount, total } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Demo restaurant ID (in production, this would come from context or URL)
  const restaurantId = 'demo_restaurant';

  useEffect(() => {
    async function fetchMenu() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/menu?restaurantId=${restaurantId}&availableOnly=false`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch menu');
        }

        const data = await response.json();
        setCategories(data.categories || []);
        setItems(data.items || []);
      } catch (err: any) {
        console.error('Error fetching menu:', err);
        setError(err.message || 'Failed to load menu');
      } finally {
        setIsLoading(false);
      }
    }

    fetchMenu();
  }, [restaurantId]);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name[locale].toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description[locale].toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === 'all' || item.categoryId === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (item: MenuItem) => {
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
    });
    toast.success(t('menu.item.addToOrder'));
  };

  const isVegetarian = (item: MenuItem) =>
    item.dietaryFlags.includes('vegetarian');
  const isVegan = (item: MenuItem) => item.dietaryFlags.includes('vegan');
  const isGlutenFree = (item: MenuItem) =>
    item.dietaryFlags.includes('gluten-free');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-6xl mx-auto py-6 px-4">
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('common.error')}</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-6 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{t('menu.title')}</h1>
              <p className="text-muted-foreground text-sm">
                {t('menu.searchPlaceholder')}
              </p>
            </div>
          </div>

          {/* Cart Button */}
          {itemCount > 0 && (
            <Link href="/checkout">
              <Button className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                {itemCount} - ${total.toFixed(2)}
              </Button>
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('menu.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all">{t('menu.allItems')}</TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name[locale]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Menu Items */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="h-40 bg-muted flex items-center justify-center">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name[locale]}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">🍽️</span>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{item.name[locale]}</CardTitle>
                  <span className="font-bold text-primary">
                    ${item.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {isVegetarian(item) && (
                    <Badge variant="secondary" className="text-xs">
                      <Leaf className="h-3 w-3 mr-1" />
                      {t('menu.filters.vegetarian')}
                    </Badge>
                  )}
                  {isVegan(item) && (
                    <Badge variant="secondary" className="text-xs">
                      <Leaf className="h-3 w-3 mr-1" />
                      {t('menu.filters.vegan')}
                    </Badge>
                  )}
                  {isGlutenFree(item) && (
                    <Badge variant="secondary" className="text-xs">
                      <Wheat className="h-3 w-3 mr-1" />
                      {t('menu.filters.glutenFree')}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <CardDescription>{item.description[locale]}</CardDescription>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {item.preparationTime} min
                  {item.calories && (
                    <span className="ml-2">• {item.calories} cal</span>
                  )}
                </div>
                {item.allergens.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {t('menu.item.allergens')}: {item.allergens.join(', ')}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full gap-2"
                  onClick={() => addToCart(item)}
                  disabled={!item.availability.isAvailable}
                >
                  <Plus className="h-4 w-4" />
                  {item.availability.isAvailable
                    ? t('menu.item.addToOrder')
                    : t('menu.item.unavailable')}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {t('menu.noResults')}
          </div>
        )}
      </div>
    </div>
  );
}
