import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Home from '../page';
import {
  getLocalizedMetadata,
  isLocale,
  locales,
} from '@/lib/i18n';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const metadata = getLocalizedMetadata(locale);

  return {
    ...metadata,
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(
        locales.map((item) => [item, `/${item}`])
      ),
    },
    openGraph: {
      ...metadata,
      url: `https://stitchra.com/${locale}`,
      siteName: 'Stitchra',
      type: 'website',
      images: ['/stitchra-og.png'],
    },
    twitter: {
      card: 'summary_large_image',
      ...metadata,
      images: ['/stitchra-og.png'],
    },
  };
}

export default async function LocalizedHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <Home locale={locale} />;
}
