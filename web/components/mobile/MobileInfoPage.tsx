'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import StitchraLogo from '@/components/brand/StitchraLogo';
import {
  getLocaleDirection,
  getLocalizedRouteItems,
  getMobileInfoPageCopy,
  getPathLocale,
  getPublicI18nCopy,
  localeFlags,
  localeLabels,
  localizedPath,
  locales,
  switchLocalePath,
  type Locale,
  type MobileInfoPageKey,
} from '@/lib/i18n';

type MobileInfoPageProps = {
  pageKey: MobileInfoPageKey;
  current?: string;
};

export default function MobileInfoPage({
  pageKey,
  current,
}: MobileInfoPageProps) {
  const pathname = usePathname() ?? '/';
  const activeLocale = useMemo(() => getPathLocale(pathname), [pathname]);
  const direction = getLocaleDirection(activeLocale);
  const publicCopy = getPublicI18nCopy(activeLocale);
  const pageCopy = getMobileInfoPageCopy(activeLocale, pageKey);
  const navItems = getLocalizedRouteItems(activeLocale);
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const homeHref = localizedPath(activeLocale, '/');
  const withLocale = (href: string) => localizedPath(activeLocale, href);
  const arrow = direction === 'rtl' ? '←' : '→';

  const closeMenu = () => {
    setMenuOpen(false);
    setLanguageOpen(false);
  };

  const switchLocale = (nextLocale: Locale) => {
    const hash = window.location.hash;
    const nextPath = switchLocalePath(window.location.pathname, nextLocale);

    setLanguageOpen(false);
    setMenuOpen(false);
    try {
      window.localStorage.setItem('stitchra-locale', nextLocale);
    } catch {
      // Local storage can be unavailable in private browsing modes.
    }
    window.location.assign(`${nextPath}${hash}`);
  };

  useEffect(() => {
    if (!menuOpen && !languageOpen) {
      delete document.body.dataset.stitchraMobileSheetOpen;
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.dataset.stitchraMobileSheetOpen = 'true';

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
      delete document.body.dataset.stitchraMobileSheetOpen;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [languageOpen, menuOpen]);

  return (
    <main className="mobile-info-shell" lang={activeLocale} dir={direction}>
      <header className="mobile-info-header">
        <Link href={homeHref} className="mobile-info-brand" aria-label="Stitchra home">
          <StitchraLogo compact markOnly size={42} />
          <span>Stitchra</span>
        </Link>
        <div className="mobile-info-header-actions">
          <Link href={withLocale('/design')} className="mobile-info-primary">
            {publicCopy.common.startDesigning}
          </Link>
          <button
            type="button"
            className="mobile-info-menu-button"
            aria-label={publicCopy.menu.ariaOpen}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            {publicCopy.common.menu}
          </button>
        </div>
      </header>

      <section className="mobile-info-hero">
        <span>{pageCopy.eyebrow}</span>
        <h1>{pageCopy.title}</h1>
        <p>{pageCopy.description}</p>
        <div className="mobile-info-actions">
          <Link href={withLocale('/design')}>{publicCopy.common.startDesigning}</Link>
          <Link href={withLocale('/explore')}>{publicCopy.common.explore}</Link>
        </div>
      </section>

      <section className="mobile-info-grid" aria-label={pageCopy.title}>
        {pageCopy.cards.map((card) => {
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
        <p>Stitchra · {publicCopy.footer.tagline}</p>
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
                <h2 id="mobile-info-menu-title">{publicCopy.menu.title}</h2>
              </div>
              <button type="button" onClick={closeMenu} aria-label={publicCopy.menu.ariaClose}>
                ×
              </button>
            </div>
            <nav className="mobile-info-sheet-links" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <Link key={item.href} href={withLocale(item.href)} onClick={closeMenu}>
                  <span>{item.label}</span>
                  <span aria-hidden="true">{arrow}</span>
                </Link>
              ))}
            </nav>
            <button
              type="button"
              className="mobile-info-language-card"
              onClick={() => setLanguageOpen(true)}
            >
              <span>
                <small>{publicCopy.common.language}</small>
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
                <p>{publicCopy.common.language}</p>
                <h2 id="mobile-info-language-title">{publicCopy.common.chooseLanguage}</h2>
              </div>
              <button
                type="button"
                onClick={() => setLanguageOpen(false)}
                aria-label={publicCopy.menu.ariaCloseLanguage}
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
          font-family: var(--font-sans), "Helvetica Neue", Arial, sans-serif;
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
          inset: 0 !important;
          width: 100vw;
          width: 100dvw;
          min-height: 100vh;
          min-height: 100dvh;
          z-index: 280;
          display: block;
          padding: 0;
          box-sizing: border-box;
          overflow: hidden;
          overflow-x: hidden;
          overscroll-behavior: contain;
          touch-action: pan-y;
          background: rgba(0,0,0,0.62);
          backdrop-filter: blur(10px);
        }

        .mobile-info-language-backdrop {
          z-index: 300;
        }

        .mobile-info-sheet {
          position: fixed;
          left: 50%;
          right: auto;
          bottom: max(12px, env(safe-area-inset-bottom));
          width: min(calc(100vw - 24px), 480px);
          width: min(calc(100dvw - 24px), 480px);
          max-width: calc(100vw - 24px);
          max-width: calc(100dvw - 24px);
          max-height: min(720px, calc(100dvh - max(34px, calc(34px + env(safe-area-inset-bottom)))));
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: contain;
          touch-action: pan-y;
          box-sizing: border-box;
          margin: 0;
          border: 1px solid rgba(140,255,220,0.18);
          border-radius: 30px 30px 24px 24px;
          background:
            radial-gradient(circle at 16% 0%, rgba(0,255,136,0.16), transparent 34%),
            radial-gradient(circle at 92% 14%, rgba(0,200,255,0.14), transparent 34%),
            rgba(4, 10, 11, 0.97);
          box-shadow: 0 34px 100px rgba(0,0,0,0.58), inset 0 1px 0 rgba(255,255,255,0.08);
          transform: translateX(-50%);
        }

        .mobile-info-sheet * {
          box-sizing: border-box;
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

        .mobile-info-shell[dir="rtl"] {
          text-align: right;
        }

        .mobile-info-shell[dir="rtl"] .mobile-info-header,
        .mobile-info-shell[dir="rtl"] .mobile-info-header-actions,
        .mobile-info-shell[dir="rtl"] .mobile-info-actions,
        .mobile-info-shell[dir="rtl"] .mobile-info-footer nav {
          direction: rtl;
        }

        .mobile-info-shell[dir="rtl"] .mobile-info-card ul {
          padding-left: 0;
          padding-right: 18px;
        }

        .mobile-info-shell[dir="rtl"] .mobile-info-sheet,
        .mobile-info-shell[dir="rtl"] .mobile-info-sheet-links,
        .mobile-info-shell[dir="rtl"] .mobile-info-language-options {
          direction: rtl;
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
