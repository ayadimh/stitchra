import type { Metadata } from 'next';
import { LegalPage, placeholderContact } from '../legal-page';

export const metadata: Metadata = {
  title: 'Privacy Policy | Stitchra',
  description: 'Simple English and German-friendly privacy policy placeholders for Stitchra.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy / Datenschutz"
      title="Privacy Policy"
      description="This page explains, in plain language, what data Stitchra may process. Replace placeholders with the final legal controller and processor details."
      sections={[
        {
          title: 'Controller / Verantwortlicher',
          body: placeholderContact,
        },
        {
          title: 'Data we may collect',
          body: (
            <>
              <p>Contact details you submit, such as name, email address, phone number, quantity, and order notes.</p>
              <p>Uploaded or generated logo files, design prompts, placement choices, shirt color, pricing estimates, and order request details.</p>
              <p>Basic technical data that may be processed by hosting and security systems, such as IP address, browser type, time of access, and error logs.</p>
            </>
          ),
        },
        {
          title: 'Purpose and legal basis',
          body: (
            <>
              <p>We use submitted data to provide previews, estimates, order communication, support, security, and site operation.</p>
              <p>For EU/EEA users, possible legal bases include contract preparation or performance, legitimate interests in operating the service, consent where requested, and legal obligations where applicable.</p>
            </>
          ),
        },
        {
          title: 'Processors and hosting',
          body: (
            <p>
              Stitchra may use hosting, database, email, analytics, or AI processing providers. Add the actual provider names, data processing agreements, regions, and transfer safeguards here before production use.
            </p>
          ),
        },
        {
          title: 'Storage period',
          body: (
            <p>
              We keep personal data only as long as needed for the purposes above, unless a longer legal retention period applies. Replace this placeholder with concrete retention periods when defined.
            </p>
          ),
        },
        {
          title: 'Your rights / Ihre Rechte',
          body: (
            <p>
              Depending on your location, you may request access, correction, deletion, restriction, portability, or objection to processing. You may also have the right to lodge a complaint with a data protection authority.
            </p>
          ),
        },
        {
          title: 'Contact for privacy requests',
          body: (
            <p>
              Please contact [privacy contact email address] for privacy questions or data subject requests.
            </p>
          ),
        },
      ]}
    />
  );
}
