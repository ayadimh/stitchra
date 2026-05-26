import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Home from '../../page';
import { isLocale, locales } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Design | Stitchra',
  description:
    'Start a Stitchra embroidery design with your own logo or an AI concept.',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocalizedDesignPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <Home locale={locale} entry="design" />;
}
