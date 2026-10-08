'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';

import en from '../locales/en.json';
import bn from '../locales/bn.json';

const dictionaries: Record<string, any> = { en, bn };

type Language = 'en' | 'bn';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('app_language') as Language;
    if (saved === 'en' || saved === 'bn') {
      setLanguageState(saved);
      if (saved === 'bn') {
        document.body.classList.add('font-bangla-active');
      } else {
        document.body.classList.remove('font-bangla-active');
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
    if (lang === 'bn') {
      document.body.classList.add('font-bangla-active');
    } else {
      document.body.classList.remove('font-bangla-active');
    }
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <NextIntlClientProvider locale={language} messages={dictionaries[language]}>
        {children}
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('Must be used within LanguageProvider');
  return context;
};
