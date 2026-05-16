import ar from '@/messages/ar.json';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import es from '@/messages/es.json';
import fr from '@/messages/fr.json';
import ru from '@/messages/ru.json';

export const locales = ['en', 'de', 'fr', 'ar', 'es', 'ru'] as const;
export type Locale = (typeof locales)[number];
export type Translator = (key: string) => string;

export const defaultLocale: Locale = 'en';

export const localeLabels: Record<
  Locale,
  { code: string; name: string }
> = {
  en: { code: 'EN', name: 'English' },
  de: { code: 'DE', name: 'Deutsch' },
  fr: { code: 'FR', name: 'Français' },
  ar: { code: 'AR', name: 'العربية' },
  es: { code: 'ES', name: 'Español' },
  ru: { code: 'RU', name: 'Русский' },
};

const dictionaries: Record<Locale, unknown> = {
  en,
  de,
  fr,
  ar,
  es,
  ru,
};

function getValue(source: unknown, path: string) {
  return path.split('.').reduce<unknown>((current, key) => {
    if (
      current &&
      typeof current === 'object' &&
      key in current
    ) {
      return (current as Record<string, unknown>)[key];
    }

    return undefined;
  }, source);
}

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function resolveLocale(value?: string | null): Locale {
  return value && isLocale(value) ? value : defaultLocale;
}

export function getLocaleDirection(locale: Locale) {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function createTranslator(locale: Locale): Translator {
  const dictionary = dictionaries[locale] ?? dictionaries[defaultLocale];
  const fallback = dictionaries[defaultLocale];

  return (key: string) => {
    const value = getValue(dictionary, key) ?? getValue(fallback, key);

    return typeof value === 'string' ? value : key;
  };
}

export function getLocalizedArray<T>(
  locale: Locale,
  key: string
): T[] {
  const dictionary = dictionaries[locale] ?? dictionaries[defaultLocale];
  const fallback = dictionaries[defaultLocale];
  const value = getValue(dictionary, key) ?? getValue(fallback, key);

  return Array.isArray(value) ? (value as T[]) : [];
}

export function getLocalizedMetadata(locale: Locale) {
  const t = createTranslator(locale);

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}
