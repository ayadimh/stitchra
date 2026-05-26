import { locales } from '@/lib/i18n';

export { metadata, default } from '../../how-it-works/page';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
