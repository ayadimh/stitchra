import { locales } from '@/lib/i18n';

export { metadata, default } from '../../features/page';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
