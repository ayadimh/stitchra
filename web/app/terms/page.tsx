import type { Metadata } from 'next';
import { LegalPage } from '../legal-page';

export const metadata: Metadata = {
  title: 'Terms | Stitchra',
  description: 'Simple terms of service placeholders for Stitchra.',
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms / AGB"
      title="Terms of Service"
      description="Plain-language service terms for Stitchra. These are placeholders and should be reviewed by a qualified legal professional before commercial use."
      sections={[
        {
          title: 'Service',
          body: (
            <p>
              Stitchra provides an online embroidery design preview, logo preparation, and quote request experience. Final production, price, delivery time, and availability may require manual confirmation.
            </p>
          ),
        },
        {
          title: 'Orders and quotes',
          body: (
            <p>
              Automated estimates are non-binding until confirmed in writing by the site operator. The operator may reject designs that are technically unsuitable, unlawful, or infringe third-party rights.
            </p>
          ),
        },
        {
          title: 'Customer content',
          body: (
            <p>
              By uploading a logo or entering a prompt, you confirm that you have the necessary rights to use that content for embroidery design and production. Do not upload confidential, unlawful, or infringing material.
            </p>
          ),
        },
        {
          title: 'Payments, shipping, returns',
          body: (
            <p>
              Add final payment methods, taxes, shipping regions, delivery estimates, cancellation rights, return rules, and custom-product exceptions here before accepting paid orders.
            </p>
          ),
        },
        {
          title: 'Warranty and liability',
          body: (
            <p>
              Product colors, stitch appearance, and placement may vary slightly between screen previews and physical embroidery. Liability is limited to the extent permitted by applicable law. Replace this placeholder with final legal wording.
            </p>
          ),
        },
        {
          title: 'Governing law',
          body: (
            <p>
              Add the applicable country law, venue, and mandatory consumer protection notes here.
            </p>
          ),
        },
      ]}
    />
  );
}
