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
  const languageAlternates = locales.reduce<Record<string, string>>(
    (alternates, item) => {
      alternates[item] = `/${item}`;
      return alternates;
    },
    {}
  );

  return {
    ...metadata,
    alternates: {
      canonical: `/${locale}`,
      languages: languageAlternates,
    },
    openGraph: {
      ...metadata,
      url: `https://stitchra.com/${locale}`,
      siteName: 'Stitchra',
      type: 'website',
      images: [
        {
          url: '/brand/exports/social/stitchra-og.png',
          width: 1200,
          height: 630,
          alt: 'Stitchra AI Embroidery T-Shirt Platform',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      ...metadata,
      images: ['/brand/exports/social/stitchra-twitter.png'],
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
