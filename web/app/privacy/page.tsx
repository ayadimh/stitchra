import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { LegalPage, placeholderContact } from '../legal-page';

export const metadata: Metadata = {
  title: 'Privacy Policy | Stitchra',
  description:
    'Privacy policy for Stitchra covering website use, configurator uploads, quotes, emails, payments, analytics, and service providers.',
};

const placeholderPrivacyContact = 'orders@stitchra.com / [privacy contact email]';

const processorRows = [
  {
    provider: 'Vercel',
    purpose: 'Website hosting, deployment, technical logs, and Vercel Web Analytics where enabled.',
    data: 'Technical access data, page views, device/browser data, error and security logs.',
    note: 'Processing depends on the deployed configuration and Vercel provider terms or agreements where applicable.',
  },
  {
    provider: 'Supabase',
    purpose: 'Database and storage for order workflow data and uploaded design references.',
    data: 'Customer details, order requests, quote status, uploaded design references, internal workflow status.',
    note: 'Use and region depend on the active Supabase project configuration and applicable provider terms.',
  },
  {
    provider: 'Resend',
    purpose: 'Transactional emails, such as quote links, order status messages, and customer support replies.',
    data: 'Recipient email address, message content, delivery metadata, and related email logs.',
    note: 'Applies when transactional email sending is configured and activated.',
  },
  {
    provider: 'Stripe',
    purpose: 'Payment checkout and payment status handling.',
    data: 'Payment session ID, payment status, limited transaction metadata, order reference, customer contact data where needed.',
    note: 'Card details are handled by Stripe. Stitchra should not receive full card numbers.',
  },
  {
    provider: '[AI/image processing provider, if used]',
    purpose: 'Logo analysis, design preparation, mockup generation, or production-effort estimation.',
    data: 'Uploaded logo/design files, prompts, placement settings, and generated/processed preview data.',
    note: 'Only applies if such provider processing is activated. Add the real provider and agreement details before production use.',
  },
];

function ProcessorTable() {
  return (
    <div style={tableWrapStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Provider</th>
            <th style={thStyle}>Purpose</th>
            <th style={thStyle}>Data types</th>
            <th style={thStyle}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {processorRows.map((row) => (
            <tr key={row.provider}>
              <td style={tdStyle}>
                <strong>{row.provider}</strong>
              </td>
              <td style={tdStyle}>{row.purpose}</td>
              <td style={tdStyle}>{row.data}</td>
              <td style={tdStyle}>{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy / Datenschutz"
      title="Privacy Policy"
      description="This MVP privacy policy explains how Stitchra may process personal data for the website, T-shirt configurator, quote workflow, emails, payments, and service security. It is not legal advice and must be completed with final operator details before production/legal launch."
      sections={[
        {
          title: 'Last updated',
          body: <p><strong>Last updated:</strong> [insert date]</p>,
        },
        {
          title: 'Controller / Verantwortlicher',
          body: (
            <>
              {placeholderContact}
              <p>
                The final operator details above must be inserted before production/legal launch.
                Until then, this privacy policy is an MVP draft for the Stitchra service.
              </p>
              <p>
                Privacy contact for now: <strong>{placeholderPrivacyContact}</strong>. A dedicated privacy
                address can replace this later.
              </p>
            </>
          ),
        },
        {
          title: 'Short overview',
          body: (
            <>
              <p>
                Stitchra processes data to operate the website, provide the T-shirt configurator,
                handle uploaded logos and design settings, prepare embroidery offers, communicate
                with customers, process payments, and protect the service.
              </p>
              <p>
                We aim to keep public customer pages separate from internal studio information.
                Internal cost calculations, profit, margin, production notes, and private workflow
                details are intended for the Studio only and should not be shown on public pages.
              </p>
            </>
          ),
        },
        {
          title: 'Website hosting and technical logs',
          body: (
            <>
              <p>
                Stitchra may be hosted on Vercel. Hosting and security systems may process technical
                access data such as IP address, date and time of access, requested pages, referrer,
                browser and device information, error logs, and security logs.
              </p>
              <p>
                The legal basis is our legitimate interest (berechtigtes Interesse) in providing a
                secure, stable, and reliable website.
              </p>
            </>
          ),
        },
        {
          title: 'Vercel Web Analytics',
          body: (
            <>
              <p>
                Stitchra may use Vercel Web Analytics to understand public website page views and
                basic usage patterns. This analytics setup is intended for public website traffic
                only and should not use third-party cookies.
              </p>
              <p>
                Private Studio pages, API endpoints, order-token pages, and payment-token pages
                should be excluded where technically configured. The legal basis is legitimate
                interest in improving the public website experience.
              </p>
            </>
          ),
        },
        {
          title: 'Configurator and logo upload',
          body: (
            <>
              <p>
                When you use the configurator, you may upload logo or design files and choose
                embroidery placement, shirt color, logo size, quantity, and other design settings.
                These files and settings are processed to create previews, prepare quotes, and
                process order requests.
              </p>
              <p>
                Please only upload logos, images, and other content that you are allowed to use for
                embroidery design and production. Do not upload unlawful, infringing, confidential,
                or sensitive content.
              </p>
            </>
          ),
        },
        {
          title: 'Order requests and quote workflow',
          body: (
            <>
              <p>
                If you request a quote or order, Stitchra may process your name, email address,
                optional phone number, quantity, customer notes, uploaded design, pricing estimate,
                offer status, customer responses, and workflow status.
              </p>
              <p>
                The legal basis may be contract preparation or contract performance
                (Vertragsanbahnung / Vertragserfüllung) and legitimate interest in managing quote
                and order workflows.
              </p>
            </>
          ),
        },
        {
          title: 'Email communication',
          body: (
            <>
              <p>
                Stitchra may use Resend as a transactional email provider when email sending is
                configured. Emails may include secure quote links, order status messages, support
                replies, and operational notifications.
              </p>
              <p>
                Email processing may include your email address, message content, delivery metadata,
                and related technical logs. The legal basis may be contract preparation,
                contract performance, and legitimate interest in customer communication.
              </p>
            </>
          ),
        },
        {
          title: 'Payments',
          body: (
            <>
              <p>
                Stitchra may use Stripe for payment checkout when payments are activated. Payment
                processing is handled by Stripe. Stitchra may receive payment status, payment
                session ID, payment provider information, timestamps, and limited transaction
                metadata linked to your order.
              </p>
              <p>
                Stitchra should not receive full card details. The legal basis may be contract
                performance and legal obligations, for example accounting and tax retention duties.
              </p>
            </>
          ),
        },
        {
          title: 'Database and storage',
          body: (
            <>
              <p>
                Stitchra may use Supabase for database and storage systems. Order data, uploaded
                design references, customer details, public-token workflow status, and internal
                studio status data may be stored there.
              </p>
              <p>
                Internal business data such as cost breakdowns, internal cost, profit, margin,
                labor, studio payback, production notes, and private workflow notes are intended
                for internal Studio use only and should not be exposed publicly.
              </p>
            </>
          ),
        },
        {
          title: 'AI and image processing',
          body: (
            <>
              <p>
                If Stitchra uses AI or automated image processing, uploaded files, design prompts,
                placement settings, or generated previews may be processed to analyze logo
                complexity, generate or improve mockups, clean up design assets, or estimate
                production effort.
              </p>
              <p>
                Add the real provider name, processing region, retention settings, and agreement
                details here before production use: <strong>[AI/image processing provider, if used]</strong>.
              </p>
            </>
          ),
        },
        {
          title: 'Processors / service providers',
          body: (
            <>
              <p>
                Stitchra may use processors (Auftragsverarbeiter) and service providers for hosting,
                storage, email, analytics, payments, and optional image processing. The actual use
                depends on the active configuration and provider agreements or data processing
                agreements (DPA / Auftragsverarbeitungsvertrag) where applicable.
              </p>
              <ProcessorTable />
            </>
          ),
        },
        {
          title: 'International transfers',
          body: (
            <p>
              Some providers may process data outside the EU/EEA. Where required, appropriate
              safeguards may be used, such as Standard Contractual Clauses or provider transfer
              mechanisms. Final transfer details depend on the selected provider settings and
              agreements.
            </p>
          ),
        },
        {
          title: 'Storage periods',
          body: (
            <ul>
              <li>Technical logs: as needed for security and operation, depending on provider settings.</li>
              <li>Order inquiries and quotes: as long as needed to handle the inquiry and reasonable follow-up.</li>
              <li>Uploaded logos/designs: as long as needed for quote, order, or production, or until a valid deletion request, unless retention is required.</li>
              <li>Payment and accounting records: according to applicable legal retention obligations.</li>
              <li>Support emails: as long as needed for communication, documentation, and dispute handling.</li>
            </ul>
          ),
        },
        {
          title: 'Your rights / Ihre Rechte',
          body: (
            <>
              <p>
                Depending on applicable law, you may have the right to request access
                (Auskunft), rectification (Berichtigung), erasure (Löschung), restriction
                (Einschränkung), data portability (Datenübertragbarkeit), and objection
                (Widerspruch). Where processing is based on consent, you may withdraw consent
                with effect for the future.
              </p>
              <p>
                You may also contact a competent data protection supervisory authority, for example
                the Bayerisches Landesamt für Datenschutzaufsicht (BayLDA) if applicable.
              </p>
            </>
          ),
        },
        {
          title: 'Security',
          body: (
            <p>
              Stitchra uses practical security measures such as access controls, secure hosting
              configurations, encryption in transit where available, limited team access, and
              separation between public customer data and internal Studio pricing/production data.
              No system can be guaranteed completely secure, so these measures should be reviewed
              regularly as the platform grows.
            </p>
          ),
        },
        {
          title: 'Contact',
          body: (
            <p>
              For privacy questions or data subject requests, contact{' '}
              <a href="mailto:orders@stitchra.com" style={linkStyle}>
                orders@stitchra.com
              </a>{' '}
              for now, or replace it with <strong>[privacy contact email]</strong> before final
              legal launch.
            </p>
          ),
        },
      ]}
    />
  );
}

const tableWrapStyle: CSSProperties = {
  overflowX: 'auto',
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.10)',
};

const tableStyle: CSSProperties = {
  width: '100%',
  minWidth: 760,
  borderCollapse: 'collapse',
  background: 'rgba(255,255,255,0.035)',
};

const thStyle: CSSProperties = {
  padding: '14px 16px',
  textAlign: 'left',
  verticalAlign: 'top',
  color: '#f5f7f8',
  borderBottom: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(0,255,136,0.07)',
};

const tdStyle: CSSProperties = {
  padding: '14px 16px',
  verticalAlign: 'top',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
};

const linkStyle: CSSProperties = {
  color: '#9dffc4',
  fontWeight: 800,
};
