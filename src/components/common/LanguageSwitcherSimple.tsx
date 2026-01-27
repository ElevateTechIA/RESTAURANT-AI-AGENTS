'use client';

import { useLocale } from 'next-intl';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { changeLocale } from '@/components/providers/IntlProvider';

type Locale = 'en' | 'es';

const languageNames: Record<Locale, string> = {
  en: 'English',
  es: 'Espanol',
};

const languageFlags: Record<Locale, string> = {
  en: 'US',
  es: 'ES',
};

export function LanguageSwitcherSimple() {
  const locale = useLocale() as Locale;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Change language">
          <Globe className="h-5 w-5" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(['en', 'es'] as Locale[]).map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => changeLocale(loc)}
            className={locale === loc ? 'bg-accent' : ''}
          >
            <span className="mr-2 font-mono text-xs">{languageFlags[loc]}</span>
            {languageNames[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
