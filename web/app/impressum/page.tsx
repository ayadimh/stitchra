import type { Metadata } from 'next';
import { LegalPage, placeholderContact } from '../legal-page';

export const metadata: Metadata = {
  title: 'Impressum | Stitchra',
  description: 'Legal notice and German-friendly provider information placeholders for Stitchra.',
};

export default function ImpressumPage() {
  return (
    <LegalPage
      eyebrow="Legal notice / Impressum"
      title="Impressum"
      description="Provider information for Stitchra. Missing legal owner details are shown as placeholders and must be replaced by the site operator."
      sections={[
        {
          title: 'Information according to § 5 TMG / Anbieterkennzeichnung',
          body: placeholderContact,
        },
        {
          title: 'Responsible for content / Verantwortlich für Inhalte',
          body: (
            <>
              <p>[Name of responsible person]</p>
              <p>[Address of responsible person]</p>
            </>
          ),
        },
        {
          title: 'Dispute resolution / Streitbeilegung',
          body: (
            <p>
              We are not obliged and not willing to participate in dispute
              resolution proceedings before a consumer arbitration board unless
              legally required. Please replace this placeholder if a different
              legal statement applies.
            </p>
          ),
        },
        {
          title: 'Liability notice / Haftungshinweis',
          body: (
            <p>
              We try to keep information accurate, but we cannot guarantee that
              all content is complete, current, or error-free. External links are
              provided for convenience; the respective providers are responsible
              for their own content.
            </p>
          ),
        },
      ]}
    />
  );
}
