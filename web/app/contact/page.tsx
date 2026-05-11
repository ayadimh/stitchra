import type { Metadata } from 'next';
import { LegalPage, placeholderContact } from '../legal-page';

export const metadata: Metadata = {
  title: 'Contact | Stitchra',
  description: 'Contact information placeholders for Stitchra.',
};

export default function ContactPage() {
  return (
    <LegalPage
      eyebrow="Contact / Kontakt"
      title="Contact"
      description="Use these details to contact the Stitchra site operator. Replace the placeholders with the correct legal and support contacts."
      sections={[
        {
          title: 'Contact details',
          body: placeholderContact,
        },
        {
          title: 'Support',
          body: (
            <p>
              For order, logo, quote, or technical questions, email [support email address]. Please include your order reference if you have one.
            </p>
          ),
        },
        {
          title: 'Privacy requests',
          body: (
            <p>
              For data protection requests, email [privacy contact email address].
            </p>
          ),
        },
      ]}
    />
  );
}
