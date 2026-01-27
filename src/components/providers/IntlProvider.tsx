'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode, useEffect, useState } from 'react';

// Import messages statically
import enMessages from '@/messages/en.json';
import esMessages from '@/messages/es.json';

const messages = {
  en: enMessages,
  es: esMessages,
};

type Locale = 'en' | 'es';

function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('locale');
  if (stored === 'en' || stored === 'es') return stored;
  // Check browser language
  const browserLang = navigator.language.split('-')[0];
  return browserLang === 'es' ? 'es' : 'en';
}

export function IntlProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocale(getStoredLocale());
    setMounted(true);

    // Listen for locale changes
    const handleLocaleChange = (e: CustomEvent<Locale>) => {
      setLocale(e.detail);
      localStorage.setItem('locale', e.detail);
    };

    window.addEventListener('localeChange', handleLocaleChange as EventListener);
    return () => {
      window.removeEventListener('localeChange', handleLocaleChange as EventListener);
    };
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <NextIntlClientProvider locale="en" messages={messages.en}>
        {children}
      </NextIntlClientProvider>
    );
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      {children}
    </NextIntlClientProvider>
  );
}

// Helper function to change locale from anywhere
export function changeLocale(newLocale: Locale) {
  localStorage.setItem('locale', newLocale);
  window.dispatchEvent(new CustomEvent('localeChange', { detail: newLocale }));
}
