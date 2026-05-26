import { locales } from '@/lib/i18n';

export { metadata, default } from '../../gallery/page';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
