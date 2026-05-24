import type { CSSProperties } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { LegalPage, placeholderContact } from '../legal-page';

export const metadata: Metadata = {
  title: 'Terms of Service | Stitchra',
  description:
    'Terms of Service for Stitchra covering configurator use, quote requests, customer uploads, offers, payments, production, delivery, warranty, and consumer rights.',
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms / AGB"
      title="Terms of Service"
      description="These MVP Terms explain how Stitchra works for configurator use, quote requests, final offers, payments, and customized embroidery production. They are not legal advice and must be reviewed and completed before commercial launch."
      sections={[
        {
          title: 'Last updated',
          body: <p><strong>Last updated:</strong> [insert date]</p>,
        },
        {
          title: 'Operator / Anbieter',
          body: (
            <>
              {placeholderContact}
              <p>
                Final operator details, tax information, registration details, and business contact
                data must be inserted before commercial launch. Do not rely on these placeholders
                as final legal information.
              </p>
            </>
          ),
        },
        {
          title: 'Scope',
          body: (
            <p>
              These Terms apply to the use of the Stitchra website, configurator, quote requests,
              offers, customer approval pages, payments, and orders for customized embroidered
              textile products, including T-shirts and similar goods.
            </p>
          ),
        },
        {
          title: 'Service description',
          body: (
            <>
              <p>
                Stitchra provides an online embroidery platform for design previews, quote workflow,
                customer approvals, and customized embroidery production for T-shirts and textiles.
              </p>
              <p>
                Previews, mockups, 360 views, pricing estimates, and production suggestions are
                visual and technical approximations. They are not a guarantee that the physical
                product will look exactly like the screen preview.
              </p>
            </>
          ),
        },
        {
          title: 'Design configurator and previews',
          body: (
            <>
              <p>
                The Stitchra configurator lets customers choose shirt color, embroidery placement,
                quantity, upload a logo/design, resize or position the design, and view an estimated
                placement preview.
              </p>
              <p>
                The 360 preview and logo placement tools are for visualization. Final embroidery may
                vary because of fabric behavior, thread type, stitch density, machine setup, color
                conversion, hooping, and other technical production limits.
              </p>
              <p>
                Stitchra may adjust placement, sizing, stitch conversion, or production settings
                where reasonably needed for production quality, technical feasibility, or legal
                compliance.
              </p>
            </>
          ),
        },
        {
          title: 'Customer uploads and rights',
          body: (
            <>
              <p>
                By uploading a logo, image, design file, text prompt, or other content, the customer
                confirms that they own the content or have the necessary permission to use it for
                embroidery preview, quoting, production, and related order communication.
              </p>
              <p>
                Uploaded content must not violate copyright, trademark, personality rights,
                privacy rights, or other third-party rights. It must not be illegal, hateful,
                discriminatory, pornographic, counterfeit, misleading, or otherwise unacceptable.
              </p>
              <p>
                The customer is responsible for consequences of unauthorized uploads. Stitchra may
                reject, remove, or decline designs that create legal, ethical, technical, brand, or
                production risks.
              </p>
            </>
          ),
        },
        {
          title: 'Quote request and contract formation',
          body: (
            <>
              <p>
                Submitting a configurator request is not automatically a binding purchase contract.
                Stitchra first reviews the request, uploaded file, stitch complexity, production
                feasibility, quantity, and final price.
              </p>
              <p>
                A binding contract is formed only when Stitchra sends a final offer and the customer
                accepts it, or when the customer completes payment/checkout according to the final
                offer flow. Stitchra may decline requests before contract formation.
              </p>
              <p>
                If the customer requests changes, the existing offer may be updated, withdrawn, or
                replaced with a new offer.
              </p>
            </>
          ),
        },
        {
          title: 'Prices, taxes and shipping',
          body: (
            <>
              <p>
                Prices shown in the configurator may be preliminary estimates. The final customer
                price is shown in the final offer or checkout flow before payment.
              </p>
              <p>
                Shipping costs, taxes, discounts, and any extra charges should be shown where
                applicable before payment. Final tax setup, shipping regions, and business-specific
                invoice details must be completed before commercial launch.
              </p>
              <p>
                Obvious pricing errors may be corrected before contract formation. If a final offer
                contains an obvious error, Stitchra may correct it and issue an updated offer.
              </p>
            </>
          ),
        },
        {
          title: 'Payment',
          body: (
            <>
              <p>
                Payments may be processed through Stripe or another payment method offered during
                checkout. Customers must use the payment methods made available for the specific
                order.
              </p>
              <p>
                Production may start only after payment is confirmed unless Stitchra explicitly
                agrees otherwise. Stitchra should not store full card details; card processing is
                handled by the payment provider.
              </p>
            </>
          ),
        },
        {
          title: 'Production',
          body: (
            <>
              <p>
                Production starts after final approval and payment, unless Stitchra explicitly
                agrees to a different workflow. Production time depends on quantity, design
                complexity, stitch count, material availability, and studio workload.
              </p>
              <p>
                Stitchra may contact the customer if technical changes are needed. Production may be
                paused or stopped internally for technical, legal, quality, payment, safety, or
                operational reasons.
              </p>
              <p>
                Internal costs, internal production notes, and studio workflow details are not part
                of the public customer-facing offer unless expressly communicated.
              </p>
            </>
          ),
        },
        {
          title: 'Customer changes',
          body: (
            <>
              <p>
                Customers may request changes before final approval and before production starts.
                Stitchra may accept, decline, or counter with an updated offer.
              </p>
              <p>
                After final approval or production start, changes may be impossible or may create
                additional cost, production delay, or a new quote. Logo or design replacements may
                require a new review and final offer.
              </p>
            </>
          ),
        },
        {
          title: 'Cancellation and withdrawal / Widerruf',
          body: (
            <>
              <p>
                Consumers may have statutory withdrawal rights for distance contracts where
                applicable. For products manufactured according to customer specifications or clearly
                personalized products, the right of withdrawal may be excluded under applicable law
                once the personalized product is ordered, approved, or production starts.
              </p>
              <p>
                Stitchra will provide the applicable withdrawal information
                (Widerrufsbelehrung) before or during checkout where required. This section is an
                MVP placeholder and must be reviewed before paid consumer orders are accepted.
              </p>
              <p>
                This does not affect statutory rights for defective products.
              </p>
            </>
          ),
        },
        {
          title: 'Personalized products',
          body: (
            <p>
              Embroidered products with customer-specific logos, placements, names, files, prompts,
              or designs are personalized/customized goods. They may be difficult or impossible to
              resell and may be subject to special cancellation and withdrawal rules.
            </p>
          ),
        },
        {
          title: 'Delivery and shipping',
          body: (
            <>
              <p>
                Delivery estimates are non-binding unless expressly confirmed. The customer must
                provide correct delivery and contact details. Delays may occur because of material
                availability, production workload, payment checks, design changes, or carrier issues.
              </p>
              <p>
                Risk transfer and consumer delivery rights remain governed by applicable law.
                Shipping areas, carriers, delivery pricing, and final delivery terms must be added
                when finalized.
              </p>
            </>
          ),
        },
        {
          title: 'Defects and statutory warranty / gesetzliche Gewaehrleistung',
          body: (
            <>
              <p>
                Statutory warranty rights apply where required by law. Nothing in these Terms is
                intended to remove mandatory consumer rights.
              </p>
              <p>
                Slight deviations in color, thread appearance, stitch texture, placement, sizing, and
                preview-to-product appearance may occur in embroidery production and do not
                automatically constitute a defect if they are within normal production tolerance.
              </p>
              <p>
                Customers should report visible defects promptly with photos, order details, and a
                short description so Stitchra can review the issue.
              </p>
            </>
          ),
        },
        {
          title: 'Intellectual property',
          body: (
            <>
              <p>
                The Stitchra website, brand, user interface, previews, generated mockups, internal
                tools, copy, and visual presentation remain the property of Stitchra or the relevant
                rights holder.
              </p>
              <p>
                Customers keep their rights to uploaded logos and designs. By uploading content, the
                customer grants Stitchra a limited right to process, reproduce, adapt technically,
                display, and use the content for preview, quote, production, payment, delivery, and
                order communication.
              </p>
              <p>
                Stitchra may not use customer designs for marketing, portfolio, or public promotion
                without permission unless separately agreed.
              </p>
            </>
          ),
        },
        {
          title: 'Prohibited use',
          body: (
            <ul>
              <li>No illegal, infringing, counterfeit, or unauthorized brand content.</li>
              <li>No hate symbols, discriminatory content, extremist content, or harmful material.</li>
              <li>No pornographic, abusive, defamatory, or privacy-violating content.</li>
              <li>No attempts to disrupt, scrape, overload, reverse engineer, or misuse the platform.</li>
              <li>No uploads that create unreasonable technical, safety, legal, or production risks.</li>
            </ul>
          ),
        },
        {
          title: 'Liability',
          body: (
            <>
              <p>
                Liability is governed by applicable law. Nothing in these Terms limits liability for
                death or personal injury, intent, gross negligence, fraud, mandatory product
                liability, or other liability that cannot legally be limited.
              </p>
              <p>
                For simple negligence, Stitchra may be liable only according to the applicable legal
                limits and the final lawyer-reviewed wording. This section is a placeholder for final
                legal review and should not be treated as complete liability wording.
              </p>
            </>
          ),
        },
        {
          title: 'Data protection',
          body: (
            <p>
              Data processing is explained in the{' '}
              <Link href="/privacy" style={linkStyle}>
                Privacy Policy
              </Link>
              . This includes information about configurator uploads, quote requests, emails,
              payments, hosting, analytics, storage, and service providers.
            </p>
          ),
        },
        {
          title: 'Governing law and consumer protection',
          body: (
            <p>
              These Terms are governed by the law applicable to the operator, subject to mandatory
              consumer protection rules of the customer country of residence where applicable.
              Final law, venue, and business-specific dispute wording must be inserted after legal
              review. No EU ODR platform link is included because the EU ODR platform has been
              discontinued.
            </p>
          ),
        },
        {
          title: 'Contact',
          body: (
            <p>
              For questions about orders, quotes, or these Terms, contact{' '}
              <a href="mailto:orders@stitchra.com" style={linkStyle}>
                orders@stitchra.com
              </a>{' '}
              for now, or replace this with the final business contact before launch.
            </p>
          ),
        },
      ]}
    />
  );
}

const linkStyle: CSSProperties = {
  color: '#9dffc4',
  fontWeight: 800,
};
