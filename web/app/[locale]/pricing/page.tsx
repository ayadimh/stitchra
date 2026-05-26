import { locales } from '@/lib/i18n';

export { metadata, default } from '../../pricing/page';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
