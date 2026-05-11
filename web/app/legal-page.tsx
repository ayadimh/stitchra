import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';

const SITE_URL = 'https://stitchra.com';

export type LegalSection = {
  title: string;
  body: ReactNode;
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: LegalSection[];
};

export function LegalPage({
  eyebrow,
  title,
  description,
  sections,
}: LegalPageProps) {
  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <a href={SITE_URL} style={brandLink}>
          <Image
            src="/stitchra-mark.svg"
            alt=""
            width={40}
            height={40}
          />
          <span>Stitchra</span>
        </a>
        <nav style={navStyle} aria-label="Trust pages">
          {trustLinks.map((link) => (
            <a key={link.href} href={link.href} style={navLink}>
              {link.label}
            </a>
          ))}
        </nav>
      </header>

      <section style={heroStyle}>
        <p style={eyebrowStyle}>{eyebrow}</p>
        <h1 style={titleStyle}>{title}</h1>
        <p style={descriptionStyle}>{description}</p>
        <p style={noticeStyle}>
          Legal owner details are placeholders until the site operator adds the
          correct company or individual information. This page is not legal
          advice.
        </p>
      </section>

      <section style={contentStyle}>
        {sections.map((section) => (
          <article key={section.title} style={cardStyle}>
            <h2 style={sectionTitleStyle}>{section.title}</h2>
            <div style={bodyStyle}>{section.body}</div>
          </article>
        ))}
      </section>

      <footer style={footerStyle}>
        <span>© 2026 Stitchra</span>
        <a href={`${SITE_URL}/privacy`} style={footerLink}>Privacy</a>
        <a href={`${SITE_URL}/terms`} style={footerLink}>Terms</a>
        <a href={`${SITE_URL}/contact`} style={footerLink}>Contact</a>
        <a href={`${SITE_URL}/impressum`} style={footerLink}>Impressum</a>
      </footer>
    </main>
  );
}

export const placeholderContact = (
  <>
    <p><strong>Site / service name:</strong> Stitchra</p>
    <p><strong>Owner / Betreiber:</strong> [Owner or legal company name]</p>
    <p><strong>Address / Anschrift:</strong> [Street, postal code, city, country]</p>
    <p><strong>Email:</strong> [contact email address]</p>
    <p><strong>Phone:</strong> [optional phone number]</p>
    <p><strong>VAT ID / USt-IdNr.:</strong> [if applicable]</p>
  </>
);

export const trustLinks = [
  { label: 'Home', href: SITE_URL },
  { label: 'Impressum', href: `${SITE_URL}/impressum` },
  { label: 'Privacy', href: `${SITE_URL}/privacy` },
  { label: 'Contact', href: `${SITE_URL}/contact` },
  { label: 'Terms', href: `${SITE_URL}/terms` },
] as const;

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  color: '#f5f7f8',
  background:
    'radial-gradient(circle at 10% 10%, rgba(0,255,136,0.14), transparent 28%), radial-gradient(circle at 90% 0%, rgba(0,200,255,0.12), transparent 30%), #050607',
  padding: '28px 20px 56px',
};

const headerStyle: CSSProperties = {
  maxWidth: 1040,
  margin: '0 auto 48px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 20,
  flexWrap: 'wrap',
};

const brandLink: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 12,
  color: '#f5f7f8',
  fontWeight: 900,
  textDecoration: 'none',
};

const navStyle: CSSProperties = {
  display: 'flex',
  gap: 14,
  flexWrap: 'wrap',
};

const navLink: CSSProperties = {
  color: 'rgba(245,247,248,0.74)',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 700,
};

const heroStyle: CSSProperties = {
  maxWidth: 1040,
  margin: '0 auto 26px',
  padding: '42px clamp(22px, 5vw, 56px)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 28,
  background: 'rgba(255,255,255,0.055)',
  boxShadow: '0 28px 90px rgba(0,0,0,0.28)',
};

const eyebrowStyle: CSSProperties = {
  marginBottom: 12,
  color: '#00ff88',
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
};

const titleStyle: CSSProperties = {
  marginBottom: 16,
  fontSize: 'clamp(36px, 7vw, 72px)',
  lineHeight: 0.95,
  letterSpacing: '-0.07em',
};

const descriptionStyle: CSSProperties = {
  maxWidth: 760,
  color: 'rgba(245,247,248,0.76)',
  fontSize: 18,
  lineHeight: 1.7,
};

const noticeStyle: CSSProperties = {
  maxWidth: 760,
  marginTop: 18,
  padding: 16,
  border: '1px solid rgba(0,255,136,0.20)',
  borderRadius: 18,
  color: 'rgba(245,247,248,0.74)',
  background: 'rgba(0,255,136,0.06)',
  lineHeight: 1.6,
};

const contentStyle: CSSProperties = {
  maxWidth: 1040,
  margin: '0 auto',
  display: 'grid',
  gap: 18,
};

const cardStyle: CSSProperties = {
  padding: '28px clamp(20px, 4vw, 38px)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 24,
  background: 'rgba(255,255,255,0.045)',
};

const sectionTitleStyle: CSSProperties = {
  marginBottom: 12,
  fontSize: 24,
};

const bodyStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  color: 'rgba(245,247,248,0.78)',
  fontSize: 16,
  lineHeight: 1.75,
};

const footerStyle: CSSProperties = {
  maxWidth: 1040,
  margin: '34px auto 0',
  display: 'flex',
  gap: 16,
  flexWrap: 'wrap',
  color: 'rgba(245,247,248,0.62)',
  fontSize: 14,
};

const footerLink: CSSProperties = {
  color: 'rgba(245,247,248,0.72)',
  textDecoration: 'none',
};
