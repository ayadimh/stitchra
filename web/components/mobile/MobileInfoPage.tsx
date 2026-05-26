'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import StitchraLogo from '@/components/brand/StitchraLogo';
import { localeLabels, locales, type Locale } from '@/lib/i18n';

export type MobileInfoCard = {
  title: string;
  text: string;
  href?: string;
  cta?: string;
  bullets?: string[];
};

type MobileInfoPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  cards: MobileInfoCard[];
  current?: string;
};

const navItems = [
  { label: 'Start Designing', href: '/design' },
  { label: 'Explore', href: '/explore' },
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
];

const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  de: '🇩🇪',
  fr: '🇫🇷',
  ar: '🇸🇦',
  es: '🇪🇸',
  ru: '🇷🇺',
};

function getLocaleFromPath(pathname: string) {
  const firstSegment = pathname.split('/').filter(Boolean)[0];

  return locales.includes(firstSegment as Locale)
    ? (firstSegment as Locale)
    : 'en';
}

function hasLocalePrefix(pathname: string) {
  const firstSegment = pathname.split('/').filter(Boolean)[0];

  return locales.includes(firstSegment as Locale);
}

export default function MobileInfoPage({
  eyebrow,
  title,
  description,
  cards,
  current,
}: MobileInfoPageProps) {
  const pathname = usePathname() ?? '/';
  const activeLocale = useMemo(() => getLocaleFromPath(pathname), [pathname]);
  const localizedMode = hasLocalePrefix(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const homeHref = localizedMode ? `/${activeLocale}` : '/';
  const withLocale = (href: string) =>
    localizedMode ? `/${activeLocale}${href}` : href;

  const closeMenu = () => {
    setMenuOpen(false);
    setLanguageOpen(false);
  };

  const switchLocale = (nextLocale: Locale) => {
    const hash = window.location.hash;
    const segments = window.location.pathname.split('/').filter(Boolean);
    const rest =
      segments[0] && locales.includes(segments[0] as Locale)
        ? segments.slice(1)
        : segments;
    const nextPath = `/${nextLocale}${rest.length ? `/${rest.join('/')}` : ''}`;

    setLanguageOpen(false);
    setMenuOpen(false);
    window.location.assign(`${nextPath}${hash}`);
  };

  useEffect(() => {
    if (!menuOpen && !languageOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (languageOpen) {
        setLanguageOpen(false);
        return;
      }

      setMenuOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [languageOpen, menuOpen]);

  return (
    <main className="mobile-info-shell">
      <header className="mobile-info-header">
        <Link href={homeHref} className="mobile-info-brand" aria-label="Stitchra home">
          <StitchraLogo compact markOnly size={42} />
          <span>Stitchra</span>
        </Link>
        <div className="mobile-info-header-actions">
          <Link href={withLocale('/design')} className="mobile-info-primary">
            Start Designing
          </Link>
          <button
            type="button"
            className="mobile-info-menu-button"
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            Menu
          </button>
        </div>
      </header>

      <section className="mobile-info-hero">
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="mobile-info-actions">
          <Link href={withLocale('/design')}>Start Designing</Link>
          <Link href={withLocale('/explore')}>Explore</Link>
        </div>
      </section>

      <section className="mobile-info-grid" aria-label={title}>
        {cards.map((card) => {
          const content = (
            <>
              <h2>{card.title}</h2>
              <p>{card.text}</p>
              {card.bullets ? (
                <ul>
                  {card.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
              {card.cta ? <strong>{card.cta}</strong> : null}
            </>
          );

          return card.href ? (
            <Link key={card.title} href={withLocale(card.href)} className="mobile-info-card">
              {content}
            </Link>
          ) : (
            <article key={card.title} className="mobile-info-card">
              {content}
            </article>
          );
        })}
      </section>

      <footer className="mobile-info-footer">
        <nav aria-label="Stitchra mobile pages">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={withLocale(item.href)}
              aria-current={current === item.href ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <p>Stitchra · AI embroidery studio</p>
      </footer>

      {menuOpen && (
        <div className="mobile-info-sheet-backdrop" onClick={closeMenu} role="presentation">
          <section
            className="mobile-info-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-info-menu-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobile-info-sheet-heading">
              <div>
                <p>Stitchra</p>
                <h2 id="mobile-info-menu-title">Menu</h2>
              </div>
              <button type="button" onClick={closeMenu} aria-label="Close menu">
                ×
              </button>
            </div>
            <nav className="mobile-info-sheet-links" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <Link key={item.href} href={withLocale(item.href)} onClick={closeMenu}>
                  <span>{item.label}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              ))}
            </nav>
            <button
              type="button"
              className="mobile-info-language-card"
              onClick={() => setLanguageOpen(true)}
            >
              <span>
                <small>Language</small>
                {localeFlags[activeLocale]} {localeLabels[activeLocale].name}
              </span>
              <strong>{localeLabels[activeLocale].code}</strong>
            </button>
          </section>
        </div>
      )}

      {languageOpen && (
        <div
          className="mobile-info-sheet-backdrop mobile-info-language-backdrop"
          onClick={() => setLanguageOpen(false)}
          role="presentation"
        >
          <section
            className="mobile-info-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-info-language-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobile-info-sheet-heading">
              <div>
                <p>Language</p>
                <h2 id="mobile-info-language-title">Choose language</h2>
              </div>
              <button
                type="button"
                onClick={() => setLanguageOpen(false)}
                aria-label="Close language selector"
              >
                ×
              </button>
            </div>
            <div className="mobile-info-language-options">
              {locales.map((item) => {
                const active = item === activeLocale;

                return (
                  <button
                    key={item}
                    type="button"
                    className={active ? 'mobile-info-language-active' : ''}
                    onClick={() => switchLocale(item)}
                  >
                    <span>{localeFlags[item]} {localeLabels[item].name}</span>
                    <strong>
                      {localeLabels[item].code}
                      {active ? <span aria-hidden="true"> ✓</span> : null}
                    </strong>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      <style>{`
        .mobile-info-shell {
          min-height: 100svh;
          overflow-x: hidden;
          background:
            radial-gradient(circle at 18% 0%, rgba(0,255,136,0.16), transparent 34%),
            radial-gradient(circle at 92% 8%, rgba(0,200,255,0.12), transparent 32%),
            #050607;
          color: #f7fff9;
          font-family: var(--font-geist-sans), Inter, "Avenir Next", "Helvetica Neue", Arial, sans-serif;
          padding: calc(14px + env(safe-area-inset-top)) 14px calc(30px + env(safe-area-inset-bottom));
        }

        .mobile-info-header {
          max-width: 1060px;
          margin: 0 auto;
          min-height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .mobile-info-header-actions {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .mobile-info-brand,
        .mobile-info-primary,
        .mobile-info-actions a,
        .mobile-info-card {
          text-decoration: none;
        }

        .mobile-info-brand {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #f7fff9;
          font-weight: 950;
        }

        .mobile-info-brand span {
          font-size: 18px;
          letter-spacing: 0;
        }

        .mobile-info-primary {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          color: #06100a;
          background: linear-gradient(135deg, #00ff88, #00c8ff);
          padding: 0 14px;
          font-size: 13px;
          font-weight: 950;
          white-space: nowrap;
        }

        .mobile-info-menu-button {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 999px;
          color: #f7fff9;
          background: rgba(255,255,255,0.055);
          padding: 0 13px;
          font: inherit;
          font-size: 13px;
          font-weight: 900;
        }

        .mobile-info-hero {
          max-width: 820px;
          margin: clamp(22px, 8vw, 64px) auto 18px;
          display: grid;
          gap: 14px;
          padding: clamp(26px, 7vw, 48px);
          border: 1px solid rgba(140,255,220,0.18);
          border-radius: 34px;
          background:
            radial-gradient(circle at 14% 0%, rgba(0,255,136,0.14), transparent 34%),
            rgba(255,255,255,0.045);
          box-shadow: 0 34px 100px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.08);
        }

        .mobile-info-hero span {
          color: #18ff9a;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .mobile-info-hero h1 {
          margin: 0;
          color: #f7fff9;
          font-size: clamp(38px, 11vw, 72px);
          line-height: 0.98;
          letter-spacing: 0;
        }

        .mobile-info-hero p {
          max-width: 640px;
          margin: 0;
          color: rgba(246,255,249,0.68);
          font-size: 17px;
          line-height: 1.55;
        }

        .mobile-info-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 8px;
        }

        .mobile-info-actions a {
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          padding: 0 18px;
          color: #f7fff9;
          border: 1px solid rgba(255,255,255,0.13);
          background: rgba(255,255,255,0.055);
          font-weight: 900;
        }

        .mobile-info-actions a:first-child {
          color: #06100a;
          border-color: transparent;
          background: linear-gradient(135deg, #00ff88, #00c8ff);
        }

        .mobile-info-grid {
          max-width: 1060px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 14px;
        }

        .mobile-info-card {
          min-width: 0;
          display: grid;
          gap: 10px;
          padding: 20px;
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 24px;
          color: #f7fff9;
          background: rgba(255,255,255,0.045);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
        }

        .mobile-info-card h2 {
          margin: 0;
          font-size: 21px;
          letter-spacing: 0;
        }

        .mobile-info-card p,
        .mobile-info-card li {
          margin: 0;
          color: rgba(246,255,249,0.66);
          line-height: 1.55;
          font-size: 14.5px;
        }

        .mobile-info-card ul {
          margin: 0;
          padding-left: 18px;
        }

        .mobile-info-card strong {
          margin-top: 3px;
          color: #8dffc2;
          font-size: 13px;
        }

        .mobile-info-footer {
          max-width: 1060px;
          margin: 26px auto 0;
          display: grid;
          gap: 14px;
          color: rgba(246,255,249,0.56);
        }

        .mobile-info-footer nav {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .mobile-info-footer a {
          color: rgba(246,255,249,0.72);
          text-decoration: none;
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 999px;
          padding: 8px 11px;
          font-size: 13px;
        }

        .mobile-info-footer a[aria-current="page"] {
          color: #06100a;
          border-color: transparent;
          background: linear-gradient(135deg, #00ff88, #00c8ff);
        }

        .mobile-info-footer p {
          margin: 0;
          padding-bottom: env(safe-area-inset-bottom);
        }

        .mobile-info-sheet-backdrop {
          position: fixed;
          inset: 0;
          z-index: 230;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 18px;
          padding-bottom: max(18px, calc(18px + env(safe-area-inset-bottom)));
          background: rgba(0,0,0,0.62);
          backdrop-filter: blur(10px);
        }

        .mobile-info-language-backdrop {
          z-index: 240;
        }

        .mobile-info-sheet {
          width: min(100%, 480px);
          max-height: min(720px, calc(100dvh - 28px));
          overflow-y: auto;
          border: 1px solid rgba(140,255,220,0.18);
          border-radius: 30px 30px 24px 24px;
          background:
            radial-gradient(circle at 16% 0%, rgba(0,255,136,0.16), transparent 34%),
            radial-gradient(circle at 92% 14%, rgba(0,200,255,0.14), transparent 34%),
            rgba(4, 10, 11, 0.97);
          box-shadow: 0 34px 100px rgba(0,0,0,0.58), inset 0 1px 0 rgba(255,255,255,0.08);
        }

        .mobile-info-sheet-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          padding: 20px 20px 14px;
        }

        .mobile-info-sheet-heading p {
          margin: 0 0 4px;
          color: #18ff9a;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .mobile-info-sheet-heading h2 {
          margin: 0;
          color: #f7fff9;
          font-size: 22px;
          letter-spacing: 0;
        }

        .mobile-info-sheet-heading button {
          width: 40px;
          height: 40px;
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 999px;
          color: #f7fff9;
          background: rgba(255,255,255,0.06);
          font: inherit;
          font-size: 20px;
        }

        .mobile-info-sheet-links,
        .mobile-info-language-options {
          display: grid;
          gap: 6px;
          padding: 12px;
          border-top: 1px solid rgba(255,255,255,0.08);
        }

        .mobile-info-sheet-links a,
        .mobile-info-language-options button,
        .mobile-info-language-card {
          min-height: 52px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 18px;
          color: rgba(246,255,249,0.84);
          background: rgba(255,255,255,0.045);
          padding: 0 14px;
          font: inherit;
          font-weight: 850;
          text-decoration: none;
        }

        .mobile-info-language-card {
          margin: 0 12px 14px;
          min-height: 66px;
        }

        .mobile-info-language-card small {
          display: block;
          margin-bottom: 4px;
          color: rgba(246,255,249,0.52);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .mobile-info-language-card strong,
        .mobile-info-language-options strong {
          color: #9dffc4;
          font-size: 13px;
          letter-spacing: 0.08em;
        }

        .mobile-info-language-active {
          border-color: rgba(0,255,170,0.34) !important;
          background:
            linear-gradient(135deg, rgba(0,255,136,0.16), rgba(0,200,255,0.10)) !important;
          color: #f7fff9 !important;
        }

        @media (max-width: 540px) {
          .mobile-info-shell {
            padding-inline: 12px;
          }

          .mobile-info-primary {
            padding-inline: 12px;
            font-size: 12px;
          }

          .mobile-info-menu-button {
            padding-inline: 12px;
          }

          .mobile-info-actions {
            display: grid;
          }
        }
      `}</style>
    </main>
  );
}
