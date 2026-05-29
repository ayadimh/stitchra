import ar from '@/messages/ar.json';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import es from '@/messages/es.json';
import fr from '@/messages/fr.json';
import ru from '@/messages/ru.json';

export const locales = ['en', 'de', 'fr', 'ar', 'es', 'ru'] as const;
export type Locale = (typeof locales)[number];
export type Translator = (key: string) => string;

export const defaultLocale: Locale = 'en';

export const localeLabels: Record<
  Locale,
  { code: string; name: string }
> = {
  en: { code: 'EN', name: 'English' },
  de: { code: 'DE', name: 'Deutsch' },
  fr: { code: 'FR', name: 'Français' },
  ar: { code: 'AR', name: 'العربية' },
  es: { code: 'ES', name: 'Español' },
  ru: { code: 'RU', name: 'Русский' },
};

const dictionaries: Record<Locale, unknown> = {
  en,
  de,
  fr,
  ar,
  es,
  ru,
};

function getValue(source: unknown, path: string) {
  return path.split('.').reduce<unknown>((current, key) => {
    if (
      current &&
      typeof current === 'object' &&
      key in current
    ) {
      return (current as Record<string, unknown>)[key];
    }

    return undefined;
  }, source);
}

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function resolveLocale(value?: string | null): Locale {
  return value && isLocale(value) ? value : defaultLocale;
}

export function getLocaleDirection(locale: Locale) {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function createTranslator(locale: Locale): Translator {
  const dictionary = dictionaries[locale] ?? dictionaries[defaultLocale];
  const fallback = dictionaries[defaultLocale];

  return (key: string) => {
    const value = getValue(dictionary, key) ?? getValue(fallback, key);

    return typeof value === 'string' ? value : key;
  };
}

export function getLocalizedArray<T>(
  locale: Locale,
  key: string
): T[] {
  const dictionary = dictionaries[locale] ?? dictionaries[defaultLocale];
  const fallback = dictionaries[defaultLocale];
  const value = getValue(dictionary, key) ?? getValue(fallback, key);

  return Array.isArray(value) ? (value as T[]) : [];
}

export function getLocalizedMetadata(locale: Locale) {
  const t = createTranslator(locale);

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  de: '🇩🇪',
  fr: '🇫🇷',
  ar: '🇸🇦',
  es: '🇪🇸',
  ru: '🇷🇺',
};

export type PublicRouteKey =
  | 'design'
  | 'explore'
  | 'how'
  | 'features'
  | 'pricing'
  | 'gallery'
  | 'faq'
  | 'contact';

export type MobileInfoPageKey =
  | 'explore'
  | 'how'
  | 'features'
  | 'pricing'
  | 'gallery'
  | 'faq'
  | 'contact';

export type MobileInfoCard = {
  title: string;
  text: string;
  href?: string;
  cta?: string;
  bullets?: string[];
};

export type MobileInfoPageCopy = {
  eyebrow: string;
  title: string;
  description: string;
  cards: MobileInfoCard[];
  metadata: {
    title: string;
    description: string;
  };
};

export type PublicI18nCopy = {
  common: {
    startDesigning: string;
    explore: string;
    menu: string;
    close: string;
    cancel: string;
    chooseLanguage: string;
    language: string;
    continue: string;
    startFresh: string;
    back: string;
    resetView: string;
    keepEditing: string;
    uploadLogo: string;
    createWithAi: string;
    generateConcept: string;
    useThisDesign: string;
    getClearPrice: string;
    requestOrder: string;
    contactSupport: string;
    designOnShirt: string;
    downloadPreview: string;
    shareDesign: string;
    aiConcept: string;
    fabricPreview: string;
    clearQuote: string;
  };
  mobileHome: {
    productLabel: string;
    value: string;
    heroTitle: string;
    heroSubtitle: string;
    primaryCta: string;
    secondaryCta: string;
    productionProof: string;
    trustChips: string[];
    miniCardTitle: string;
    miniCardPrice: string;
    savedDraft: string;
    continueDraft: string;
    draftText: string;
    exploreEyebrow: string;
    exploreTitle: string;
    exploreText: string;
    exploreSections: Array<{
      id: string;
      title: string;
      summary: string;
      bullets: string[];
    }>;
  };
  designWizard: {
    stepWord: string;
    ofWord: string;
    steps: Record<
      'choose' | 'create' | 'review' | 'place' | 'price' | 'request',
      { label: string; help: string }
    >;
    choice: {
      uploadTitle: string;
      uploadSubtitle: string;
      uploadCta: string;
      aiTitle: string;
      aiSubtitle: string;
      aiCta: string;
    };
    upload: {
      eyebrow: string;
      title: string;
      subtitle: string;
      chooseLogo: string;
      fileHint: string;
      maxSize: string;
      ready: string;
      viewOnShirt: string;
      removeBackground: string;
      cleaning: string;
    };
    ai: {
      eyebrow: string;
      title: string;
      subtitle: string;
      placeholder: string;
      generating: string;
      intent: string;
      directionPrefix: string;
      chooseDirection: string;
      previewNote: string;
      reviewNote: string;
      providerCredit: string;
      privateDataNote: string;
      uploadInstead: string;
      styleHints: Record<string, string>;
    };
    review: {
      uploadedEyebrow: string;
      uploadedTitle: string;
      uploadedText: string;
      addFirstTitle: string;
      addFirstText: string;
      continueToReview: string;
    };
    place: {
      emptyTitle: string;
      emptyText: string;
      guidanceWithLogo: string;
      guidanceEmpty: string;
      placementEyebrow: string;
      placementTitle: string;
      placementText: string;
      preset: string;
      custom: string;
      customHint: string;
      garment: string;
      chooseShirtColor: string;
      blackTee: string;
      whiteTee: string;
      size: string;
      sizeHelp: string;
      small: string;
      medium: string;
      large: string;
      studioReview: string;
      continueToPrice: string;
    };
    price: {
      eyebrow: string;
      title: string;
      text: string;
      preparingLogo: string;
      preparingQuote: string;
      addDesignFirst: string;
      stitches: string;
      colors: string;
      coverage: string;
      price: string;
      studioReviewRecommended: string;
      clearStartingPrice: string;
      studioReviewText: string;
      estimateText: string;
      finalOffer: string;
      continueToRequest: string;
    };
    request: {
      sent: string;
      successTitle: string;
      confirmationEmail: string;
      steps: string[];
      backToDesign: string;
      startNewDesign: string;
      summary: string;
      yourName: string;
      email: string;
      phone: string;
      quantity: string;
      note: string;
      sending: string;
      sendRequest: string;
      openOrderForm: string;
    };
  };
  footer: {
    tagline: string;
    how: string;
    features: string;
    pricing: string;
    faq: string;
    impressum: string;
    privacy: string;
    contact: string;
    terms: string;
  };
  menu: {
    title: string;
    ariaOpen: string;
    ariaClose: string;
    ariaCloseLanguage: string;
  };
};

const routeMap: Record<PublicRouteKey, string> = {
  design: '/design',
  explore: '/explore',
  how: '/how-it-works',
  features: '/features',
  pricing: '/pricing',
  gallery: '/gallery',
  faq: '/faq',
  contact: '/contact',
};

function normalizedPath(path: string) {
  if (!path || path === '/') {
    return '/';
  }

  return path.startsWith('/') ? path : `/${path}`;
}

export function localizedPath(locale: Locale, path: string) {
  const normalized = normalizedPath(path);

  if (locale === defaultLocale) {
    return normalized;
  }

  return normalized === '/' ? `/${locale}` : `/${locale}${normalized}`;
}

export function getRoutePath(route: PublicRouteKey) {
  return routeMap[route];
}

export function getPathLocale(pathname: string): Locale {
  const firstSegment = pathname.split('/').filter(Boolean)[0];

  return firstSegment && isLocale(firstSegment) ? firstSegment : defaultLocale;
}

export function stripLocaleFromPath(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const rest =
    segments[0] && isLocale(segments[0])
      ? segments.slice(1)
      : segments;

  return rest.length ? `/${rest.join('/')}` : '/';
}

export function switchLocalePath(pathname: string, nextLocale: Locale) {
  return localizedPath(nextLocale, stripLocaleFromPath(pathname));
}

const publicCopies: Record<Locale, PublicI18nCopy> = {
  en: {
    common: {
      startDesigning: 'Start Designing',
      explore: 'Explore',
      menu: 'Menu',
      close: 'Close',
      cancel: 'Cancel',
      chooseLanguage: 'Choose language',
      language: 'Language',
      continue: 'Continue',
      startFresh: 'Start fresh',
      back: 'Back',
      resetView: 'Reset view',
      keepEditing: 'Keep editing',
      uploadLogo: 'Upload logo',
      createWithAi: 'Create with AI',
      generateConcept: 'Generate concept',
      useThisDesign: 'Use this design',
      getClearPrice: 'Get clear price',
      requestOrder: 'Request order',
      contactSupport: 'Contact support',
      designOnShirt: 'Design is on your T-shirt',
      downloadPreview: 'Download preview',
      shareDesign: 'Share design',
      aiConcept: 'AI concept',
      fabricPreview: 'Fabric preview',
      clearQuote: 'Clear quote',
    },
    mobileHome: {
      productLabel: 'AI Embroidery Studio',
      value:
        'Create a logo idea, preview it on fabric, and get a clear embroidery quote.',
      heroTitle: 'See your logo stitched on a T-shirt.',
      heroSubtitle:
        'Upload a logo or create one with AI, preview it on fabric, and get a clear quote before production.',
      primaryCta: 'Create my T-shirt preview',
      secondaryCta: 'Explore examples',
      productionProof: 'Studio review before production',
      trustChips: ['AI logo concept', 'T-shirt preview', 'Clear quote'],
      miniCardTitle: 'Logo on shirt',
      miniCardPrice: 'From €9',
      savedDraft: 'Saved draft',
      continueDraft: 'Continue your last design',
      draftText: 'We found a recent design draft on this device.',
      exploreEyebrow: 'Explore Stitchra',
      exploreTitle: 'A compact guide before you design.',
      exploreText:
        'The full desktop story is still available on larger screens. On mobile, start quickly and open only the details you need.',
      exploreSections: [
        {
          id: 'mobile-explore-how',
          title: 'How It Works',
          summary:
            'Create or upload, review the concept, place it on fabric, get a quote, then request your order.',
          bullets: [
            'Create with AI or upload a logo',
            'Review the artwork clearly',
            'Place it on the shirt and check price',
          ],
        },
        {
          id: 'mobile-explore-craft',
          title: 'Craft quality',
          summary:
            'Stitchra keeps the preview practical for embroidery: clean shapes, readable size and studio review when needed.',
          bullets: ['Fabric-aware preview', 'Background cleanup', 'Studio quality check'],
        },
        {
          id: 'mobile-explore-pricing',
          title: 'Pricing',
          summary:
            'Small simple left-chest logos can start around €9. Larger front designs can start around €13.',
          bullets: [
            'Final offer before production',
            'Studio review for complex artwork',
            'Customer-facing quote only',
          ],
        },
        {
          id: 'mobile-explore-gallery',
          title: 'Gallery',
          summary:
            'Browse compact examples for clubs, creators, events and small brands without scrolling through the full desktop page.',
          bullets: ['Badges', 'Brand marks', 'Event shirts'],
        },
        {
          id: 'mobile-explore-features',
          title: 'Features',
          summary:
            'AI concept generation, logo cleanup, placement preview and quote request are combined in one mobile studio flow.',
          bullets: ['AI Concept Studio', 'Upload your own design', 'Draft recovery after refresh'],
        },
        {
          id: 'mobile-explore-faq',
          title: 'FAQ',
          summary:
            'You can order one shirt, upload your own file, or create an original AI concept before requesting a quote.',
          bullets: [
            'Payment happens after final offer',
            'Use only designs you have rights to',
            'Support: orders@stitchra.com',
          ],
        },
      ],
    },
    designWizard: {
      stepWord: 'Step',
      ofWord: 'of',
      steps: {
        choose: {
          label: 'Choose',
          help: 'Choose whether to upload your logo or create a new concept with AI.',
        },
        create: {
          label: 'Create / Upload',
          help: 'Add your artwork first. Upload a file or describe an original idea.',
        },
        review: {
          label: 'Review',
          help: 'Inspect the artwork clearly before placing it on the shirt.',
        },
        place: {
          label: 'Place',
          help: 'Tap the shirt, choose placement and adjust the logo size.',
        },
        price: {
          label: 'Price',
          help: 'Prepare a customer-facing estimate before requesting an offer.',
        },
        request: {
          label: 'Request',
          help: 'Send your request so Stitchra can review the artwork.',
        },
      },
      choice: {
        uploadTitle: 'Bring your own design',
        uploadSubtitle: 'Upload your logo and preview it on the shirt.',
        uploadCta: 'Upload logo',
        aiTitle: 'Create with AI',
        aiSubtitle: 'Describe an idea and generate an embroidery-friendly concept.',
        aiCta: 'Create with AI',
      },
      upload: {
        eyebrow: 'Upload path',
        title: 'Bring your own design',
        subtitle:
          'Upload PNG, JPG or SVG. We’ll preview it on the shirt and check whether it is suitable for embroidery.',
        chooseLogo: 'Choose logo',
        fileHint: 'PNG, JPG or SVG · max 10 MB',
        maxSize: 'Max 10 MB',
        ready: 'Logo ready for preview',
        viewOnShirt: 'View on shirt',
        removeBackground: 'Remove background',
        cleaning: 'Cleaning...',
      },
      ai: {
        eyebrow: 'AI creator',
        title: 'Create with AI',
        subtitle:
          'Describe an original idea. Stitchra turns it into an embroidery-friendly concept for preview.',
        placeholder:
          'Example: playful giraffe driving a tiny red car through space, clean patch logo, 4 colors',
        generating: 'Generating...',
        intent: 'Intent',
        directionPrefix: 'Direction:',
        chooseDirection: 'Choose a style direction before generating.',
        previewNote:
          'AI concepts are previews. Final stitch-ready artwork is reviewed by Stitchra before production.',
        reviewNote: 'Review the concept below, then use it on the shirt.',
        providerCredit: 'AI concept generation powered by',
        privateDataNote: 'Do not enter private personal data in design prompts.',
        uploadInstead: 'Or upload your own logo instead.',
        styleHints: {
          Badge: 'Badge',
          Minimal: 'Minimal',
          Kids: 'Kids',
          Club: 'Club',
          Event: 'Event',
          Streetwear: 'Streetwear',
          Business: 'Business',
          Vintage: 'Vintage',
        },
      },
      review: {
        uploadedEyebrow: 'Uploaded design',
        uploadedTitle: 'Review your logo',
        uploadedText:
          'Check the file before placing it on the T-shirt. You can clean the background when it is a PNG or JPG.',
        addFirstTitle: 'Add your design first',
        addFirstText: 'Upload your logo or create an AI concept before review.',
        continueToReview: 'Continue to Review',
      },
      place: {
        emptyTitle: 'Add your design first',
        emptyText: 'Upload your logo or create an AI concept, then place it on the shirt.',
        guidanceWithLogo: 'Tap the shirt to place your logo.',
        guidanceEmpty:
          'Add your design first. Upload a logo or create one with AI below, then click the shirt to place it.',
        placementEyebrow: 'Placement',
        placementTitle: 'Place your logo',
        placementText: 'Pick a preset or tap directly on the shirt.',
        preset: 'Preset',
        custom: 'Place it yourself',
        customHint: 'Tap the shirt where you want the logo.',
        garment: 'Garment',
        chooseShirtColor: 'Choose shirt color',
        blackTee: 'Black tee',
        whiteTee: 'White tee',
        size: 'Size',
        sizeHelp: 'Logo size stays within safe embroidery limits.',
        small: 'Small',
        medium: 'Medium',
        large: 'Large',
        studioReview: 'Studio review recommended for clean stitch quality.',
        continueToPrice: 'Continue to Price',
      },
      price: {
        eyebrow: 'Price',
        title: 'Get clear price',
        text:
          'Your estimate uses placement, logo size, colors, coverage and artwork detail. Final offer is confirmed before production.',
        preparingLogo: 'Preparing logo...',
        preparingQuote: 'Preparing your quote...',
        addDesignFirst: 'Add your design before checking price.',
        stitches: 'Stitches',
        colors: 'Colors',
        coverage: 'Coverage',
        price: 'Price',
        studioReviewRecommended: 'Studio review recommended',
        clearStartingPrice: 'Clear starting price',
        studioReviewText:
          'Studio review helps keep stitch quality clean for detailed artwork.',
        estimateText: 'This design qualifies for a customer-facing estimate.',
        finalOffer: 'Final offer is confirmed before production.',
        continueToRequest: 'Continue to Request',
      },
      request: {
        sent: 'Request sent',
        successTitle: 'We’ll review your design and prepare your offer.',
        confirmationEmail: 'Confirmation email sent.',
        steps: [
          'Studio checks artwork',
          'You receive an offer',
          'You accept or request changes',
          'Payment and production follow',
        ],
        backToDesign: 'Back to design',
        startNewDesign: 'Start new design',
        summary: 'Request summary',
        yourName: 'Your name',
        email: 'Email',
        phone: 'Phone optional',
        quantity: 'Quantity',
        note: 'Note optional',
        sending: 'Sending...',
        sendRequest: 'Request order',
        openOrderForm: 'Open request form',
      },
    },
    footer: {
      tagline: 'AI embroidery studio',
      how: 'How it works',
      features: 'Features',
      pricing: 'Pricing',
      faq: 'FAQ',
      impressum: 'Impressum',
      privacy: 'Privacy',
      contact: 'Contact',
      terms: 'Terms',
    },
    menu: {
      title: 'Menu',
      ariaOpen: 'Open navigation menu',
      ariaClose: 'Close navigation menu',
      ariaCloseLanguage: 'Close language selector',
    },
  },
  de: {
    common: {
      startDesigning: 'Design starten',
      explore: 'Entdecken',
      menu: 'Menü',
      close: 'Schließen',
      cancel: 'Abbrechen',
      chooseLanguage: 'Sprache wählen',
      language: 'Sprache',
      continue: 'Weiter',
      startFresh: 'Neu starten',
      back: 'Zurück',
      resetView: 'Ansicht zurücksetzen',
      keepEditing: 'Weiter bearbeiten',
      uploadLogo: 'Logo hochladen',
      createWithAi: 'Mit KI erstellen',
      generateConcept: 'Konzept generieren',
      useThisDesign: 'Dieses Design verwenden',
      getClearPrice: 'Klaren Preis erhalten',
      requestOrder: 'Bestellung anfragen',
      contactSupport: 'Support kontaktieren',
      designOnShirt: 'Design ist auf deinem Shirt',
      downloadPreview: 'Vorschau herunterladen',
      shareDesign: 'Design teilen',
      aiConcept: 'KI-Konzept',
      fabricPreview: 'Stoffvorschau',
      clearQuote: 'Klares Angebot',
    },
    mobileHome: {
      productLabel: 'KI-Stickerei-Studio',
      value:
        'Erstelle eine Logoidee, prüfe sie auf Stoff und erhalte ein klares Stickerei-Angebot.',
      heroTitle: 'Sieh dein Logo gestickt auf einem T-Shirt.',
      heroSubtitle:
        'Lade ein Logo hoch oder erstelle eins mit KI, sieh es auf Stoff und erhalte ein klares Angebot vor der Produktion.',
      primaryCta: 'T-Shirt-Vorschau erstellen',
      secondaryCta: 'Beispiele ansehen',
      productionProof: 'Studioprüfung vor Produktion',
      trustChips: ['KI-Logoidee', 'T-Shirt-Vorschau', 'Klares Angebot'],
      miniCardTitle: 'Logo auf Shirt',
      miniCardPrice: 'Ab €9',
      savedDraft: 'Gespeicherter Entwurf',
      continueDraft: 'Letztes Design fortsetzen',
      draftText: 'Wir haben auf diesem Gerät einen aktuellen Entwurf gefunden.',
      exploreEyebrow: 'Stitchra entdecken',
      exploreTitle: 'Ein kompakter Guide vor dem Design.',
      exploreText:
        'Die vollständige Desktop-Story bleibt auf größeren Bildschirmen verfügbar. Auf dem Handy startest du schnell und öffnest nur die Details, die du brauchst.',
      exploreSections: [
        {
          id: 'mobile-explore-how',
          title: 'So funktioniert es',
          summary:
            'Erstellen oder hochladen, Konzept prüfen, auf Stoff platzieren, Preis holen und Anfrage senden.',
          bullets: ['Mit KI erstellen oder Logo hochladen', 'Motiv klar prüfen', 'Auf dem Shirt platzieren und Preis prüfen'],
        },
        {
          id: 'mobile-explore-craft',
          title: 'Handwerksqualität',
          summary:
            'Stitchra hält die Vorschau sticktauglich: klare Formen, lesbare Größe und Studio-Prüfung bei Bedarf.',
          bullets: ['Stoffnahe Vorschau', 'Hintergrund entfernen', 'Qualitätscheck im Studio'],
        },
        {
          id: 'mobile-explore-pricing',
          title: 'Preise',
          summary:
            'Kleine einfache Brustlogos können ab etwa €9 starten. Größere Frontdesigns ab etwa €13.',
          bullets: ['Finales Angebot vor Produktion', 'Studio-Prüfung bei komplexen Motiven', 'Nur kundenseitige Preisinformation'],
        },
        {
          id: 'mobile-explore-gallery',
          title: 'Galerie',
          summary:
            'Kompakte Beispiele für Clubs, Creator, Events und kleine Marken.',
          bullets: ['Badges', 'Markenzeichen', 'Event-Shirts'],
        },
        {
          id: 'mobile-explore-features',
          title: 'Funktionen',
          summary:
            'KI-Konzept, Logo-Bereinigung, Platzierungsvorschau und Anfrage sind in einem mobilen Studio verbunden.',
          bullets: ['KI Concept Studio', 'Eigenes Design hochladen', 'Entwurf nach Refresh wiederherstellen'],
        },
        {
          id: 'mobile-explore-faq',
          title: 'FAQ',
          summary:
            'Du kannst ein einzelnes Shirt bestellen, eine Datei hochladen oder ein originales KI-Konzept erstellen.',
          bullets: ['Zahlung nach finalem Angebot', 'Nur Designs mit Nutzungsrechten verwenden', 'Support: orders@stitchra.com'],
        },
      ],
    },
    designWizard: {
      stepWord: 'Schritt',
      ofWord: 'von',
      steps: {
        choose: { label: 'Wählen', help: 'Wähle, ob du dein Logo hochlädst oder ein neues Konzept mit KI erstellst.' },
        create: { label: 'Erstellen / Upload', help: 'Füge zuerst dein Motiv hinzu. Lade eine Datei hoch oder beschreibe eine originelle Idee.' },
        review: { label: 'Prüfen', help: 'Prüfe das Motiv klar, bevor du es auf dem Shirt platzierst.' },
        place: { label: 'Platzieren', help: 'Tippe auf das Shirt, wähle eine Platzierung und passe die Logogröße an.' },
        price: { label: 'Preis', help: 'Bereite eine Kundenschätzung vor, bevor du ein Angebot anfragst.' },
        request: { label: 'Anfragen', help: 'Sende deine Anfrage, damit Stitchra das Motiv prüfen kann.' },
      },
      choice: {
        uploadTitle: 'Eigenes Design mitbringen',
        uploadSubtitle: 'Lade dein Logo hoch und sieh es auf dem Shirt.',
        uploadCta: 'Logo hochladen',
        aiTitle: 'Mit KI erstellen',
        aiSubtitle: 'Beschreibe eine Idee und generiere ein stickfreundliches Konzept.',
        aiCta: 'Mit KI erstellen',
      },
      upload: {
        eyebrow: 'Upload-Pfad',
        title: 'Eigenes Design mitbringen',
        subtitle: 'Lade PNG, JPG oder SVG hoch. Wir zeigen es auf dem Shirt und prüfen die Sticktauglichkeit.',
        chooseLogo: 'Logo wählen',
        fileHint: 'PNG, JPG oder SVG · max. 10 MB',
        maxSize: 'Max. 10 MB',
        ready: 'Logo bereit für Vorschau',
        viewOnShirt: 'Auf Shirt ansehen',
        removeBackground: 'Hintergrund entfernen',
        cleaning: 'Wird bereinigt...',
      },
      ai: {
        eyebrow: 'KI Creator',
        title: 'Mit KI erstellen',
        subtitle: 'Beschreibe eine originelle Idee. Stitchra macht daraus ein stickfreundliches Konzept.',
        placeholder: 'Beispiel: verspielte Giraffe in rotem Auto im Weltraum, Patch-Logo, 4 Farben',
        generating: 'Generiert...',
        intent: 'Richtung',
        directionPrefix: 'Richtung:',
        chooseDirection: 'Wähle vor dem Generieren eine Stilrichtung.',
        previewNote: 'KI-Konzepte sind Vorschauen. Stitchra prüft das stickfertige Motiv vor der Produktion.',
        reviewNote: 'Prüfe das Konzept unten und nutze es dann auf dem Shirt.',
        providerCredit: 'KI-Konzeptgenerierung unterstützt von',
        privateDataNote: 'Gib keine privaten personenbezogenen Daten in Design-Prompts ein.',
        uploadInstead: 'Oder eigenes Logo hochladen.',
        styleHints: { Badge: 'Badge', Minimal: 'Minimal', Kids: 'Kinder', Club: 'Club', Event: 'Event', Streetwear: 'Streetwear', Business: 'Business', Vintage: 'Vintage' },
      },
      review: {
        uploadedEyebrow: 'Hochgeladenes Design',
        uploadedTitle: 'Logo prüfen',
        uploadedText: 'Prüfe die Datei vor der Platzierung. Bei PNG oder JPG kannst du den Hintergrund bereinigen.',
        addFirstTitle: 'Füge zuerst dein Design hinzu',
        addFirstText: 'Lade dein Logo hoch oder erstelle ein KI-Konzept vor der Prüfung.',
        continueToReview: 'Weiter zur Prüfung',
      },
      place: {
        emptyTitle: 'Füge zuerst dein Design hinzu',
        emptyText: 'Lade dein Logo hoch oder erstelle ein KI-Konzept und platziere es dann auf dem Shirt.',
        guidanceWithLogo: 'Tippe auf das Shirt, um dein Logo zu platzieren.',
        guidanceEmpty: 'Füge zuerst dein Design hinzu. Lade ein Logo hoch oder erstelle unten ein KI-Konzept.',
        placementEyebrow: 'Platzierung',
        placementTitle: 'Logo platzieren',
        placementText: 'Wähle ein Preset oder tippe direkt auf das Shirt.',
        preset: 'Preset',
        custom: 'Selbst platzieren',
        customHint: 'Tippe auf die Stelle, an der das Logo sitzen soll.',
        garment: 'Shirt',
        chooseShirtColor: 'Shirtfarbe wählen',
        blackTee: 'Schwarzes Shirt',
        whiteTee: 'Weißes Shirt',
        size: 'Größe',
        sizeHelp: 'Die Logogröße bleibt innerhalb sicherer Stickgrenzen.',
        small: 'Klein',
        medium: 'Mittel',
        large: 'Groß',
        studioReview: 'Studio-Prüfung empfohlen für saubere Stickqualität.',
        continueToPrice: 'Weiter zum Preis',
      },
      price: {
        eyebrow: 'Preis',
        title: 'Klaren Preis erhalten',
        text: 'Die Schätzung nutzt Platzierung, Logogröße, Farben, Abdeckung und Motivdetail. Das finale Angebot wird vor Produktion bestätigt.',
        preparingLogo: 'Logo wird vorbereitet...',
        preparingQuote: 'Angebot wird vorbereitet...',
        addDesignFirst: 'Füge vor dem Preischeck dein Design hinzu.',
        stitches: 'Stiche',
        colors: 'Farben',
        coverage: 'Abdeckung',
        price: 'Preis',
        studioReviewRecommended: 'Studio-Prüfung empfohlen',
        clearStartingPrice: 'Klarer Startpreis',
        studioReviewText: 'Die Studio-Prüfung hilft, die Stickqualität bei detaillierten Motiven sauber zu halten.',
        estimateText: 'Dieses Design eignet sich für eine kundenseitige Schätzung.',
        finalOffer: 'Finales Angebot wird vor Produktion bestätigt.',
        continueToRequest: 'Weiter zur Anfrage',
      },
      request: {
        sent: 'Anfrage gesendet',
        successTitle: 'Wir prüfen dein Design und bereiten dein Angebot vor.',
        confirmationEmail: 'Bestätigungs-E-Mail gesendet.',
        steps: ['Studio prüft Motiv', 'Du erhältst ein Angebot', 'Du akzeptierst oder wünschst Änderungen', 'Zahlung und Produktion folgen'],
        backToDesign: 'Zurück zum Design',
        startNewDesign: 'Neues Design starten',
        summary: 'Anfrageübersicht',
        yourName: 'Dein Name',
        email: 'E-Mail',
        phone: 'Telefon optional',
        quantity: 'Menge',
        note: 'Notiz optional',
        sending: 'Senden...',
        sendRequest: 'Bestellung anfragen',
        openOrderForm: 'Anfrageformular öffnen',
      },
    },
    footer: {
      tagline: 'KI-Stickerei-Studio',
      how: 'So funktioniert es',
      features: 'Funktionen',
      pricing: 'Preise',
      faq: 'FAQ',
      impressum: 'Impressum',
      privacy: 'Datenschutz',
      contact: 'Kontakt',
      terms: 'AGB',
    },
    menu: {
      title: 'Menü',
      ariaOpen: 'Navigationsmenü öffnen',
      ariaClose: 'Navigationsmenü schließen',
      ariaCloseLanguage: 'Sprachauswahl schließen',
    },
  },
  fr: {
    common: {
      startDesigning: 'Commencer le design',
      explore: 'Explorer',
      menu: 'Menu',
      close: 'Fermer',
      cancel: 'Annuler',
      chooseLanguage: 'Choisir la langue',
      language: 'Langue',
      continue: 'Continuer',
      startFresh: 'Recommencer',
      back: 'Retour',
      resetView: 'Réinitialiser la vue',
      keepEditing: 'Continuer à modifier',
      uploadLogo: 'Importer un logo',
      createWithAi: 'Créer avec l’IA',
      generateConcept: 'Générer un concept',
      useThisDesign: 'Utiliser ce design',
      getClearPrice: 'Obtenir un prix clair',
      requestOrder: 'Demander une commande',
      contactSupport: 'Contacter le support',
      designOnShirt: 'Le design est sur votre T-shirt',
      downloadPreview: 'Télécharger l’aperçu',
      shareDesign: 'Partager le design',
      aiConcept: 'Concept IA',
      fabricPreview: 'Aperçu tissu',
      clearQuote: 'Devis clair',
    },
    mobileHome: {
      productLabel: 'Studio de broderie IA',
      value: 'Créez une idée de logo, prévisualisez-la sur tissu et obtenez un devis clair.',
      heroTitle: 'Vois ton logo brodé sur un T-shirt.',
      heroSubtitle:
        'Importe un logo ou crée-en un avec l’IA, prévisualise-le sur tissu et obtiens un devis clair avant production.',
      primaryCta: 'Créer mon aperçu T-shirt',
      secondaryCta: 'Voir des exemples',
      productionProof: 'Vérification atelier avant production',
      trustChips: ['Concept logo IA', 'Aperçu T-shirt', 'Devis clair'],
      miniCardTitle: 'Logo sur T-shirt',
      miniCardPrice: 'Dès 9 €',
      savedDraft: 'Brouillon enregistré',
      continueDraft: 'Continuer votre dernier design',
      draftText: 'Nous avons trouvé un brouillon récent sur cet appareil.',
      exploreEyebrow: 'Explorer Stitchra',
      exploreTitle: 'Un guide compact avant de créer.',
      exploreText: 'L’histoire complète reste disponible sur grand écran. Sur mobile, commencez vite et ouvrez seulement les détails utiles.',
      exploreSections: [
        { id: 'mobile-explore-how', title: 'Fonctionnement', summary: 'Créez ou importez, vérifiez le concept, placez-le sur le tissu, obtenez un prix puis envoyez la demande.', bullets: ['Créer avec l’IA ou importer un logo', 'Vérifier clairement le visuel', 'Placer sur le T-shirt et vérifier le prix'] },
        { id: 'mobile-explore-craft', title: 'Qualité de broderie', summary: 'Stitchra garde l’aperçu pratique pour la broderie : formes nettes, taille lisible et revue studio si nécessaire.', bullets: ['Aperçu sur tissu', 'Nettoyage du fond', 'Contrôle qualité studio'] },
        { id: 'mobile-explore-pricing', title: 'Prix', summary: 'Les petits logos simples peuvent commencer autour de 9 €. Les grands visuels devant autour de 13 €.', bullets: ['Offre finale avant production', 'Revue studio pour les visuels complexes', 'Devis côté client uniquement'] },
        { id: 'mobile-explore-gallery', title: 'Galerie', summary: 'Exemples compacts pour clubs, créateurs, événements et petites marques.', bullets: ['Badges', 'Marques', 'T-shirts événementiels'] },
        { id: 'mobile-explore-features', title: 'Fonctions', summary: 'Concept IA, nettoyage de logo, aperçu de placement et demande de devis dans un studio mobile.', bullets: ['AI Concept Studio', 'Importer votre design', 'Récupération du brouillon'] },
        { id: 'mobile-explore-faq', title: 'FAQ', summary: 'Vous pouvez commander un seul T-shirt, importer un fichier ou créer un concept IA original.', bullets: ['Paiement après l’offre finale', 'Utilisez seulement des designs autorisés', 'Support : orders@stitchra.com'] },
      ],
    },
    designWizard: {
      stepWord: 'Étape',
      ofWord: 'sur',
      steps: {
        choose: { label: 'Choisir', help: 'Choisissez entre importer votre logo ou créer un nouveau concept avec l’IA.' },
        create: { label: 'Créer / Importer', help: 'Ajoutez d’abord votre visuel. Importez un fichier ou décrivez une idée originale.' },
        review: { label: 'Vérifier', help: 'Inspectez clairement le visuel avant de le placer sur le T-shirt.' },
        place: { label: 'Placer', help: 'Touchez le T-shirt, choisissez l’emplacement et ajustez la taille du logo.' },
        price: { label: 'Prix', help: 'Préparez une estimation client avant de demander une offre.' },
        request: { label: 'Demander', help: 'Envoyez votre demande pour que Stitchra vérifie le visuel.' },
      },
      choice: {
        uploadTitle: 'Apporter votre design',
        uploadSubtitle: 'Importez votre logo et prévisualisez-le sur le T-shirt.',
        uploadCta: 'Importer un logo',
        aiTitle: 'Créer avec l’IA',
        aiSubtitle: 'Décrivez une idée et générez un concept adapté à la broderie.',
        aiCta: 'Créer avec l’IA',
      },
      upload: {
        eyebrow: 'Import',
        title: 'Apporter votre design',
        subtitle: 'Importez PNG, JPG ou SVG. Nous l’affichons sur le T-shirt et vérifions sa compatibilité broderie.',
        chooseLogo: 'Choisir un logo',
        fileHint: 'PNG, JPG ou SVG · max 10 Mo',
        maxSize: 'Max 10 Mo',
        ready: 'Logo prêt pour l’aperçu',
        viewOnShirt: 'Voir sur le T-shirt',
        removeBackground: 'Retirer le fond',
        cleaning: 'Nettoyage...',
      },
      ai: {
        eyebrow: 'Créateur IA',
        title: 'Créer avec l’IA',
        subtitle: 'Décrivez une idée originale. Stitchra la transforme en concept adapté à la broderie.',
        placeholder: 'Exemple : girafe joueuse dans une petite voiture rouge dans l’espace, logo patch, 4 couleurs',
        generating: 'Génération...',
        intent: 'Intention',
        directionPrefix: 'Direction :',
        chooseDirection: 'Choisissez une direction de style avant de générer.',
        previewNote: 'Les concepts IA sont des aperçus. Stitchra vérifie le fichier final avant production.',
        reviewNote: 'Vérifiez le concept ci-dessous, puis utilisez-le sur le T-shirt.',
        providerCredit: 'Génération de concept IA propulsée par',
        privateDataNote: 'N’entrez pas de données personnelles dans les prompts.',
        uploadInstead: 'Ou importez votre propre logo.',
        styleHints: { Badge: 'Badge', Minimal: 'Minimal', Kids: 'Enfants', Club: 'Club', Event: 'Événement', Streetwear: 'Streetwear', Business: 'Business', Vintage: 'Vintage' },
      },
      review: {
        uploadedEyebrow: 'Design importé',
        uploadedTitle: 'Vérifier votre logo',
        uploadedText: 'Vérifiez le fichier avant de le placer. Vous pouvez nettoyer le fond pour un PNG ou JPG.',
        addFirstTitle: 'Ajoutez d’abord votre design',
        addFirstText: 'Importez votre logo ou créez un concept IA avant la revue.',
        continueToReview: 'Continuer vers la revue',
      },
      place: {
        emptyTitle: 'Ajoutez d’abord votre design',
        emptyText: 'Importez votre logo ou créez un concept IA, puis placez-le sur le T-shirt.',
        guidanceWithLogo: 'Touchez le T-shirt pour placer votre logo.',
        guidanceEmpty: 'Ajoutez d’abord votre design. Importez un logo ou créez un concept IA ci-dessous.',
        placementEyebrow: 'Placement',
        placementTitle: 'Placer votre logo',
        placementText: 'Choisissez un préréglage ou touchez directement le T-shirt.',
        preset: 'Préréglage',
        custom: 'Placer vous-même',
        customHint: 'Touchez l’endroit où vous voulez le logo.',
        garment: 'Vêtement',
        chooseShirtColor: 'Choisir la couleur',
        blackTee: 'T-shirt noir',
        whiteTee: 'T-shirt blanc',
        size: 'Taille',
        sizeHelp: 'La taille reste dans des limites sûres pour la broderie.',
        small: 'Petit',
        medium: 'Moyen',
        large: 'Grand',
        studioReview: 'Revue studio recommandée pour une broderie propre.',
        continueToPrice: 'Continuer vers le prix',
      },
      price: {
        eyebrow: 'Prix',
        title: 'Obtenir un prix clair',
        text: 'L’estimation utilise placement, taille du logo, couleurs, couverture et détail. L’offre finale est confirmée avant production.',
        preparingLogo: 'Préparation du logo...',
        preparingQuote: 'Préparation du devis...',
        addDesignFirst: 'Ajoutez votre design avant de vérifier le prix.',
        stitches: 'Points',
        colors: 'Couleurs',
        coverage: 'Couverture',
        price: 'Prix',
        studioReviewRecommended: 'Revue studio recommandée',
        clearStartingPrice: 'Prix de départ clair',
        studioReviewText: 'La revue studio aide à garder une qualité propre pour les visuels détaillés.',
        estimateText: 'Ce design peut recevoir une estimation client.',
        finalOffer: 'L’offre finale est confirmée avant production.',
        continueToRequest: 'Continuer vers la demande',
      },
      request: {
        sent: 'Demande envoyée',
        successTitle: 'Nous vérifierons votre design et préparerons votre offre.',
        confirmationEmail: 'E-mail de confirmation envoyé.',
        steps: ['Le studio vérifie le visuel', 'Vous recevez une offre', 'Vous acceptez ou demandez des changements', 'Paiement et production suivent'],
        backToDesign: 'Retour au design',
        startNewDesign: 'Nouveau design',
        summary: 'Résumé de la demande',
        yourName: 'Votre nom',
        email: 'E-mail',
        phone: 'Téléphone optionnel',
        quantity: 'Quantité',
        note: 'Note optionnelle',
        sending: 'Envoi...',
        sendRequest: 'Demander la commande',
        openOrderForm: 'Ouvrir le formulaire',
      },
    },
    footer: {
      tagline: 'studio de broderie IA',
      how: 'Fonctionnement',
      features: 'Fonctions',
      pricing: 'Prix',
      faq: 'FAQ',
      impressum: 'Impressum',
      privacy: 'Confidentialité',
      contact: 'Contact',
      terms: 'Conditions',
    },
    menu: {
      title: 'Menu',
      ariaOpen: 'Ouvrir le menu',
      ariaClose: 'Fermer le menu',
      ariaCloseLanguage: 'Fermer le choix de langue',
    },
  },
  ar: {
    common: {
      startDesigning: 'ابدأ التصميم',
      explore: 'استكشف',
      menu: 'القائمة',
      close: 'إغلاق',
      cancel: 'إلغاء',
      chooseLanguage: 'اختر اللغة',
      language: 'اللغة',
      continue: 'متابعة',
      startFresh: 'ابدأ من جديد',
      back: 'رجوع',
      resetView: 'إعادة ضبط العرض',
      keepEditing: 'تابع التحرير',
      uploadLogo: 'ارفع الشعار',
      createWithAi: 'أنشئ بالذكاء الاصطناعي',
      generateConcept: 'أنشئ تصوراً',
      useThisDesign: 'استخدم هذا التصميم',
      getClearPrice: 'احصل على سعر واضح',
      requestOrder: 'أرسل طلباً',
      contactSupport: 'تواصل مع الدعم',
      designOnShirt: 'التصميم على قميصك',
      downloadPreview: 'تنزيل المعاينة',
      shareDesign: 'مشاركة التصميم',
      aiConcept: 'تصور بالذكاء الاصطناعي',
      fabricPreview: 'معاينة على القماش',
      clearQuote: 'عرض سعر واضح',
    },
    mobileHome: {
      productLabel: 'استوديو تطريز بالذكاء الاصطناعي',
      value: 'أنشئ فكرة شعار، عاينها على القماش، واحصل على عرض تطريز واضح.',
      heroTitle: 'شاهد شعارك مطرزًا على قميص.',
      heroSubtitle:
        'ارفع شعارك أو أنشئ واحدًا بالذكاء الاصطناعي، عاينه على القماش واحصل على عرض واضح قبل الإنتاج.',
      primaryCta: 'أنشئ معاينة القميص',
      secondaryCta: 'استكشف الأمثلة',
      productionProof: 'مراجعة الاستوديو قبل الإنتاج',
      trustChips: ['فكرة شعار بالذكاء الاصطناعي', 'معاينة القميص', 'عرض واضح'],
      miniCardTitle: 'الشعار على القميص',
      miniCardPrice: 'ابتداءً من 9 €',
      savedDraft: 'مسودة محفوظة',
      continueDraft: 'تابع آخر تصميم',
      draftText: 'وجدنا مسودة حديثة على هذا الجهاز.',
      exploreEyebrow: 'استكشف Stitchra',
      exploreTitle: 'دليل مختصر قبل التصميم.',
      exploreText: 'القصة الكاملة متاحة على الشاشات الكبيرة. على الهاتف ابدأ بسرعة وافتح التفاصيل التي تحتاجها فقط.',
      exploreSections: [
        { id: 'mobile-explore-how', title: 'طريقة العمل', summary: 'أنشئ أو ارفع التصميم، راجع التصور، ضعه على القماش، احصل على سعر، ثم أرسل الطلب.', bullets: ['أنشئ بالذكاء الاصطناعي أو ارفع شعاراً', 'راجع التصميم بوضوح', 'ضعه على القميص وافحص السعر'] },
        { id: 'mobile-explore-craft', title: 'جودة الحرفة', summary: 'يحافظ Stitchra على معاينة مناسبة للتطريز: أشكال واضحة، حجم مقروء ومراجعة من الاستوديو عند الحاجة.', bullets: ['معاينة على القماش', 'تنظيف الخلفية', 'فحص جودة الاستوديو'] },
        { id: 'mobile-explore-pricing', title: 'الأسعار', summary: 'الشعارات الصغيرة البسيطة على الصدر قد تبدأ من حوالي €9. التصاميم الأمامية الأكبر من حوالي €13.', bullets: ['عرض نهائي قبل الإنتاج', 'مراجعة للتصاميم المعقدة', 'عرض سعر واضح للعميل'] },
        { id: 'mobile-explore-gallery', title: 'المعرض', summary: 'أمثلة مختصرة للأندية والمبدعين والفعاليات والعلامات الصغيرة.', bullets: ['شارات', 'علامات تجارية', 'قمصان فعاليات'] },
        { id: 'mobile-explore-features', title: 'المزايا', summary: 'تصور بالذكاء الاصطناعي، تنظيف الشعار، معاينة الموضع وطلب العرض في تجربة واحدة للهاتف.', bullets: ['استوديو تصور AI', 'ارفع تصميمك', 'استعادة المسودة بعد التحديث'] },
        { id: 'mobile-explore-faq', title: 'الأسئلة', summary: 'يمكنك طلب قميص واحد، رفع ملفك، أو إنشاء تصور أصلي قبل طلب العرض.', bullets: ['الدفع بعد العرض النهائي', 'استخدم فقط تصاميم تملك حقوقها', 'الدعم: orders@stitchra.com'] },
      ],
    },
    designWizard: {
      stepWord: 'الخطوة',
      ofWord: 'من',
      steps: {
        choose: { label: 'اختر', help: 'اختر بين رفع شعارك أو إنشاء تصور جديد بالذكاء الاصطناعي.' },
        create: { label: 'إنشاء / رفع', help: 'أضف العمل الفني أولاً. ارفع ملفاً أو صف فكرة أصلية.' },
        review: { label: 'مراجعة', help: 'افحص التصميم بوضوح قبل وضعه على القميص.' },
        place: { label: 'وضع', help: 'اضغط على القميص، اختر الموضع واضبط حجم الشعار.' },
        price: { label: 'السعر', help: 'حضّر تقديراً واضحاً قبل طلب العرض.' },
        request: { label: 'الطلب', help: 'أرسل طلبك لكي يراجع Stitchra العمل الفني.' },
      },
      choice: {
        uploadTitle: 'أحضر تصميمك',
        uploadSubtitle: 'ارفع شعارك وعاينه على القميص.',
        uploadCta: 'ارفع الشعار',
        aiTitle: 'أنشئ بالذكاء الاصطناعي',
        aiSubtitle: 'صف فكرة وأنشئ تصوراً مناسباً للتطريز.',
        aiCta: 'أنشئ بالذكاء الاصطناعي',
      },
      upload: {
        eyebrow: 'مسار الرفع',
        title: 'أحضر تصميمك',
        subtitle: 'ارفع PNG أو JPG أو SVG. سنعرضه على القميص ونفحص مناسبته للتطريز.',
        chooseLogo: 'اختر الشعار',
        fileHint: 'PNG أو JPG أو SVG · بحد أقصى 10 MB',
        maxSize: 'بحد أقصى 10 MB',
        ready: 'الشعار جاهز للمعاينة',
        viewOnShirt: 'اعرضه على القميص',
        removeBackground: 'إزالة الخلفية',
        cleaning: 'جارٍ التنظيف...',
      },
      ai: {
        eyebrow: 'منشئ AI',
        title: 'أنشئ بالذكاء الاصطناعي',
        subtitle: 'صف فكرة أصلية. يحولها Stitchra إلى تصور مناسب للتطريز.',
        placeholder: 'مثال: زرافة مرحة تقود سيارة حمراء صغيرة في الفضاء، شعار باتش، 4 ألوان',
        generating: 'جارٍ الإنشاء...',
        intent: 'الاتجاه',
        directionPrefix: 'الاتجاه:',
        chooseDirection: 'اختر اتجاه النمط قبل الإنشاء.',
        previewNote: 'تصورات الذكاء الاصطناعي للمعاينة فقط. يراجع Stitchra الملف النهائي قبل الإنتاج.',
        reviewNote: 'راجع التصور أدناه ثم استخدمه على القميص.',
        providerCredit: 'إنشاء تصورات AI مدعوم من',
        privateDataNote: 'لا تدخل بيانات شخصية خاصة في وصف التصميم.',
        uploadInstead: 'أو ارفع شعارك بدلاً من ذلك.',
        styleHints: { Badge: 'شارة', Minimal: 'بسيط', Kids: 'أطفال', Club: 'نادٍ', Event: 'فعالية', Streetwear: 'ستريت وير', Business: 'عمل', Vintage: 'كلاسيكي' },
      },
      review: {
        uploadedEyebrow: 'تصميم مرفوع',
        uploadedTitle: 'راجع شعارك',
        uploadedText: 'افحص الملف قبل وضعه على القميص. يمكن تنظيف الخلفية إذا كان PNG أو JPG.',
        addFirstTitle: 'أضف تصميمك أولاً',
        addFirstText: 'ارفع شعارك أو أنشئ تصور AI قبل المراجعة.',
        continueToReview: 'تابع إلى المراجعة',
      },
      place: {
        emptyTitle: 'أضف تصميمك أولاً',
        emptyText: 'ارفع شعارك أو أنشئ تصوراً بالذكاء الاصطناعي، ثم ضعه على القميص.',
        guidanceWithLogo: 'اضغط على القميص لوضع الشعار.',
        guidanceEmpty: 'أضف تصميمك أولاً. ارفع شعاراً أو أنشئ تصور AI أدناه.',
        placementEyebrow: 'الموضع',
        placementTitle: 'ضع الشعار',
        placementText: 'اختر موضعاً جاهزاً أو اضغط مباشرة على القميص.',
        preset: 'موضع جاهز',
        custom: 'ضعه بنفسك',
        customHint: 'اضغط على المكان الذي تريد وضع الشعار فيه.',
        garment: 'القميص',
        chooseShirtColor: 'اختر لون القميص',
        blackTee: 'قميص أسود',
        whiteTee: 'قميص أبيض',
        size: 'الحجم',
        sizeHelp: 'يبقى حجم الشعار ضمن حدود آمنة للتطريز.',
        small: 'صغير',
        medium: 'متوسط',
        large: 'كبير',
        studioReview: 'نوصي بمراجعة الاستوديو للحفاظ على جودة تطريز نظيفة.',
        continueToPrice: 'تابع إلى السعر',
      },
      price: {
        eyebrow: 'السعر',
        title: 'احصل على سعر واضح',
        text: 'يعتمد التقدير على الموضع وحجم الشعار والألوان والتغطية وتفاصيل العمل. يؤكد العرض النهائي قبل الإنتاج.',
        preparingLogo: 'جارٍ تجهيز الشعار...',
        preparingQuote: 'جارٍ إعداد العرض...',
        addDesignFirst: 'أضف تصميمك قبل فحص السعر.',
        stitches: 'الغرز',
        colors: 'الألوان',
        coverage: 'التغطية',
        price: 'السعر',
        studioReviewRecommended: 'مراجعة الاستوديو موصى بها',
        clearStartingPrice: 'سعر مبدئي واضح',
        studioReviewText: 'تساعد مراجعة الاستوديو في الحفاظ على جودة التطريز للتصاميم المفصلة.',
        estimateText: 'هذا التصميم مناسب لتقدير واضح للعميل.',
        finalOffer: 'يتم تأكيد العرض النهائي قبل الإنتاج.',
        continueToRequest: 'تابع إلى الطلب',
      },
      request: {
        sent: 'تم إرسال الطلب',
        successTitle: 'سنراجع تصميمك ونجهز العرض.',
        confirmationEmail: 'تم إرسال رسالة تأكيد.',
        steps: ['يفحص الاستوديو العمل الفني', 'يصلك عرض السعر', 'تقبل أو تطلب تعديلات', 'ثم يأتي الدفع والإنتاج'],
        backToDesign: 'العودة للتصميم',
        startNewDesign: 'ابدأ تصميماً جديداً',
        summary: 'ملخص الطلب',
        yourName: 'اسمك',
        email: 'البريد الإلكتروني',
        phone: 'الهاتف اختياري',
        quantity: 'الكمية',
        note: 'ملاحظة اختيارية',
        sending: 'جارٍ الإرسال...',
        sendRequest: 'أرسل الطلب',
        openOrderForm: 'افتح نموذج الطلب',
      },
    },
    footer: {
      tagline: 'استوديو تطريز بالذكاء الاصطناعي',
      how: 'طريقة العمل',
      features: 'المزايا',
      pricing: 'الأسعار',
      faq: 'الأسئلة',
      impressum: 'البيانات القانونية',
      privacy: 'الخصوصية',
      contact: 'تواصل',
      terms: 'الشروط',
    },
    menu: {
      title: 'القائمة',
      ariaOpen: 'افتح قائمة التنقل',
      ariaClose: 'أغلق قائمة التنقل',
      ariaCloseLanguage: 'أغلق اختيار اللغة',
    },
  },
  es: {
    common: {
      startDesigning: 'Empezar diseño',
      explore: 'Explorar',
      menu: 'Menú',
      close: 'Cerrar',
      cancel: 'Cancelar',
      chooseLanguage: 'Elegir idioma',
      language: 'Idioma',
      continue: 'Continuar',
      startFresh: 'Empezar de nuevo',
      back: 'Atrás',
      resetView: 'Restablecer vista',
      keepEditing: 'Seguir editando',
      uploadLogo: 'Subir logo',
      createWithAi: 'Crear con IA',
      generateConcept: 'Generar concepto',
      useThisDesign: 'Usar este diseño',
      getClearPrice: 'Obtener precio claro',
      requestOrder: 'Solicitar pedido',
      contactSupport: 'Contactar soporte',
      designOnShirt: 'El diseño está en tu camiseta',
      downloadPreview: 'Descargar vista previa',
      shareDesign: 'Compartir diseño',
      aiConcept: 'Concepto IA',
      fabricPreview: 'Vista en tela',
      clearQuote: 'Presupuesto claro',
    },
    mobileHome: {
      productLabel: 'Estudio de bordado con IA',
      value: 'Crea una idea de logo, prévisualízala en tela y obtén un presupuesto claro.',
      heroTitle: 'Ve tu logo bordado en una camiseta.',
      heroSubtitle:
        'Sube un logo o créalo con IA, previsualízalo sobre tela y recibe un presupuesto claro antes de producir.',
      primaryCta: 'Crear vista previa',
      secondaryCta: 'Ver ejemplos',
      productionProof: 'Revisión del estudio antes de producir',
      trustChips: ['Concepto de logo IA', 'Vista en camiseta', 'Presupuesto claro'],
      miniCardTitle: 'Logo en camiseta',
      miniCardPrice: 'Desde 9 €',
      savedDraft: 'Borrador guardado',
      continueDraft: 'Continuar último diseño',
      draftText: 'Encontramos un borrador reciente en este dispositivo.',
      exploreEyebrow: 'Explorar Stitchra',
      exploreTitle: 'Una guía compacta antes de diseñar.',
      exploreText: 'La historia completa sigue disponible en pantallas grandes. En móvil, empieza rápido y abre solo lo que necesitas.',
      exploreSections: [
        { id: 'mobile-explore-how', title: 'Cómo funciona', summary: 'Crea o sube, revisa el concepto, colócalo en tela, calcula precio y solicita el pedido.', bullets: ['Crear con IA o subir logo', 'Revisar claramente el arte', 'Colocar en la camiseta y revisar precio'] },
        { id: 'mobile-explore-craft', title: 'Calidad artesanal', summary: 'Stitchra mantiene la vista práctica para bordado: formas limpias, tamaño legible y revisión si hace falta.', bullets: ['Vista en tela', 'Limpieza de fondo', 'Control del estudio'] },
        { id: 'mobile-explore-pricing', title: 'Precios', summary: 'Logos pequeños simples pueden empezar cerca de €9. Diseños frontales grandes cerca de €13.', bullets: ['Oferta final antes de producción', 'Revisión para arte complejo', 'Presupuesto claro para el cliente'] },
        { id: 'mobile-explore-gallery', title: 'Galería', summary: 'Ejemplos compactos para clubes, creadores, eventos y marcas pequeñas.', bullets: ['Insignias', 'Marcas', 'Camisetas de evento'] },
        { id: 'mobile-explore-features', title: 'Funciones', summary: 'Concepto IA, limpieza de logo, vista de colocación y solicitud de presupuesto en un estudio móvil.', bullets: ['AI Concept Studio', 'Subir tu diseño', 'Recuperación del borrador'] },
        { id: 'mobile-explore-faq', title: 'FAQ', summary: 'Puedes pedir una camiseta, subir tu archivo o crear un concepto IA original antes del presupuesto.', bullets: ['Pago después de la oferta final', 'Usa solo diseños con derechos', 'Soporte: orders@stitchra.com'] },
      ],
    },
    designWizard: {
      stepWord: 'Paso',
      ofWord: 'de',
      steps: {
        choose: { label: 'Elegir', help: 'Elige subir tu logo o crear un nuevo concepto con IA.' },
        create: { label: 'Crear / Subir', help: 'Añade primero el arte. Sube un archivo o describe una idea original.' },
        review: { label: 'Revisar', help: 'Inspecciona el arte claramente antes de ponerlo en la camiseta.' },
        place: { label: 'Colocar', help: 'Toca la camiseta, elige ubicación y ajusta el tamaño del logo.' },
        price: { label: 'Precio', help: 'Prepara una estimación para el cliente antes de pedir oferta.' },
        request: { label: 'Solicitar', help: 'Envía la solicitud para que Stitchra revise el arte.' },
      },
      choice: {
        uploadTitle: 'Trae tu diseño',
        uploadSubtitle: 'Sube tu logo y prévisualízalo en la camiseta.',
        uploadCta: 'Subir logo',
        aiTitle: 'Crear con IA',
        aiSubtitle: 'Describe una idea y genera un concepto apto para bordado.',
        aiCta: 'Crear con IA',
      },
      upload: {
        eyebrow: 'Subida',
        title: 'Trae tu diseño',
        subtitle: 'Sube PNG, JPG o SVG. Lo mostraremos en la camiseta y revisaremos si sirve para bordado.',
        chooseLogo: 'Elegir logo',
        fileHint: 'PNG, JPG o SVG · máx. 10 MB',
        maxSize: 'Máx. 10 MB',
        ready: 'Logo listo para vista previa',
        viewOnShirt: 'Ver en camiseta',
        removeBackground: 'Quitar fondo',
        cleaning: 'Limpiando...',
      },
      ai: {
        eyebrow: 'Creador IA',
        title: 'Crear con IA',
        subtitle: 'Describe una idea original. Stitchra la convierte en un concepto apto para bordado.',
        placeholder: 'Ejemplo: jirafa juguetona conduciendo un coche rojo por el espacio, logo parche, 4 colores',
        generating: 'Generando...',
        intent: 'Intención',
        directionPrefix: 'Dirección:',
        chooseDirection: 'Elige una dirección de estilo antes de generar.',
        previewNote: 'Los conceptos IA son vistas previas. Stitchra revisa el arte final antes de producción.',
        reviewNote: 'Revisa el concepto abajo y úsalo en la camiseta.',
        providerCredit: 'Generación de concepto IA impulsada por',
        privateDataNote: 'No introduzcas datos personales en los prompts.',
        uploadInstead: 'O sube tu propio logo.',
        styleHints: { Badge: 'Insignia', Minimal: 'Minimal', Kids: 'Niños', Club: 'Club', Event: 'Evento', Streetwear: 'Streetwear', Business: 'Negocio', Vintage: 'Vintage' },
      },
      review: {
        uploadedEyebrow: 'Diseño subido',
        uploadedTitle: 'Revisa tu logo',
        uploadedText: 'Revisa el archivo antes de colocarlo. Puedes limpiar el fondo si es PNG o JPG.',
        addFirstTitle: 'Añade tu diseño primero',
        addFirstText: 'Sube tu logo o crea un concepto IA antes de revisar.',
        continueToReview: 'Continuar a revisión',
      },
      place: {
        emptyTitle: 'Añade tu diseño primero',
        emptyText: 'Sube tu logo o crea un concepto IA, luego colócalo en la camiseta.',
        guidanceWithLogo: 'Toca la camiseta para colocar el logo.',
        guidanceEmpty: 'Añade tu diseño primero. Sube un logo o crea un concepto IA abajo.',
        placementEyebrow: 'Ubicación',
        placementTitle: 'Coloca tu logo',
        placementText: 'Elige un preajuste o toca directamente la camiseta.',
        preset: 'Preajuste',
        custom: 'Colócalo tú',
        customHint: 'Toca donde quieres el logo.',
        garment: 'Prenda',
        chooseShirtColor: 'Elige color de camiseta',
        blackTee: 'Camiseta negra',
        whiteTee: 'Camiseta blanca',
        size: 'Tamaño',
        sizeHelp: 'El tamaño queda dentro de límites seguros para bordado.',
        small: 'Pequeño',
        medium: 'Mediano',
        large: 'Grande',
        studioReview: 'Revisión recomendada para una calidad limpia.',
        continueToPrice: 'Continuar al precio',
      },
      price: {
        eyebrow: 'Precio',
        title: 'Obtener precio claro',
        text: 'La estimación usa ubicación, tamaño, colores, cobertura y detalle. La oferta final se confirma antes de producción.',
        preparingLogo: 'Preparando logo...',
        preparingQuote: 'Preparando presupuesto...',
        addDesignFirst: 'Añade tu diseño antes de ver el precio.',
        stitches: 'Puntadas',
        colors: 'Colores',
        coverage: 'Cobertura',
        price: 'Precio',
        studioReviewRecommended: 'Revisión recomendada',
        clearStartingPrice: 'Precio inicial claro',
        studioReviewText: 'La revisión ayuda a mantener la calidad limpia en diseños detallados.',
        estimateText: 'Este diseño puede recibir una estimación para el cliente.',
        finalOffer: 'La oferta final se confirma antes de producción.',
        continueToRequest: 'Continuar a solicitud',
      },
      request: {
        sent: 'Solicitud enviada',
        successTitle: 'Revisaremos tu diseño y prepararemos tu oferta.',
        confirmationEmail: 'Correo de confirmación enviado.',
        steps: ['El estudio revisa el arte', 'Recibes una oferta', 'Aceptas o pides cambios', 'Pago y producción después'],
        backToDesign: 'Volver al diseño',
        startNewDesign: 'Nuevo diseño',
        summary: 'Resumen de solicitud',
        yourName: 'Tu nombre',
        email: 'Email',
        phone: 'Teléfono opcional',
        quantity: 'Cantidad',
        note: 'Nota opcional',
        sending: 'Enviando...',
        sendRequest: 'Solicitar pedido',
        openOrderForm: 'Abrir formulario',
      },
    },
    footer: {
      tagline: 'estudio de bordado con IA',
      how: 'Cómo funciona',
      features: 'Funciones',
      pricing: 'Precios',
      faq: 'FAQ',
      impressum: 'Aviso legal',
      privacy: 'Privacidad',
      contact: 'Contacto',
      terms: 'Términos',
    },
    menu: {
      title: 'Menú',
      ariaOpen: 'Abrir menú',
      ariaClose: 'Cerrar menú',
      ariaCloseLanguage: 'Cerrar selector de idioma',
    },
  },
  ru: {
    common: {
      startDesigning: 'Начать дизайн',
      explore: 'Изучить',
      menu: 'Меню',
      close: 'Закрыть',
      cancel: 'Отмена',
      chooseLanguage: 'Выбрать язык',
      language: 'Язык',
      continue: 'Продолжить',
      startFresh: 'Начать заново',
      back: 'Назад',
      resetView: 'Сбросить вид',
      keepEditing: 'Продолжить редактирование',
      uploadLogo: 'Загрузить логотип',
      createWithAi: 'Создать с AI',
      generateConcept: 'Сгенерировать концепт',
      useThisDesign: 'Использовать дизайн',
      getClearPrice: 'Получить понятную цену',
      requestOrder: 'Запросить заказ',
      contactSupport: 'Связаться с поддержкой',
      designOnShirt: 'Дизайн на футболке',
      downloadPreview: 'Скачать предпросмотр',
      shareDesign: 'Поделиться дизайном',
      aiConcept: 'AI-концепт',
      fabricPreview: 'Предпросмотр ткани',
      clearQuote: 'Понятный расчет',
    },
    mobileHome: {
      productLabel: 'AI-студия вышивки',
      value: 'Создайте идею логотипа, посмотрите ее на ткани и получите понятную цену.',
      heroTitle: 'Посмотри логотип как вышивку на футболке.',
      heroSubtitle:
        'Загрузи логотип или создай его с AI, посмотри на ткани и получи понятное предложение до производства.',
      primaryCta: 'Создать превью футболки',
      secondaryCta: 'Смотреть примеры',
      productionProof: 'Проверка студии перед производством',
      trustChips: ['AI-идея логотипа', 'Превью футболки', 'Понятная цена'],
      miniCardTitle: 'Логотип на футболке',
      miniCardPrice: 'От 9 €',
      savedDraft: 'Сохраненный черновик',
      continueDraft: 'Продолжить последний дизайн',
      draftText: 'Мы нашли свежий черновик на этом устройстве.',
      exploreEyebrow: 'Изучить Stitchra',
      exploreTitle: 'Краткий гид перед дизайном.',
      exploreText: 'Полная история доступна на больших экранах. На мобильном начните быстро и открывайте только нужные детали.',
      exploreSections: [
        { id: 'mobile-explore-how', title: 'Как это работает', summary: 'Создайте или загрузите, проверьте концепт, разместите на ткани, получите цену и отправьте запрос.', bullets: ['Создать с AI или загрузить логотип', 'Ясно проверить макет', 'Разместить на футболке и проверить цену'] },
        { id: 'mobile-explore-craft', title: 'Качество работы', summary: 'Stitchra держит предпросмотр практичным для вышивки: чистые формы, читаемый размер и проверка студией при необходимости.', bullets: ['Предпросмотр на ткани', 'Очистка фона', 'Проверка студией'] },
        { id: 'mobile-explore-pricing', title: 'Цены', summary: 'Небольшие простые логотипы на груди могут начинаться примерно от €9. Большие передние дизайны — от €13.', bullets: ['Финальное предложение до производства', 'Проверка сложных макетов', 'Только клиентский расчет'] },
        { id: 'mobile-explore-gallery', title: 'Галерея', summary: 'Краткие примеры для клубов, авторов, событий и небольших брендов.', bullets: ['Бейджи', 'Бренд-знаки', 'Футболки для событий'] },
        { id: 'mobile-explore-features', title: 'Возможности', summary: 'AI-концепт, очистка логотипа, предпросмотр размещения и запрос цены в одном мобильном процессе.', bullets: ['AI Concept Studio', 'Загрузить свой дизайн', 'Восстановление после обновления'] },
        { id: 'mobile-explore-faq', title: 'FAQ', summary: 'Можно заказать одну футболку, загрузить файл или создать оригинальный AI-концепт перед расчетом.', bullets: ['Оплата после финального предложения', 'Используйте только разрешенные дизайны', 'Поддержка: orders@stitchra.com'] },
      ],
    },
    designWizard: {
      stepWord: 'Шаг',
      ofWord: 'из',
      steps: {
        choose: { label: 'Выбор', help: 'Выберите загрузку логотипа или создание нового концепта с AI.' },
        create: { label: 'Создать / Загрузить', help: 'Сначала добавьте макет. Загрузите файл или опишите оригинальную идею.' },
        review: { label: 'Проверка', help: 'Внимательно проверьте макет перед размещением на футболке.' },
        place: { label: 'Размещение', help: 'Коснитесь футболки, выберите место и настройте размер логотипа.' },
        price: { label: 'Цена', help: 'Подготовьте клиентскую оценку перед запросом предложения.' },
        request: { label: 'Запрос', help: 'Отправьте запрос, чтобы Stitchra проверила макет.' },
      },
      choice: {
        uploadTitle: 'Загрузить свой дизайн',
        uploadSubtitle: 'Загрузите логотип и посмотрите его на футболке.',
        uploadCta: 'Загрузить логотип',
        aiTitle: 'Создать с AI',
        aiSubtitle: 'Опишите идею и получите концепт, подходящий для вышивки.',
        aiCta: 'Создать с AI',
      },
      upload: {
        eyebrow: 'Загрузка',
        title: 'Загрузить свой дизайн',
        subtitle: 'Загрузите PNG, JPG или SVG. Мы покажем его на футболке и проверим пригодность для вышивки.',
        chooseLogo: 'Выбрать логотип',
        fileHint: 'PNG, JPG или SVG · до 10 MB',
        maxSize: 'До 10 MB',
        ready: 'Логотип готов к предпросмотру',
        viewOnShirt: 'Показать на футболке',
        removeBackground: 'Удалить фон',
        cleaning: 'Очистка...',
      },
      ai: {
        eyebrow: 'AI-создатель',
        title: 'Создать с AI',
        subtitle: 'Опишите оригинальную идею. Stitchra превратит ее в концепт для вышивки.',
        placeholder: 'Пример: игривая жирафа в маленькой красной машине в космосе, patch-логотип, 4 цвета',
        generating: 'Генерация...',
        intent: 'Направление',
        directionPrefix: 'Направление:',
        chooseDirection: 'Выберите стиль перед генерацией.',
        previewNote: 'AI-концепты — это предпросмотр. Stitchra проверяет финальный файл перед производством.',
        reviewNote: 'Проверьте концепт ниже и используйте его на футболке.',
        providerCredit: 'Генерация AI-концепта работает на',
        privateDataNote: 'Не вводите личные данные в дизайн-промпты.',
        uploadInstead: 'Или загрузите свой логотип.',
        styleHints: { Badge: 'Бейдж', Minimal: 'Минимал', Kids: 'Детское', Club: 'Клуб', Event: 'Событие', Streetwear: 'Streetwear', Business: 'Бизнес', Vintage: 'Vintage' },
      },
      review: {
        uploadedEyebrow: 'Загруженный дизайн',
        uploadedTitle: 'Проверьте логотип',
        uploadedText: 'Проверьте файл перед размещением. Для PNG или JPG можно очистить фон.',
        addFirstTitle: 'Сначала добавьте дизайн',
        addFirstText: 'Загрузите логотип или создайте AI-концепт перед проверкой.',
        continueToReview: 'Продолжить к проверке',
      },
      place: {
        emptyTitle: 'Сначала добавьте дизайн',
        emptyText: 'Загрузите логотип или создайте AI-концепт, затем разместите его на футболке.',
        guidanceWithLogo: 'Коснитесь футболки, чтобы разместить логотип.',
        guidanceEmpty: 'Сначала добавьте дизайн. Загрузите логотип или создайте AI-концепт ниже.',
        placementEyebrow: 'Размещение',
        placementTitle: 'Разместите логотип',
        placementText: 'Выберите пресет или коснитесь футболки.',
        preset: 'Пресет',
        custom: 'Разместить вручную',
        customHint: 'Коснитесь места для логотипа.',
        garment: 'Футболка',
        chooseShirtColor: 'Выберите цвет',
        blackTee: 'Черная футболка',
        whiteTee: 'Белая футболка',
        size: 'Размер',
        sizeHelp: 'Размер остается в безопасных пределах для вышивки.',
        small: 'Малый',
        medium: 'Средний',
        large: 'Большой',
        studioReview: 'Рекомендуется проверка студией для чистой вышивки.',
        continueToPrice: 'Продолжить к цене',
      },
      price: {
        eyebrow: 'Цена',
        title: 'Получить понятную цену',
        text: 'Оценка учитывает размещение, размер, цвета, покрытие и детали. Финальное предложение подтверждается до производства.',
        preparingLogo: 'Подготовка логотипа...',
        preparingQuote: 'Подготовка расчета...',
        addDesignFirst: 'Добавьте дизайн перед проверкой цены.',
        stitches: 'Стежки',
        colors: 'Цвета',
        coverage: 'Покрытие',
        price: 'Цена',
        studioReviewRecommended: 'Рекомендуется проверка студией',
        clearStartingPrice: 'Понятная стартовая цена',
        studioReviewText: 'Проверка помогает сохранить качество для детальных макетов.',
        estimateText: 'Этот дизайн подходит для клиентской оценки.',
        finalOffer: 'Финальное предложение подтверждается до производства.',
        continueToRequest: 'Продолжить к запросу',
      },
      request: {
        sent: 'Запрос отправлен',
        successTitle: 'Мы проверим дизайн и подготовим предложение.',
        confirmationEmail: 'Письмо подтверждения отправлено.',
        steps: ['Студия проверяет макет', 'Вы получаете предложение', 'Вы принимаете или просите изменения', 'Затем оплата и производство'],
        backToDesign: 'Назад к дизайну',
        startNewDesign: 'Новый дизайн',
        summary: 'Итог запроса',
        yourName: 'Ваше имя',
        email: 'Email',
        phone: 'Телефон необязательно',
        quantity: 'Количество',
        note: 'Заметка необязательно',
        sending: 'Отправка...',
        sendRequest: 'Запросить заказ',
        openOrderForm: 'Открыть форму',
      },
    },
    footer: {
      tagline: 'студия AI-вышивки',
      how: 'Как это работает',
      features: 'Возможности',
      pricing: 'Цены',
      faq: 'FAQ',
      impressum: 'Impressum',
      privacy: 'Конфиденциальность',
      contact: 'Контакт',
      terms: 'Условия',
    },
    menu: {
      title: 'Меню',
      ariaOpen: 'Открыть меню',
      ariaClose: 'Закрыть меню',
      ariaCloseLanguage: 'Закрыть выбор языка',
    },
  },
};

export function getPublicI18nCopy(locale: Locale): PublicI18nCopy {
  return publicCopies[locale] ?? publicCopies[defaultLocale];
}

export function getLocalizedRouteItems(locale: Locale) {
  const copy = getPublicI18nCopy(locale);

  return [
    { label: copy.common.startDesigning, href: routeMap.design },
    { label: copy.common.explore, href: routeMap.explore },
    { label: copy.footer.how, href: routeMap.how },
    { label: copy.footer.features, href: routeMap.features },
    { label: copy.footer.pricing, href: routeMap.pricing },
    { label: createTranslator(locale)('nav.gallery'), href: routeMap.gallery },
    { label: copy.footer.faq, href: routeMap.faq },
    { label: copy.footer.contact, href: routeMap.contact },
  ];
}

const placementGroupLabels: Record<Locale, Record<string, string>> = {
  en: { front: 'Front', back: 'Back', sleeves: 'Sleeves' },
  de: { front: 'Vorne', back: 'Rücken', sleeves: 'Ärmel' },
  fr: { front: 'Devant', back: 'Dos', sleeves: 'Manches' },
  ar: { front: 'الأمام', back: 'الخلف', sleeves: 'الأكمام' },
  es: { front: 'Frente', back: 'Espalda', sleeves: 'Mangas' },
  ru: { front: 'Перед', back: 'Спина', sleeves: 'Рукава' },
};

const placementZoneLabels: Record<Locale, Record<string, string>> = {
  en: {
    left_chest: 'Left chest',
    right_chest: 'Right chest',
    center_chest: 'Center chest',
    center_front: 'Center front',
    lower_front: 'Lower front',
    front_left_bottom: 'Front left bottom',
    front_right_bottom: 'Front right bottom',
    upper_back: 'Upper back',
    center_back: 'Center back',
    lower_back: 'Lower back',
    back_left_shoulder: 'Back left shoulder',
    back_right_shoulder: 'Back right shoulder',
    back_left_bottom: 'Back left bottom',
    back_right_bottom: 'Back right bottom',
    left_sleeve: 'Left sleeve',
    right_sleeve: 'Right sleeve',
  },
  de: {
    left_chest: 'Linke Brust',
    right_chest: 'Rechte Brust',
    center_chest: 'Mitte Brust',
    center_front: 'Vorne mittig',
    lower_front: 'Vorne unten',
    front_left_bottom: 'Vorne links unten',
    front_right_bottom: 'Vorne rechts unten',
    upper_back: 'Oberer Rücken',
    center_back: 'Rücken mittig',
    lower_back: 'Rücken unten',
    back_left_shoulder: 'Linke Schulter hinten',
    back_right_shoulder: 'Rechte Schulter hinten',
    back_left_bottom: 'Hinten links unten',
    back_right_bottom: 'Hinten rechts unten',
    left_sleeve: 'Linker Ärmel',
    right_sleeve: 'Rechter Ärmel',
  },
  fr: {
    left_chest: 'Poitrine gauche',
    right_chest: 'Poitrine droite',
    center_chest: 'Centre poitrine',
    center_front: 'Devant centré',
    lower_front: 'Bas devant',
    front_left_bottom: 'Bas gauche devant',
    front_right_bottom: 'Bas droit devant',
    upper_back: 'Haut du dos',
    center_back: 'Centre dos',
    lower_back: 'Bas du dos',
    back_left_shoulder: 'Épaule gauche dos',
    back_right_shoulder: 'Épaule droite dos',
    back_left_bottom: 'Bas gauche dos',
    back_right_bottom: 'Bas droit dos',
    left_sleeve: 'Manche gauche',
    right_sleeve: 'Manche droite',
  },
  ar: {
    left_chest: 'الصدر الأيسر',
    right_chest: 'الصدر الأيمن',
    center_chest: 'منتصف الصدر',
    center_front: 'منتصف الأمام',
    lower_front: 'أسفل الأمام',
    front_left_bottom: 'أسفل الأمام يساراً',
    front_right_bottom: 'أسفل الأمام يميناً',
    upper_back: 'أعلى الظهر',
    center_back: 'منتصف الظهر',
    lower_back: 'أسفل الظهر',
    back_left_shoulder: 'الكتف الأيسر خلفاً',
    back_right_shoulder: 'الكتف الأيمن خلفاً',
    back_left_bottom: 'أسفل الخلف يساراً',
    back_right_bottom: 'أسفل الخلف يميناً',
    left_sleeve: 'الكم الأيسر',
    right_sleeve: 'الكم الأيمن',
  },
  es: {
    left_chest: 'Pecho izquierdo',
    right_chest: 'Pecho derecho',
    center_chest: 'Centro del pecho',
    center_front: 'Frente centrado',
    lower_front: 'Frente inferior',
    front_left_bottom: 'Inferior izquierdo frontal',
    front_right_bottom: 'Inferior derecho frontal',
    upper_back: 'Espalda superior',
    center_back: 'Centro espalda',
    lower_back: 'Espalda inferior',
    back_left_shoulder: 'Hombro izquierdo atrás',
    back_right_shoulder: 'Hombro derecho atrás',
    back_left_bottom: 'Inferior izquierdo atrás',
    back_right_bottom: 'Inferior derecho atrás',
    left_sleeve: 'Manga izquierda',
    right_sleeve: 'Manga derecha',
  },
  ru: {
    left_chest: 'Слева на груди',
    right_chest: 'Справа на груди',
    center_chest: 'Центр груди',
    center_front: 'Центр спереди',
    lower_front: 'Низ спереди',
    front_left_bottom: 'Снизу слева спереди',
    front_right_bottom: 'Снизу справа спереди',
    upper_back: 'Верх спины',
    center_back: 'Центр спины',
    lower_back: 'Низ спины',
    back_left_shoulder: 'Левое плечо сзади',
    back_right_shoulder: 'Правое плечо сзади',
    back_left_bottom: 'Снизу слева сзади',
    back_right_bottom: 'Снизу справа сзади',
    left_sleeve: 'Левый рукав',
    right_sleeve: 'Правый рукав',
  },
};

export function getLocalizedPlacementGroupLabel(
  locale: Locale,
  groupId: string,
  fallback: string
) {
  return placementGroupLabels[locale]?.[groupId] ?? fallback;
}

export function getLocalizedPlacementZoneLabel(
  locale: Locale,
  zoneId: string,
  fallback: string
) {
  return placementZoneLabels[locale]?.[zoneId] ?? fallback;
}

function infoPageMetadata(
  title: string,
  description: string
): MobileInfoPageCopy['metadata'] {
  return { title, description };
}

const infoPages: Record<Locale, Record<MobileInfoPageKey, MobileInfoPageCopy>> = {
  en: {
    explore: {
      eyebrow: 'Explore Stitchra',
      title: 'Choose what you want to know.',
      description:
        'A compact mobile hub for the Stitchra workflow, pricing, features and common questions.',
      metadata: infoPageMetadata(
        'Explore Stitchra | AI Embroidery Studio',
        'Explore how Stitchra helps you create or upload artwork, preview embroidery placement and request a clear quote.'
      ),
      cards: [
        { title: 'How it works', text: 'Create or upload, review, place, price and request.', href: '/how-it-works', cta: 'View workflow' },
        { title: 'Features', text: 'AI concepts, background cleanup, shirt preview and draft recovery.', href: '/features', cta: 'See features' },
        { title: 'Pricing', text: 'Small designs from €9, larger front designs from €13. Final offer before production.', href: '/pricing', cta: 'Understand pricing' },
        { title: 'Gallery', text: 'Example placements and design directions for clubs, creators, events and brands.', href: '/gallery', cta: 'Browse ideas' },
        { title: 'FAQ', text: 'Answers about files, rights, payment timing and one-shirt orders.', href: '/faq', cta: 'Read FAQ' },
        { title: 'Contact', text: 'Need help with a logo or quote request? Reach the Stitchra team.', href: '/contact', cta: 'Contact support' },
      ],
    },
    how: {
      eyebrow: 'How it works',
      title: 'From idea to quote without guessing.',
      description:
        'Stitchra keeps the design flow guided: add artwork, review it clearly, place it on fabric and request a final offer.',
      metadata: infoPageMetadata(
        'How Stitchra Works | AI Embroidery Studio',
        'Learn the Stitchra workflow from design creation to manual review, final offer and production.'
      ),
      cards: [
        { title: '1. Create or upload', text: 'Bring your own logo or describe an original idea for an AI concept.' },
        { title: '2. Review concept', text: 'Check the artwork clearly before using it on the shirt.' },
        { title: '3. Place on fabric', text: 'Choose a preset placement or tap the shirt to place the logo yourself.' },
        { title: '4. Check price', text: 'Get a public estimate based on placement, size, color count and artwork detail.' },
        { title: '5. Request offer', text: 'Stitchra manually reviews the design and sends the final offer before production.' },
      ],
    },
    features: {
      eyebrow: 'Features',
      title: 'Built for practical embroidery decisions.',
      description:
        'The mobile studio focuses on the actions customers actually need before requesting a quote.',
      metadata: infoPageMetadata(
        'Features | Stitchra',
        'Stitchra features for AI concept creation, logo upload, background cleanup, shirt preview and quote requests.'
      ),
      cards: [
        { title: 'AI concept studio', text: 'Generate original embroidery-friendly concepts and review them before placing them on the shirt.' },
        { title: 'Bring your own design', text: 'Upload PNG, JPG or SVG and preview it directly on the T-shirt.' },
        { title: 'Background cleanup', text: 'Remove simple backgrounds locally before using a logo on dark or light fabric.' },
        { title: 'Fabric preview', text: 'Choose black or white tee, placement, custom position and logo size.' },
        { title: 'Draft recovery', text: 'Your mobile design draft can survive an accidental refresh.' },
      ],
    },
    pricing: {
      eyebrow: 'Pricing',
      title: 'Clear estimates before stitching.',
      description:
        'Stitchra does not fake certainty for complex artwork. Uploading or generating a concept helps estimate real embroidery complexity.',
      metadata: infoPageMetadata(
        'Pricing | Stitchra',
        'Understand Stitchra embroidery pricing factors and how quote requests are reviewed before production.'
      ),
      cards: [
        { title: 'Small logo', text: 'Simple left-chest designs can start around €9.', bullets: ['Clean marks', 'Club logos', 'Small badges'] },
        { title: 'Front design', text: 'Larger front designs can start around €13.', bullets: ['More coverage', 'More stitch time', 'Bigger visual impact'] },
        { title: 'Price factors', text: 'Final pricing depends on placement, logo size, colors, stitch detail, coverage and quantity.' },
        { title: 'Studio review', text: 'Manual review is quality control. The final offer is confirmed before production.' },
      ],
    },
    gallery: {
      eyebrow: 'Gallery',
      title: 'Placement ideas for real shirts.',
      description:
        'Use these directions as starting points, then place your own logo or AI concept in the studio.',
      metadata: infoPageMetadata(
        'Gallery | Stitchra',
        'Explore Stitchra embroidery placement ideas for badges, brand marks, events and creator shirts.'
      ),
      cards: [
        { title: 'Left chest badge', text: 'A premium small logo placement for clubs, teams and brand marks.' },
        { title: 'Center chest mark', text: 'Balanced placement for readable logos and event graphics.' },
        { title: 'Large front artwork', text: 'A stronger visual direction for creator drops and statement designs.' },
        { title: 'Lower front detail', text: 'Streetwear-inspired placement for subtle branding.' },
      ],
    },
    faq: {
      eyebrow: 'FAQ',
      title: 'Answers before you order.',
      description: 'A short guide to the most common Stitchra questions.',
      metadata: infoPageMetadata(
        'FAQ | Stitchra',
        'Answers about Stitchra logo uploads, AI concepts, quote requests, payment timing and design rights.'
      ),
      cards: [
        { title: 'Can I order one T-shirt?', text: 'Yes. You can request a quote for one shirt or a small batch.' },
        { title: 'When do I pay?', text: 'Payment happens later after Stitchra reviews your design and sends a final offer.' },
        { title: 'Can I use a brand logo?', text: 'Only upload logos or artwork you own or have permission to use. Risky designs may be rejected.' },
        { title: 'Are AI concepts final stitch files?', text: 'No. AI concepts are previews. Stitchra reviews final stitch-ready artwork before production.' },
        { title: 'What files can I upload?', text: 'PNG, JPG and SVG files are supported for the public design preview.' },
      ],
    },
    contact: {
      eyebrow: 'Contact',
      title: 'Need help with a design?',
      description:
        'Contact Stitchra for quote, logo, order or technical questions. Include your order reference if you have one.',
      metadata: infoPageMetadata('Contact | Stitchra', 'Contact Stitchra for quote and order support.'),
      cards: [
        { title: 'Order support', text: 'For order, logo, quote or technical questions, email orders@stitchra.com.', cta: 'orders@stitchra.com' },
        { title: 'Design help', text: 'Send a short description of the logo or embroidery placement you need help with.' },
        { title: 'Privacy requests', text: 'For data protection requests, use the privacy contact listed in the legal pages.' },
      ],
    },
  },
  de: {
    explore: {
      eyebrow: 'Stitchra entdecken',
      title: 'Wähle, was du wissen möchtest.',
      description: 'Ein kompakter mobiler Hub für Ablauf, Preise, Funktionen und häufige Fragen.',
      metadata: infoPageMetadata('Stitchra entdecken | KI-Stickerei-Studio', 'Entdecke, wie Stitchra Motive erstellt, platziert und klare Angebote ermöglicht.'),
      cards: [
        { title: 'So funktioniert es', text: 'Erstellen oder hochladen, prüfen, platzieren, Preis holen und anfragen.', href: '/how-it-works', cta: 'Ablauf ansehen' },
        { title: 'Funktionen', text: 'KI-Konzepte, Hintergrund-Bereinigung, Shirtvorschau und Entwurfsrettung.', href: '/features', cta: 'Funktionen ansehen' },
        { title: 'Preise', text: 'Kleine Designs ab €9, größere Frontdesigns ab €13. Finales Angebot vor Produktion.', href: '/pricing', cta: 'Preise verstehen' },
        { title: 'Galerie', text: 'Beispiele für Platzierungen und Designrichtungen für Clubs, Creator und Events.', href: '/gallery', cta: 'Ideen ansehen' },
        { title: 'FAQ', text: 'Antworten zu Dateien, Rechten, Zahlung und Einzelshirts.', href: '/faq', cta: 'FAQ lesen' },
        { title: 'Kontakt', text: 'Hilfe bei Logo oder Anfrage? Kontaktiere das Stitchra-Team.', href: '/contact', cta: 'Support kontaktieren' },
      ],
    },
    how: {
      eyebrow: 'So funktioniert es',
      title: 'Von der Idee zum Angebot ohne Rätselraten.',
      description: 'Stitchra führt dich: Motiv hinzufügen, klar prüfen, auf Stoff platzieren und finales Angebot anfragen.',
      metadata: infoPageMetadata('So funktioniert Stitchra | KI-Stickerei-Studio', 'Lerne den Stitchra-Ablauf von Design bis Angebot und Produktion.'),
      cards: [
        { title: '1. Erstellen oder hochladen', text: 'Lade dein Logo hoch oder beschreibe eine originelle Idee für ein KI-Konzept.' },
        { title: '2. Konzept prüfen', text: 'Prüfe das Motiv klar, bevor du es auf dem Shirt nutzt.' },
        { title: '3. Auf Stoff platzieren', text: 'Wähle eine Platzierung oder tippe selbst auf das Shirt.' },
        { title: '4. Preis prüfen', text: 'Erhalte eine öffentliche Schätzung nach Platzierung, Größe, Farben und Detail.' },
        { title: '5. Angebot anfragen', text: 'Stitchra prüft manuell und sendet das finale Angebot vor Produktion.' },
      ],
    },
    features: {
      eyebrow: 'Funktionen',
      title: 'Für praktische Stickentscheidungen gebaut.',
      description: 'Das mobile Studio konzentriert sich auf die Schritte, die Kunden vor einer Anfrage wirklich brauchen.',
      metadata: infoPageMetadata('Funktionen | Stitchra', 'Funktionen für KI-Konzepte, Logo-Upload, Bereinigung, Vorschau und Anfrage.'),
      cards: [
        { title: 'KI Concept Studio', text: 'Erstelle originelle stickfreundliche Konzepte und prüfe sie vor der Platzierung.' },
        { title: 'Eigenes Design', text: 'Lade PNG, JPG oder SVG hoch und prüfe es direkt auf dem T-Shirt.' },
        { title: 'Hintergrund-Bereinigung', text: 'Entferne einfache Hintergründe lokal für dunkle oder helle Stoffe.' },
        { title: 'Stoffvorschau', text: 'Wähle schwarzes oder weißes Shirt, Platzierung, Position und Größe.' },
        { title: 'Entwurfsrettung', text: 'Dein mobiler Entwurf kann einen versehentlichen Refresh überleben.' },
      ],
    },
    pricing: {
      eyebrow: 'Preise',
      title: 'Klare Schätzungen vor dem Sticken.',
      description: 'Stitchra täuscht bei komplexen Motiven keine Sicherheit vor. Upload oder KI-Konzept helfen, echte Stickkomplexität einzuschätzen.',
      metadata: infoPageMetadata('Preise | Stitchra', 'Verstehe Preisfaktoren und manuelle Angebotsprüfung vor Produktion.'),
      cards: [
        { title: 'Kleines Logo', text: 'Einfache linke Brustdesigns können ab etwa €9 starten.', bullets: ['Klare Marken', 'Clublogos', 'Kleine Badges'] },
        { title: 'Frontdesign', text: 'Größere Frontdesigns können ab etwa €13 starten.', bullets: ['Mehr Abdeckung', 'Mehr Stickzeit', 'Stärkere Wirkung'] },
        { title: 'Preisfaktoren', text: 'Finale Preise hängen von Platzierung, Größe, Farben, Detail, Abdeckung und Menge ab.' },
        { title: 'Studio-Prüfung', text: 'Manuelle Prüfung ist Qualitätskontrolle. Das finale Angebot wird vor Produktion bestätigt.' },
      ],
    },
    gallery: {
      eyebrow: 'Galerie',
      title: 'Platzierungsideen für echte Shirts.',
      description: 'Nutze diese Richtungen als Startpunkt und platziere dann dein Logo oder KI-Konzept im Studio.',
      metadata: infoPageMetadata('Galerie | Stitchra', 'Stitchra Platzierungsideen für Badges, Marken, Events und Creator-Shirts.'),
      cards: [
        { title: 'Linke Brust-Badge', text: 'Premium-Kleinplatzierung für Clubs, Teams und Marken.' },
        { title: 'Mittige Brustmarke', text: 'Ausgewogen für gut lesbare Logos und Eventgrafiken.' },
        { title: 'Großes Frontmotiv', text: 'Stärkere visuelle Richtung für Creator-Drops und Statement-Designs.' },
        { title: 'Unteres Frontdetail', text: 'Streetwear-inspirierte Platzierung für dezentes Branding.' },
      ],
    },
    faq: {
      eyebrow: 'FAQ',
      title: 'Antworten vor der Bestellung.',
      description: 'Ein kurzer Guide zu den häufigsten Stitchra-Fragen.',
      metadata: infoPageMetadata('FAQ | Stitchra', 'Antworten zu Uploads, KI-Konzepten, Angeboten, Zahlung und Rechten.'),
      cards: [
        { title: 'Kann ich ein T-Shirt bestellen?', text: 'Ja. Du kannst ein Angebot für ein Shirt oder eine kleine Serie anfragen.' },
        { title: 'Wann bezahle ich?', text: 'Die Zahlung erfolgt später, nachdem Stitchra dein Design geprüft und ein finales Angebot gesendet hat.' },
        { title: 'Kann ich ein Markenlogo nutzen?', text: 'Nur Logos oder Motive hochladen, die dir gehören oder für die du Rechte hast.' },
        { title: 'Sind KI-Konzepte finale Stickdateien?', text: 'Nein. KI-Konzepte sind Vorschauen. Stitchra prüft das finale stickfertige Motiv.' },
        { title: 'Welche Dateien kann ich hochladen?', text: 'PNG, JPG und SVG werden für die öffentliche Vorschau unterstützt.' },
      ],
    },
    contact: {
      eyebrow: 'Kontakt',
      title: 'Brauchst du Hilfe beim Design?',
      description: 'Kontaktiere Stitchra bei Fragen zu Angebot, Logo, Bestellung oder Technik.',
      metadata: infoPageMetadata('Kontakt | Stitchra', 'Kontaktiere Stitchra für Angebote und Bestellsupport.'),
      cards: [
        { title: 'Bestellsupport', text: 'Für Bestellung, Logo, Angebot oder Technik: orders@stitchra.com.', cta: 'orders@stitchra.com' },
        { title: 'Designhilfe', text: 'Sende eine kurze Beschreibung des Logos oder der Platzierung, bei der du Hilfe brauchst.' },
        { title: 'Datenschutzanfragen', text: 'Für Datenschutzanfragen nutze den Kontakt in den Rechtstexten.' },
      ],
    },
  },
  fr: {} as Record<MobileInfoPageKey, MobileInfoPageCopy>,
  ar: {} as Record<MobileInfoPageKey, MobileInfoPageCopy>,
  es: {} as Record<MobileInfoPageKey, MobileInfoPageCopy>,
  ru: {} as Record<MobileInfoPageKey, MobileInfoPageCopy>,
};

infoPages.fr = {
  explore: { ...infoPages.en.explore, eyebrow: 'Explorer Stitchra', title: 'Choisissez ce que vous voulez savoir.', description: 'Un hub mobile compact pour le flux, les prix, les fonctions et les questions.', cards: [
    { title: 'Fonctionnement', text: 'Créer ou importer, vérifier, placer, obtenir un prix et demander.', href: '/how-it-works', cta: 'Voir le flux' },
    { title: 'Fonctions', text: 'Concepts IA, nettoyage du fond, aperçu T-shirt et récupération de brouillon.', href: '/features', cta: 'Voir les fonctions' },
    { title: 'Prix', text: 'Petits designs dès 9 €, grands visuels devant dès 13 €. Offre finale avant production.', href: '/pricing', cta: 'Comprendre les prix' },
    { title: 'Galerie', text: 'Exemples de placements et directions pour clubs, créateurs, événements et marques.', href: '/gallery', cta: 'Voir les idées' },
    { title: 'FAQ', text: 'Réponses sur fichiers, droits, paiement et commandes d’un T-shirt.', href: '/faq', cta: 'Lire la FAQ' },
    { title: 'Contact', text: 'Besoin d’aide pour un logo ou devis ? Contactez Stitchra.', href: '/contact', cta: 'Contacter le support' },
  ] },
  how: { ...infoPages.en.how, eyebrow: 'Fonctionnement', title: 'De l’idée au devis sans deviner.', description: 'Stitchra guide le flux : ajoutez le visuel, vérifiez-le, placez-le sur tissu et demandez une offre finale.', cards: [
    { title: '1. Créer ou importer', text: 'Importez votre logo ou décrivez une idée originale pour un concept IA.' },
    { title: '2. Vérifier le concept', text: 'Contrôlez le visuel clairement avant de l’utiliser sur le T-shirt.' },
    { title: '3. Placer sur tissu', text: 'Choisissez un placement ou touchez le T-shirt vous-même.' },
    { title: '4. Vérifier le prix', text: 'Obtenez une estimation selon placement, taille, couleurs et détail.' },
    { title: '5. Demander une offre', text: 'Stitchra vérifie manuellement et envoie l’offre finale avant production.' },
  ] },
  features: { ...infoPages.en.features, eyebrow: 'Fonctions', title: 'Conçu pour décider la broderie concrètement.', description: 'Le studio mobile se concentre sur les actions utiles avant une demande de devis.', cards: [
    { title: 'Studio de concept IA', text: 'Générez des concepts originaux adaptés à la broderie et vérifiez-les avant placement.' },
    { title: 'Votre propre design', text: 'Importez PNG, JPG ou SVG et prévisualisez directement sur le T-shirt.' },
    { title: 'Nettoyage du fond', text: 'Retirez les fonds simples localement avant usage sur tissu sombre ou clair.' },
    { title: 'Aperçu tissu', text: 'Choisissez T-shirt noir ou blanc, placement, position et taille.' },
    { title: 'Récupération', text: 'Votre brouillon mobile peut survivre à un rafraîchissement accidentel.' },
  ] },
  pricing: { ...infoPages.en.pricing, eyebrow: 'Prix', title: 'Estimations claires avant la broderie.', description: 'Stitchra ne promet pas une certitude fausse pour les visuels complexes.', cards: [
    { title: 'Petit logo', text: 'Les placements simples côté cœur peuvent commencer autour de 9 €.', bullets: ['Marques nettes', 'Logos de club', 'Petits badges'] },
    { title: 'Design devant', text: 'Les grands visuels devant peuvent commencer autour de 13 €.', bullets: ['Plus de couverture', 'Plus de temps de broderie', 'Impact visuel plus fort'] },
    { title: 'Facteurs de prix', text: 'Le prix final dépend du placement, de la taille, des couleurs, du détail, de la couverture et de la quantité.' },
    { title: 'Revue studio', text: 'La revue manuelle est un contrôle qualité. L’offre finale est confirmée avant production.' },
  ] },
  gallery: { ...infoPages.en.gallery, eyebrow: 'Galerie', title: 'Idées de placement pour vrais T-shirts.', description: 'Utilisez ces directions comme point de départ, puis placez votre logo ou concept IA.', cards: [
    { title: 'Badge côté cœur', text: 'Un petit placement premium pour clubs, équipes et marques.' },
    { title: 'Marque au centre', text: 'Placement équilibré pour logos lisibles et graphismes événementiels.' },
    { title: 'Grand visuel devant', text: 'Direction plus forte pour drops créateur et designs statement.' },
    { title: 'Détail bas devant', text: 'Placement inspiré streetwear pour branding discret.' },
  ] },
  faq: { ...infoPages.en.faq, eyebrow: 'FAQ', title: 'Réponses avant de commander.', description: 'Un guide court des questions Stitchra courantes.', cards: [
    { title: 'Puis-je commander un T-shirt ?', text: 'Oui. Vous pouvez demander un devis pour un T-shirt ou une petite série.' },
    { title: 'Quand payer ?', text: 'Le paiement arrive après la revue de votre design et l’offre finale.' },
    { title: 'Puis-je utiliser un logo de marque ?', text: 'Seulement des logos ou visuels que vous possédez ou avez le droit d’utiliser.' },
    { title: 'Les concepts IA sont-ils des fichiers finaux ?', text: 'Non. Ce sont des aperçus. Stitchra vérifie le fichier final prêt à broder.' },
    { title: 'Quels fichiers importer ?', text: 'PNG, JPG et SVG sont pris en charge pour l’aperçu public.' },
  ] },
  contact: { ...infoPages.en.contact, eyebrow: 'Contact', title: 'Besoin d’aide avec un design ?', description: 'Contactez Stitchra pour les questions de devis, logo, commande ou technique.', cards: [
    { title: 'Support commande', text: 'Pour commande, logo, devis ou technique : orders@stitchra.com.', cta: 'orders@stitchra.com' },
    { title: 'Aide design', text: 'Envoyez une courte description du logo ou placement souhaité.' },
    { title: 'Demandes de confidentialité', text: 'Pour les demandes de protection des données, utilisez le contact des pages légales.' },
  ] },
};

infoPages.ar = {
  explore: { ...infoPages.en.explore, eyebrow: 'استكشف Stitchra', title: 'اختر ما تريد معرفته.', description: 'مركز مختصر للهاتف يشرح سير العمل والأسعار والمزايا والأسئلة.', cards: [
    { title: 'طريقة العمل', text: 'أنشئ أو ارفع، راجع، ضع، احصل على سعر ثم أرسل الطلب.', href: '/how-it-works', cta: 'اعرض الخطوات' },
    { title: 'المزايا', text: 'تصورات AI، تنظيف الخلفية، معاينة القميص واستعادة المسودة.', href: '/features', cta: 'شاهد المزايا' },
    { title: 'الأسعار', text: 'تصاميم صغيرة من €9 وتصاميم أمامية أكبر من €13. العرض النهائي قبل الإنتاج.', href: '/pricing', cta: 'افهم الأسعار' },
    { title: 'المعرض', text: 'أمثلة للمواضع واتجاهات التصميم للأندية والمبدعين والفعاليات.', href: '/gallery', cta: 'تصفح الأفكار' },
    { title: 'الأسئلة', text: 'إجابات عن الملفات والحقوق ووقت الدفع وطلب قميص واحد.', href: '/faq', cta: 'اقرأ الأسئلة' },
    { title: 'تواصل', text: 'تحتاج مساعدة في شعار أو عرض سعر؟ تواصل مع فريق Stitchra.', href: '/contact', cta: 'تواصل مع الدعم' },
  ] },
  how: { ...infoPages.en.how, eyebrow: 'طريقة العمل', title: 'من الفكرة إلى العرض دون تخمين.', description: 'يوجهك Stitchra: أضف التصميم، راجعه بوضوح، ضعه على القماش واطلب عرضاً نهائياً.', cards: [
    { title: '١. أنشئ أو ارفع', text: 'ارفع شعارك أو صف فكرة أصلية لتصور بالذكاء الاصطناعي.' },
    { title: '٢. راجع التصور', text: 'افحص العمل الفني بوضوح قبل استخدامه على القميص.' },
    { title: '٣. ضعه على القماش', text: 'اختر موضعاً جاهزاً أو اضغط على القميص لوضع الشعار بنفسك.' },
    { title: '٤. افحص السعر', text: 'احصل على تقدير عام بناءً على الموضع والحجم والألوان والتفاصيل.' },
    { title: '٥. اطلب العرض', text: 'يراجع Stitchra التصميم يدوياً ويرسل العرض النهائي قبل الإنتاج.' },
  ] },
  features: { ...infoPages.en.features, eyebrow: 'المزايا', title: 'مصمم لقرارات تطريز عملية.', description: 'يركز الاستوديو على الخطوات التي يحتاجها العميل قبل طلب السعر.', cards: [
    { title: 'استوديو تصور AI', text: 'أنشئ تصورات أصلية مناسبة للتطريز وراجعها قبل وضعها على القميص.' },
    { title: 'أحضر تصميمك', text: 'ارفع PNG أو JPG أو SVG وعاينه مباشرة على القميص.' },
    { title: 'تنظيف الخلفية', text: 'أزل الخلفيات البسيطة محلياً قبل استخدام الشعار على قماش داكن أو فاتح.' },
    { title: 'معاينة القماش', text: 'اختر قميصاً أسود أو أبيض والموضع والحجم.' },
    { title: 'استعادة المسودة', text: 'يمكن لمسودة الهاتف أن تبقى بعد تحديث الصفحة بالخطأ.' },
  ] },
  pricing: { ...infoPages.en.pricing, eyebrow: 'الأسعار', title: 'تقديرات واضحة قبل التطريز.', description: 'لا يدّعي Stitchra اليقين للتصاميم المعقدة. الرفع أو التصور يساعدان في تقدير التعقيد.', cards: [
    { title: 'شعار صغير', text: 'تصاميم الصدر البسيطة قد تبدأ من حوالي €9.', bullets: ['علامات واضحة', 'شعارات أندية', 'شارات صغيرة'] },
    { title: 'تصميم أمامي', text: 'التصاميم الأمامية الأكبر قد تبدأ من حوالي €13.', bullets: ['تغطية أكبر', 'وقت تطريز أكثر', 'تأثير بصري أقوى'] },
    { title: 'عوامل السعر', text: 'يعتمد السعر النهائي على الموضع والحجم والألوان والتفاصيل والتغطية والكمية.' },
    { title: 'مراجعة الاستوديو', text: 'المراجعة اليدوية هي ضبط جودة. يؤكد العرض النهائي قبل الإنتاج.' },
  ] },
  gallery: { ...infoPages.en.gallery, eyebrow: 'المعرض', title: 'أفكار مواضع لقمصان حقيقية.', description: 'استخدم هذه الاتجاهات كبداية، ثم ضع شعارك أو تصور AI في الاستوديو.', cards: [
    { title: 'شارة على الصدر', text: 'موضع صغير فاخر للأندية والفرق والعلامات.' },
    { title: 'علامة وسط الصدر', text: 'موضع متوازن للشعارات المقروءة ورسومات الفعاليات.' },
    { title: 'تصميم أمامي كبير', text: 'اتجاه بصري أقوى لإصدارات المبدعين والتصاميم الجريئة.' },
    { title: 'تفصيل سفلي أمامي', text: 'موضع مستوحى من الستريت وير لعلامة هادئة.' },
  ] },
  faq: { ...infoPages.en.faq, eyebrow: 'الأسئلة', title: 'إجابات قبل الطلب.', description: 'دليل قصير لأكثر أسئلة Stitchra شيوعاً.', cards: [
    { title: 'هل أستطيع طلب قميص واحد؟', text: 'نعم. يمكنك طلب عرض لقميص واحد أو دفعة صغيرة.' },
    { title: 'متى أدفع؟', text: 'يحدث الدفع لاحقاً بعد مراجعة Stitchra لتصميمك وإرسال العرض النهائي.' },
    { title: 'هل أستطيع استخدام شعار علامة تجارية؟', text: 'ارفع فقط الشعارات أو الأعمال التي تملكها أو لديك إذن لاستخدامها.' },
    { title: 'هل تصورات AI ملفات تطريز نهائية؟', text: 'لا. هي معاينات فقط. يراجع Stitchra الملف النهائي قبل الإنتاج.' },
    { title: 'ما الملفات المدعومة؟', text: 'PNG وJPG وSVG مدعومة للمعاينة العامة.' },
  ] },
  contact: { ...infoPages.en.contact, eyebrow: 'تواصل', title: 'تحتاج مساعدة في التصميم؟', description: 'تواصل مع Stitchra لأسئلة العرض أو الشعار أو الطلب أو التقنية.', cards: [
    { title: 'دعم الطلبات', text: 'للطلبات والشعارات والعروض والأسئلة التقنية: orders@stitchra.com.', cta: 'orders@stitchra.com' },
    { title: 'مساعدة التصميم', text: 'أرسل وصفاً قصيراً للشعار أو موضع التطريز الذي تحتاج مساعدة فيه.' },
    { title: 'طلبات الخصوصية', text: 'لطلبات حماية البيانات استخدم جهة الاتصال المذكورة في الصفحات القانونية.' },
  ] },
};

infoPages.es = {
  explore: { ...infoPages.en.explore, eyebrow: 'Explorar Stitchra', title: 'Elige qué quieres saber.', description: 'Un hub móvil compacto para flujo, precios, funciones y preguntas.', cards: [
    { title: 'Cómo funciona', text: 'Crea o sube, revisa, coloca, calcula precio y solicita.', href: '/how-it-works', cta: 'Ver flujo' },
    { title: 'Funciones', text: 'Conceptos IA, limpieza de fondo, vista de camiseta y recuperación de borrador.', href: '/features', cta: 'Ver funciones' },
    { title: 'Precios', text: 'Diseños pequeños desde €9, frontales grandes desde €13. Oferta final antes de producción.', href: '/pricing', cta: 'Entender precios' },
    { title: 'Galería', text: 'Ejemplos de ubicación e ideas para clubes, creadores, eventos y marcas.', href: '/gallery', cta: 'Ver ideas' },
    { title: 'FAQ', text: 'Respuestas sobre archivos, derechos, pago y pedidos de una camiseta.', href: '/faq', cta: 'Leer FAQ' },
    { title: 'Contacto', text: '¿Necesitas ayuda con un logo o presupuesto? Contacta con Stitchra.', href: '/contact', cta: 'Contactar soporte' },
  ] },
  how: { ...infoPages.en.how, eyebrow: 'Cómo funciona', title: 'De idea a presupuesto sin adivinar.', description: 'Stitchra guía el flujo: añade arte, revísalo, colócalo en tela y solicita una oferta final.', cards: [
    { title: '1. Crear o subir', text: 'Sube tu logo o describe una idea original para un concepto IA.' },
    { title: '2. Revisar concepto', text: 'Comprueba el arte claramente antes de usarlo en la camiseta.' },
    { title: '3. Colocar en tela', text: 'Elige un preajuste o toca la camiseta para colocar el logo.' },
    { title: '4. Revisar precio', text: 'Obtén una estimación según ubicación, tamaño, colores y detalle.' },
    { title: '5. Solicitar oferta', text: 'Stitchra revisa manualmente y envía la oferta final antes de producción.' },
  ] },
  features: { ...infoPages.en.features, eyebrow: 'Funciones', title: 'Creado para decisiones reales de bordado.', description: 'El estudio móvil se centra en lo que el cliente necesita antes del presupuesto.', cards: [
    { title: 'Estudio de concepto IA', text: 'Genera conceptos originales aptos para bordado y revísalos antes de colocarlos.' },
    { title: 'Trae tu diseño', text: 'Sube PNG, JPG o SVG y prévisualízalo directamente en la camiseta.' },
    { title: 'Limpieza de fondo', text: 'Quita fondos simples localmente antes de usar el logo en tela oscura o clara.' },
    { title: 'Vista en tela', text: 'Elige camiseta negra o blanca, ubicación, posición y tamaño.' },
    { title: 'Recuperación de borrador', text: 'Tu borrador móvil puede sobrevivir un refresco accidental.' },
  ] },
  pricing: { ...infoPages.en.pricing, eyebrow: 'Precios', title: 'Estimaciones claras antes de bordar.', description: 'Stitchra no finge certeza en arte complejo. Subir o generar ayuda a estimar la complejidad real.', cards: [
    { title: 'Logo pequeño', text: 'Diseños simples en pecho izquierdo pueden empezar cerca de €9.', bullets: ['Marcas limpias', 'Logos de club', 'Insignias pequeñas'] },
    { title: 'Diseño frontal', text: 'Diseños frontales grandes pueden empezar cerca de €13.', bullets: ['Más cobertura', 'Más tiempo de bordado', 'Mayor impacto visual'] },
    { title: 'Factores de precio', text: 'El precio final depende de ubicación, tamaño, colores, detalle, cobertura y cantidad.' },
    { title: 'Revisión del estudio', text: 'La revisión manual es control de calidad. La oferta final se confirma antes de producción.' },
  ] },
  gallery: { ...infoPages.en.gallery, eyebrow: 'Galería', title: 'Ideas de ubicación para camisetas reales.', description: 'Usa estas direcciones como punto de partida y luego coloca tu logo o concepto IA.', cards: [
    { title: 'Insignia pecho izquierdo', text: 'Un pequeño lugar premium para clubes, equipos y marcas.' },
    { title: 'Marca centro pecho', text: 'Ubicación equilibrada para logos legibles y gráficos de evento.' },
    { title: 'Arte frontal grande', text: 'Dirección más fuerte para drops de creadores y diseños statement.' },
    { title: 'Detalle frontal bajo', text: 'Ubicación inspirada en streetwear para branding sutil.' },
  ] },
  faq: { ...infoPages.en.faq, eyebrow: 'FAQ', title: 'Respuestas antes de pedir.', description: 'Guía corta con las preguntas más comunes de Stitchra.', cards: [
    { title: '¿Puedo pedir una camiseta?', text: 'Sí. Puedes solicitar presupuesto para una camiseta o un lote pequeño.' },
    { title: '¿Cuándo pago?', text: 'El pago ocurre después de que Stitchra revise el diseño y envíe la oferta final.' },
    { title: '¿Puedo usar un logo de marca?', text: 'Solo sube logos o arte que poseas o tengas permiso para usar.' },
    { title: '¿Los conceptos IA son archivos finales?', text: 'No. Son vistas previas. Stitchra revisa el archivo final listo para bordar.' },
    { title: '¿Qué archivos puedo subir?', text: 'PNG, JPG y SVG se admiten para la vista previa pública.' },
  ] },
  contact: { ...infoPages.en.contact, eyebrow: 'Contacto', title: '¿Necesitas ayuda con un diseño?', description: 'Contacta con Stitchra para preguntas de presupuesto, logo, pedido o técnica.', cards: [
    { title: 'Soporte de pedidos', text: 'Para pedidos, logos, presupuestos o técnica: orders@stitchra.com.', cta: 'orders@stitchra.com' },
    { title: 'Ayuda de diseño', text: 'Envía una descripción breve del logo o ubicación que necesitas.' },
    { title: 'Privacidad', text: 'Para solicitudes de protección de datos usa el contacto de las páginas legales.' },
  ] },
};

infoPages.ru = {
  explore: { ...infoPages.en.explore, eyebrow: 'Изучить Stitchra', title: 'Выберите, что узнать.', description: 'Краткий мобильный центр про процесс, цены, функции и вопросы.', cards: [
    { title: 'Как это работает', text: 'Создать или загрузить, проверить, разместить, получить цену и отправить запрос.', href: '/how-it-works', cta: 'Посмотреть процесс' },
    { title: 'Возможности', text: 'AI-концепты, очистка фона, предпросмотр футболки и восстановление черновика.', href: '/features', cta: 'Смотреть функции' },
    { title: 'Цены', text: 'Малые дизайны от €9, большие передние от €13. Финальное предложение до производства.', href: '/pricing', cta: 'Понять цены' },
    { title: 'Галерея', text: 'Примеры размещения и направлений для клубов, авторов, событий и брендов.', href: '/gallery', cta: 'Смотреть идеи' },
    { title: 'FAQ', text: 'Ответы о файлах, правах, оплате и заказе одной футболки.', href: '/faq', cta: 'Читать FAQ' },
    { title: 'Контакт', text: 'Нужна помощь с логотипом или расчетом? Свяжитесь со Stitchra.', href: '/contact', cta: 'Связаться' },
  ] },
  how: { ...infoPages.en.how, eyebrow: 'Как это работает', title: 'От идеи до цены без догадок.', description: 'Stitchra ведет процесс: добавьте макет, проверьте, разместите на ткани и запросите финальное предложение.', cards: [
    { title: '1. Создать или загрузить', text: 'Загрузите логотип или опишите оригинальную идею для AI-концепта.' },
    { title: '2. Проверить концепт', text: 'Проверьте макет перед использованием на футболке.' },
    { title: '3. Разместить на ткани', text: 'Выберите пресет или коснитесь футболки, чтобы разместить логотип.' },
    { title: '4. Проверить цену', text: 'Получите оценку по размещению, размеру, цветам и деталям.' },
    { title: '5. Запросить предложение', text: 'Stitchra проверяет дизайн вручную и отправляет финальное предложение.' },
  ] },
  features: { ...infoPages.en.features, eyebrow: 'Возможности', title: 'Для практичных решений по вышивке.', description: 'Мобильная студия показывает только нужные шаги до запроса цены.', cards: [
    { title: 'AI-студия концептов', text: 'Создавайте оригинальные концепты для вышивки и проверяйте их перед размещением.' },
    { title: 'Свой дизайн', text: 'Загрузите PNG, JPG или SVG и посмотрите прямо на футболке.' },
    { title: 'Очистка фона', text: 'Удаляйте простые фоны локально перед использованием на темной или светлой ткани.' },
    { title: 'Предпросмотр ткани', text: 'Выбирайте черную или белую футболку, размещение, позицию и размер.' },
    { title: 'Восстановление черновика', text: 'Мобильный черновик может пережить случайное обновление.' },
  ] },
  pricing: { ...infoPages.en.pricing, eyebrow: 'Цены', title: 'Понятные оценки до вышивки.', description: 'Stitchra не обещает ложную точность для сложных макетов. Загрузка или генерация помогает оценить сложность.', cards: [
    { title: 'Малый логотип', text: 'Простые дизайны на груди могут начинаться примерно от €9.', bullets: ['Чистые знаки', 'Логотипы клубов', 'Малые бейджи'] },
    { title: 'Передний дизайн', text: 'Большие передние дизайны могут начинаться примерно от €13.', bullets: ['Больше покрытия', 'Больше времени вышивки', 'Больше визуальный эффект'] },
    { title: 'Факторы цены', text: 'Финальная цена зависит от размещения, размера, цветов, деталей, покрытия и количества.' },
    { title: 'Проверка студией', text: 'Ручная проверка — это контроль качества. Финальная цена подтверждается до производства.' },
  ] },
  gallery: { ...infoPages.en.gallery, eyebrow: 'Галерея', title: 'Идеи размещения для реальных футболок.', description: 'Используйте эти направления как старт, затем разместите свой логотип или AI-концепт.', cards: [
    { title: 'Бейдж слева на груди', text: 'Премиальное малое размещение для клубов, команд и брендов.' },
    { title: 'Знак по центру груди', text: 'Сбалансированное размещение для читаемых логотипов и событий.' },
    { title: 'Большой передний макет', text: 'Сильное направление для авторских дропов и statement-дизайнов.' },
    { title: 'Нижняя деталь', text: 'Streetwear-размещение для аккуратного брендинга.' },
  ] },
  faq: { ...infoPages.en.faq, eyebrow: 'FAQ', title: 'Ответы до заказа.', description: 'Краткий гид по частым вопросам Stitchra.', cards: [
    { title: 'Можно заказать одну футболку?', text: 'Да. Можно запросить цену на одну футболку или малую партию.' },
    { title: 'Когда платить?', text: 'Оплата позже, после проверки дизайна и финального предложения.' },
    { title: 'Можно использовать логотип бренда?', text: 'Загружайте только логотипы или работы, которыми владеете или имеете право пользоваться.' },
    { title: 'AI-концепты — финальные файлы?', text: 'Нет. Это предпросмотр. Stitchra проверяет финальный файл перед производством.' },
    { title: 'Какие файлы можно загрузить?', text: 'PNG, JPG и SVG поддерживаются для публичного предпросмотра.' },
  ] },
  contact: { ...infoPages.en.contact, eyebrow: 'Контакт', title: 'Нужна помощь с дизайном?', description: 'Свяжитесь со Stitchra по вопросам цены, логотипа, заказа или техники.', cards: [
    { title: 'Поддержка заказов', text: 'По заказам, логотипам, расчетам или технике: orders@stitchra.com.', cta: 'orders@stitchra.com' },
    { title: 'Помощь с дизайном', text: 'Отправьте краткое описание логотипа или размещения.' },
    { title: 'Запросы по приватности', text: 'Для запросов по защите данных используйте контакт на юридических страницах.' },
  ] },
};

export function getMobileInfoPageCopy(
  locale: Locale,
  page: MobileInfoPageKey
): MobileInfoPageCopy {
  return infoPages[locale]?.[page] ?? infoPages[defaultLocale][page];
}
