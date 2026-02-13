'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface MenuItemDisplay {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  dietaryFlags?: string[];
}

interface MenuItemCardProps {
  item: MenuItemDisplay;
  compact?: boolean;
  className?: string;
}

export function MenuItemCard({ item, compact = false, className }: MenuItemCardProps) {
  return (
    <div className={cn(
      'flex gap-3 p-2 rounded-lg border bg-card',
      compact ? 'items-center' : 'items-start',
      className
    )}>
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt={item.name}
          className={cn(
            'rounded-md object-cover flex-shrink-0',
            compact ? 'w-12 h-12' : 'w-20 h-20'
          )}
          loading="lazy"
        />
      ) : (
        <div className={cn(
          'rounded-md bg-muted flex items-center justify-center flex-shrink-0',
          compact ? 'w-12 h-12' : 'w-20 h-20'
        )}>
          <span className={compact ? 'text-lg' : 'text-2xl'}>🍽️</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-medium text-sm truncate">{item.name}</h4>
          <span className="text-sm font-bold text-primary flex-shrink-0">
            ${item.price.toFixed(2)}
          </span>
        </div>
        {!compact && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {item.description}
          </p>
        )}
        {!compact && item.dietaryFlags && item.dietaryFlags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {item.dietaryFlags.map((flag) => (
              <Badge key={flag} variant="outline" className="text-[10px] px-1 py-0">
                {flag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
