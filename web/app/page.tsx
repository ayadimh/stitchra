'use client';

import Image from 'next/image';
import type {
  CSSProperties,
  FormEvent,
  ReactNode,
} from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  createTranslator,
  getLocaleDirection,
  getLocalizedArray,
  localeLabels,
  locales,
  resolveLocale,
  type Locale,
  type Translator,
} from '@/lib/i18n';

const API =
  process.env.NEXT_PUBLIC_API_URL ??
  'https://stitchra-production.up.railway.app';

const PRACTICAL_THREAD_COLOR_LIMIT = 15;

const homepageImages = {
  // Temporary launch assets from free commercial-use stock sources. Replace with original Stitchra production photos later.
  heroMain: '/stitchra-hero-embroidery-v5.jpg',
  stitchFinish: '/stitchra-patch-detail-v5.jpg',
  threadDetail: '/stitchra-thread-spools-v5.jpg',
  artworkPreview: '/stitchra-fabric-texture-v5.jpg',
  quietMonogram: '/stitchra-hero-embroidery-v5.jpg',
  streetwearMark: '/stitchra-streetwear-v5.jpg',
  patchBadge: '/stitchra-patch-detail-v5.jpg',
  minimalGraphic: '/stitchra-machine-detail-v5.jpg',
  machineDetail: '/stitchra-machine-detail-v5.jpg',
  fabricTexture: '/stitchra-fabric-texture-v5.jpg',
} as const;

type Estimate = {
  stitches: number;
  colors: number;
  coverage: number;
  price_eur: number | null;
  internal_cost_eur?: number | null;
  estimated_profit_eur?: number | null;
  profit_margin_percent?: number | null;
  manual_quote: boolean;
  pricing_tier: string;
  warnings: string[];
  recommendations: string[];
  public_quote?: PublicQuote;
  internal_quote?: InternalQuote;
  cost_breakdown?: CostBreakdown;
  width_mm: number;
  height_mm: number;
};

type PublicQuote = {
  stitches: number;
  colors: number;
  coverage: number;
  price_eur: number | null;
  manual_quote: boolean;
  pricing_tier: string;
  customer_warnings: string[];
  customer_recommendations: string[];
};

type CostBreakdown = {
  blank_tshirt_eur?: number;
  backing_eur?: number;
  thread_and_bobbin_eur?: number;
  needle_wear_eur?: number;
  electricity_eur?: number;
  packaging_eur?: number;
  waste_buffer_eur?: number;
  machine_payback_eur?: number;
  labor_eur?: number;
  color_complexity_fee_eur?: number;
};

type InternalQuote = {
  internal_cost_eur?: number | null;
  estimated_profit_eur?: number | null;
  profit_margin_percent?: number | null;
  cost_breakdown?: CostBreakdown;
  technical_warnings?: string[];
  production_notes?: string[];
};

type LogoAnalysis = {
  processed_png: string;
  colors_count: number;
  dominant_colors: Array<{
    hex: string;
    rgb: number[];
    percentage: number;
  }>;
  contrast_score: number;
  embroidery_ready: boolean;
  warnings: string[];
  recommendations: string[];
};

type DesignPreparation = {
  embroidery_prompt: string;
  recommended_style: string;
  max_colors: number;
  warnings: string[];
  recommendations: string[];
  machine_ready_score: number;
  simplified_description: string;
};

type Placement = 'left' | 'center';
type TeeColor = 'black' | 'white';
type OrderFormState = {
  name: string;
  email: string;
  phone: string;
  quantity: string;
  note: string;
};
type OrderFormErrors = Partial<
  Record<keyof OrderFormState, string>
>;

const emailPattern =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;
const phonePattern = /^[+\d\s()-]+$/;

const placementPresets = {
  left: {
    label: 'Left chest',
    size: '90 × 60 mm',
  },
  center: {
    label: 'Center front',
    size: '250 × 200 mm',
  },
} as const;

function validateOrderForm(
  form: OrderFormState,
  t: Translator
) {
  const errors: OrderFormErrors = {};
  const name = form.name.trim();
  const email = form.email.trim();
  const phone = form.phone.trim();
  const quantity = Number(form.quantity);

  if (!name) {
    errors.name = t('validation.nameRequired');
  }

  if (!email) {
    errors.email = t('validation.emailRequired');
  } else if (!emailPattern.test(email)) {
    errors.email = t('validation.emailInvalid');
  }

  if (phone) {
    const digitCount = phone.replace(/\D/g, '').length;

    if (!phonePattern.test(phone) || digitCount < 7) {
      errors.phone = t('validation.phoneInvalid');
    }
  }

  if (!form.quantity.trim()) {
    errors.quantity = t('validation.quantityRequired');
  } else if (!Number.isInteger(quantity) || quantity < 1) {
    errors.quantity = t('validation.quantityInvalid');
  }

  return errors;
}

async function dataUrlToFile(
  dataUrl: string,
  originalName: string
) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const baseName =
    originalName.replace(/\.[^/.]+$/, '') ||
    'logo';

  return new File(
    [blob],
    `${baseName}-processed.png`,
    {
      type: 'image/png',
    }
  );
}

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function getPublicQuote(estimate: Estimate): PublicQuote {
  return (
    estimate.public_quote ?? {
      stitches: estimate.stitches,
      colors: estimate.colors,
      coverage: estimate.coverage,
      price_eur: estimate.price_eur,
      manual_quote: estimate.manual_quote,
      pricing_tier: estimate.pricing_tier,
      customer_warnings: estimate.warnings,
      customer_recommendations: estimate.recommendations,
    }
  );
}

function formatPricingTier(value: string, t: Translator) {
  const normalized = value
    .toLowerCase()
    .replace(/[_-]+/g, ' ');

  if (
    normalized.includes('manual') ||
    normalized.includes('complex') ||
    normalized.includes('review')
  ) {
    return t('pricingTier.review');
  }

  if (normalized.includes('left')) {
    return t('pricingTier.left');
  }

  if (normalized.includes('center') || normalized.includes('front')) {
    return t('pricingTier.center');
  }

  return normalized
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

type HomeProps = {
  locale?: Locale;
};

function useHtmlLocale(locale: Locale) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = getLocaleDirection(locale);

    return () => {
      document.documentElement.lang = 'en';
      document.documentElement.dir = 'ltr';
    };
  }, [locale]);
}

export default function Home({ locale }: HomeProps = {}) {
  const activeLocale = resolveLocale(locale);
  const t = createTranslator(activeLocale);
  const dir = getLocaleDirection(activeLocale);

  useHtmlLocale(activeLocale);

  const [placement, setPlacement] = useState<Placement>('left');
  const [teeColor, setTeeColor] = useState<TeeColor>('black');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [logoAnalysis, setLogoAnalysis] =
    useState<LogoAnalysis | null>(null);
  const [designPreparation, setDesignPreparation] =
    useState<DesignPreparation | null>(null);

  const [logoPrompt, setLogoPrompt] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderForm, setOrderForm] = useState<OrderFormState>({
    name: '',
    email: '',
    phone: '',
    quantity: '1',
    note: '',
  });
  const [orderFieldErrors, setOrderFieldErrors] =
    useState<OrderFormErrors>({});
  const [orderStatus, setOrderStatus] = useState('');
  const [orderError, setOrderError] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRequestingOrder, setIsRequestingOrder] = useState(false);

  const bg = useMemo(
    () =>
      `
      radial-gradient(circle at 15% 20%, rgba(0,255,136,0.16), transparent 25%),
      radial-gradient(circle at 85% 10%, rgba(0,200,255,0.14), transparent 28%),
      radial-gradient(circle at 50% 100%, rgba(255,0,200,0.11), transparent 35%),
      radial-gradient(circle at 78% 70%, rgba(0,255,240,0.08), transparent 30%),
      #050607
    `,
    []
  );

  const preset = placementPresets[placement];
  const placementSize =
    placement === 'left'
      ? { width: 90, height: 60 }
      : { width: 250, height: 200 };
  const publicQuote = estimate
    ? getPublicQuote(estimate)
    : null;
  const processSteps = getProcessSteps(activeLocale);
  const features = getFeatures(activeLocale);
  const galleryItems = getGalleryItems(activeLocale);
  const craftStats = getCraftStats(activeLocale);
  const faqItems = getFaqItems(activeLocale);

  const onFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0] ?? null;

    setFile(selectedFile);
    setEstimate(null);
    setLogoAnalysis(null);
    setDesignPreparation(null);
    setStatus('');
    setError('');

    if (!selectedFile) {
      setPreview(null);
      return;
    }

    setPreview(await blobToDataUrl(selectedFile));
    setIsAnalyzing(true);
    setStatus(t('status.analyzingLogo'));

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('tee_color', teeColor);

      const response = await fetch(`${API}/analyze_logo`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        setStatus(
          t('status.cleanupUnavailable')
        );
        return;
      }

      const analysis =
        (await response.json()) as LogoAnalysis;
      const processedFile = await dataUrlToFile(
        analysis.processed_png,
        selectedFile.name
      );

      setFile(processedFile);
      setPreview(analysis.processed_png);
      setLogoAnalysis(analysis);
      setStatus(
        analysis.colors_count <= PRACTICAL_THREAD_COLOR_LIMIT
          ? t('status.logoReady')
          : t('status.manualColorReview')
      );
    } catch {
      setStatus(
        t('status.cleanupUnavailable')
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateLogo = async () => {
    setError('');
    setStatus('');

    if (!logoPrompt.trim()) {
      setError(t('status.describeLogoFirst'));
      return;
    }

    setIsGenerating(true);

    try {
      const prepareData = new FormData();
      prepareData.append('customer_prompt', logoPrompt);
      prepareData.append('placement', placement);
      prepareData.append('width_mm', String(placementSize.width));
      prepareData.append('height_mm', String(placementSize.height));
      prepareData.append('shirt_color', teeColor);
      prepareData.append(
        'max_colors',
        String(PRACTICAL_THREAD_COLOR_LIMIT)
      );

      const prepareResponse = await fetch(
        `${API}/prepare_design`,
        {
          method: 'POST',
          body: prepareData,
        }
      );

      if (!prepareResponse.ok) {
        setError(t('status.designPreparationFailed'));
        return;
      }

      const prepared =
        (await prepareResponse.json()) as DesignPreparation;
      setDesignPreparation(prepared);

      const fd = new FormData();
      fd.append('prompt', logoPrompt);
      fd.append('placement', placement);
      fd.append('width_mm', String(placementSize.width));
      fd.append('height_mm', String(placementSize.height));
      fd.append('shirt_color', teeColor);
      fd.append('max_colors', String(prepared.max_colors));

      const res = await fetch(`${API}/generate_logo`, {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        setError(t('status.generatorFailed'));
        return;
      }

      const blob = await res.blob();

      const generatedFile = new File([blob], 'logo.png', {
        type: 'image/png',
      });
      const previewDataUrl = await blobToDataUrl(blob);

      setFile(generatedFile);
      setPreview(previewDataUrl);
      setLogoAnalysis(null);

      setStatus(t('status.generated'));
    } catch {
      setError(t('status.networkError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const estimatePrice = async () => {
    setError('');
    setStatus('');

    if (!file) {
      setError(t('status.uploadLogoFirst'));
      return;
    }

    setIsEstimating(true);

    try {
      const fd = new FormData();

      fd.append('file', file);

      fd.append(
        'width_mm',
        placement === 'left' ? '90' : '250'
      );

      fd.append(
        'height_mm',
        placement === 'left' ? '60' : '200'
      );

      fd.append(
        'colors',
        String(Math.max(1, logoAnalysis?.colors_count ?? 3))
      );

      const res = await fetch(`${API}/estimate`, {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        setError(t('status.estimatorFailed'));
        return;
      }

      const data = (await res.json()) as Estimate;
      const fallbackQuote = getPublicQuote(data);
      let pricedEstimate = data;

      const pricingResponse = await fetch('/api/pricing/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stitches: data.stitches,
          colors: data.colors,
          coverage: data.coverage,
          placement,
        }),
      });

      if (pricingResponse.ok) {
        const pricingPayload = (await pricingResponse.json()) as {
          public_quote?: Omit<
            PublicQuote,
            'customer_warnings' | 'customer_recommendations'
          >;
        };
        const pricingQuote = pricingPayload.public_quote;

        if (pricingQuote) {
          pricedEstimate = {
            ...data,
            price_eur: pricingQuote.price_eur,
            manual_quote: pricingQuote.manual_quote,
            pricing_tier: pricingQuote.pricing_tier,
            public_quote: {
              ...pricingQuote,
              customer_warnings:
                fallbackQuote.customer_warnings,
              customer_recommendations:
                fallbackQuote.customer_recommendations,
            },
          };
        }
      }

      const customerQuote = getPublicQuote(pricedEstimate);

      setEstimate(pricedEstimate);
      setOrderStatus('');
      setOrderError('');

      setStatus(
        customerQuote.manual_quote
          ? t('status.manualQuoteNeeded')
          : t('status.quoteReady')
      );
    } catch {
      setError(t('status.networkError'));
    } finally {
      setIsEstimating(false);
    }
  };

  const requestOrder = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setOrderError('');
    setOrderStatus('');

    if (!estimate || !publicQuote) {
      setOrderError(t('status.getQuoteBeforeOrder'));
      return;
    }

    const validationErrors = validateOrderForm(orderForm, t);

    if (Object.keys(validationErrors).length > 0) {
      setOrderFieldErrors(validationErrors);
      setOrderError(
        validationErrors.email ??
          validationErrors.name ??
          validationErrors.phone ??
          validationErrors.quantity ??
          t('status.fixFields')
      );
      return;
    }

    setIsRequestingOrder(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: orderForm.name.trim(),
          customer_email: orderForm.email.trim(),
          customer_phone: orderForm.phone.trim() || undefined,
          quantity: Number(orderForm.quantity),
          note: orderForm.note.trim() || undefined,
          prompt:
            designPreparation?.simplified_description ||
            logoPrompt.trim() ||
            undefined,
          placement: preset.label,
          shirt_color: teeColor,
          logo_preview_url: preview ?? undefined,
          stitches: publicQuote.stitches,
          colors: publicQuote.colors,
          coverage: publicQuote.coverage,
          customer_price_eur: publicQuote.price_eur,
          pricing_tier: publicQuote.pricing_tier,
          manual_quote: publicQuote.manual_quote,
          warnings: publicQuote.customer_warnings,
          recommendations: publicQuote.customer_recommendations,
        }),
      });

      const payload = (await response
        .json()
        .catch(() => ({}))) as {
        message?: string;
        details?: string;
        errors?: {
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          quantity?: string;
        };
      };

      if (!response.ok) {
        if (payload.errors) {
          setOrderFieldErrors({
            name: payload.errors.customer_name,
            email: payload.errors.customer_email,
            phone: payload.errors.customer_phone,
            quantity: payload.errors.quantity,
          });
        }

        setOrderError(
          payload.details ??
            payload.message ??
            t('status.databaseNotConfigured')
        );
        return;
      }

      setOrderStatus(t('status.requestSent'));
      setOrderFieldErrors({});
      setOrderOpen(false);
    } catch (error) {
      setOrderError(t('status.orderSendFailed'));
      console.error(error);
    } finally {
      setIsRequestingOrder(false);
    }
  };

  const updateOrderFormField = (
    field: keyof OrderFormState,
    value: string
  ) => {
    setOrderForm((current) => ({
      ...current,
      [field]: value,
    }));
    setOrderFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  return (
    <main
      lang={activeLocale}
      dir={dir}
      style={{
        minHeight: '100vh',
        background: bg,
        color: '#f5f7f8',
        fontFamily:
          'var(--font-geist-sans), Inter, "Avenir Next", "Helvetica Neue", Arial, sans-serif',
        overflowX: 'hidden',
        overflowY: 'visible',
        position: 'relative',
      }}
    >
      <BackgroundEffects />
      <GlobalVisualStyles />

      <Header locale={activeLocale} t={t} />

      <section
        id="hero"
        style={{
          minHeight: '100svh',
          padding: '124px 24px 90px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <style>
          {`
            @keyframes heroAtelierFloat {
              0%, 100% { transform: translate3d(0, 0, 0); }
              50% { transform: translate3d(0, -10px, 0); }
            }

            @keyframes heroAtelierBreath {
              0%, 100% { transform: translateX(-50%) translateZ(62px) scale3d(1, 1, 1); filter: brightness(1); }
              50% { transform: translateX(-50%) translateZ(62px) scale3d(1.008, 1.006, 1); filter: brightness(1.035); }
            }

            @keyframes heroAtelierSheen {
              0%, 100% { opacity: 0.18; transform: translateX(-34px) skewX(-10deg); }
              50% { opacity: 0.36; transform: translateX(36px) skewX(-10deg); }
            }

            @keyframes heroAtelierThread {
              from { background-position: 0 0; }
              to { background-position: 64px 64px; }
            }

            @keyframes heroAtelierPulse {
              0%, 100% { box-shadow: 0 0 18px rgba(177,255,202,0.28), 0 0 58px rgba(177,255,202,0.10), inset 0 0 22px rgba(255,255,255,0.08); }
              50% { box-shadow: 0 0 26px rgba(177,255,202,0.38), 0 0 72px rgba(177,255,202,0.14), inset 0 0 28px rgba(255,255,255,0.11); }
            }

            @keyframes heroCardFloat {
              0%, 100% { transform: translate3d(0, 0, 0) rotateX(0deg); }
              50% { transform: translate3d(0, -12px, 0) rotateX(1.2deg); }
            }

            .hero-atelier {
              position: relative;
              width: 100%;
              max-width: 1280px;
              margin: 0 auto;
              display: grid;
              grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.15fr);
              gap: clamp(32px, 3.5vw, 48px);
              align-items: center;
            }

            .hero-copy-panel {
              position: relative;
              overflow: visible;
              min-width: 0;
              padding: clamp(30px, 3.8vw, 48px);
              border-radius: 34px;
              border: 1px solid rgba(185,255,204,0.12);
              background:
                radial-gradient(circle at 4% 20%, rgba(0,255,136,0.13), transparent 30%),
                radial-gradient(circle at 94% 72%, rgba(0,200,255,0.10), transparent 31%),
                linear-gradient(145deg, rgba(18,21,22,0.70), rgba(4,6,7,0.94) 58%, rgba(13,15,18,0.78));
              box-shadow:
                0 42px 130px rgba(0,0,0,0.54),
                0 0 0 1px rgba(255,255,255,0.015),
                inset 0 1px 0 rgba(255,255,255,0.08);
              backdrop-filter: blur(24px);
            }

            .hero-copy-panel::before {
              content: "";
              position: absolute;
              inset: 1px;
              border-radius: inherit;
              pointer-events: none;
              background:
                linear-gradient(120deg, rgba(255,255,255,0.14), transparent 24%, transparent 68%, rgba(0,200,255,0.10));
              opacity: 0.65;
            }

            .hero-copy-panel > * {
              position: relative;
              z-index: 1;
            }

            .hero-kicker {
              display: inline-flex;
              align-items: center;
              gap: 10px;
              padding: 9px 13px;
              margin-bottom: 26px;
              border: 1px solid rgba(213,255,223,0.22);
              border-radius: 999px;
              background: rgba(185,255,204,0.06);
              color: rgba(214,255,229,0.88);
              font-size: 11px;
              font-weight: 750;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .hero-kicker-dot {
              width: 7px;
              height: 7px;
              border-radius: 999px;
              background: #b9ffcc;
              box-shadow: 0 0 18px rgba(185,255,204,0.72);
            }

            .hero-title {
              max-width: 760px;
              margin: 0 0 28px;
              padding-bottom: 0.08em;
              overflow: visible;
              font-size: clamp(46px, 5.4vw, 78px);
              line-height: 1.02;
              letter-spacing: -0.025em;
              font-weight: 950;
              color: #f6f3eb;
              text-wrap: balance;
            }

            .hero-title-accent {
              display: block;
              margin-bottom: -0.08em;
              padding-bottom: 0.10em;
              overflow: visible;
              line-height: 1.08;
              color: transparent;
              background: linear-gradient(90deg, #00ff88, #00d7ff 58%, #d36bff);
              -webkit-background-clip: text;
              background-clip: text;
              text-shadow: 0 0 34px rgba(0,255,136,0.20);
            }

            .hero-title-accent-part {
              display: block;
            }

            .hero-subcopy {
              max-width: 620px;
              margin: 0 0 36px;
              color: rgba(246,243,235,0.70);
              font-size: clamp(17px, 1.35vw, 20px);
              line-height: 1.68;
            }

            .hero-actions {
              display: flex;
              gap: 14px;
              flex-wrap: wrap;
              margin-bottom: 32px;
            }

            .hero-proof-strip {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 10px;
            }

            .hero-proof-item {
              min-height: 72px;
              padding: 15px;
              border-radius: 20px;
              border: 1px solid rgba(255,255,255,0.09);
              background:
                linear-gradient(145deg, rgba(255,255,255,0.065), rgba(255,255,255,0.025));
              box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
            }

            .hero-proof-label {
              margin-bottom: 6px;
              color: rgba(246,243,235,0.48);
              font-size: 11px;
              letter-spacing: 0.09em;
              text-transform: uppercase;
            }

            .hero-proof-value {
              color: rgba(246,243,235,0.88);
              font-size: 14px;
              font-weight: 720;
            }

            .hero-preview-card {
              --hero-rotate-x: 0deg;
              --hero-rotate-y: 0deg;
              --hero-shift-x: 0px;
              --hero-shift-y: 0px;
              --hero-light-x: 46%;
              --hero-light-y: 18%;
              position: relative;
              min-height: 692px;
              overflow: visible;
              border: 1px solid rgba(255,255,255,0.11);
              border-radius: 38px;
              background:
                radial-gradient(circle at 64% 22%, rgba(0,255,136,0.10), transparent 24%),
                linear-gradient(145deg, rgba(17,19,20,0.96), rgba(5,6,7,0.98) 58%, rgba(7,17,18,0.97));
              box-shadow:
                0 50px 150px rgba(0,0,0,0.68),
                inset 0 1px 0 rgba(255,255,255,0.09);
              isolation: isolate;
              perspective: 1200px;
              transition:
                border-color 220ms ease,
                box-shadow 220ms ease,
                background 220ms ease;
            }

            .hero-preview-card:hover {
              border-color: rgba(226,255,235,0.22);
              box-shadow:
                0 58px 165px rgba(0,0,0,0.72),
                inset 0 1px 0 rgba(255,255,255,0.11);
            }

            .hero-preview-card::before {
              content: "";
              position: absolute;
              inset: -32px;
              background:
                radial-gradient(circle at 34% 16%, rgba(0,255,136,0.18), transparent 30%),
                radial-gradient(circle at 82% 76%, rgba(0,200,255,0.12), transparent 34%),
                radial-gradient(circle at 20% 84%, rgba(255,55,212,0.08), transparent 36%);
              filter: blur(34px);
              opacity: 0.48;
              pointer-events: none;
              z-index: -1;
            }

            .hero-preview-card::after {
              content: "";
              position: absolute;
              inset: 0;
              border-radius: inherit;
              background:
                linear-gradient(120deg, rgba(255,255,255,0.10), transparent 22%, transparent 62%, rgba(0,255,136,0.08)),
                linear-gradient(rgba(255,255,255,0.026) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.026) 1px, transparent 1px);
              background-size: auto, 50px 50px, 50px 50px;
              mask-image: radial-gradient(circle at 52% 45%, black, transparent 78%);
              opacity: 0.82;
              pointer-events: none;
              z-index: 0;
            }

            .hero-editorial-stage {
              position: absolute;
              inset: 78px 34px 138px;
              display: grid;
              grid-template-columns: minmax(0, 1fr) 188px;
              gap: 16px;
              transform: rotateX(var(--hero-rotate-x)) rotateY(var(--hero-rotate-y));
              transform-style: preserve-3d;
              transition: transform 180ms ease-out;
              z-index: 2;
              animation: heroCardFloat 7s ease-in-out infinite;
            }

            .hero-photo-panel,
            .hero-mini-photo-card,
            .hero-fabric-note {
              position: relative;
              overflow: hidden;
              border: 1px solid rgba(255,255,255,0.12);
              background: rgba(255,255,255,0.045);
              box-shadow:
                0 34px 95px rgba(0,0,0,0.50),
                inset 0 1px 0 rgba(255,255,255,0.11);
            }

            .hero-photo-panel,
            .hero-mini-photo-card {
              min-width: 0;
            }

            .hero-photo-panel {
              grid-row: 1 / span 2;
              min-height: 452px;
              border-radius: 30px;
            }

            .hero-photo-panel::before,
            .hero-mini-photo-card::before {
              content: "";
              position: absolute;
              inset: 0;
              z-index: 1;
              pointer-events: none;
              background:
                linear-gradient(180deg, rgba(2,3,4,0.00), rgba(2,3,4,0.28) 44%, rgba(2,3,4,0.86)),
                radial-gradient(circle at 42% 18%, rgba(255,255,255,0.16), transparent 30%),
                radial-gradient(circle at 76% 76%, rgba(0,255,136,0.16), transparent 32%);
            }

            .hero-photo-panel::after,
            .hero-mini-photo-card::after {
              content: "";
              position: absolute;
              inset: 0;
              z-index: 2;
              pointer-events: none;
              background:
                linear-gradient(rgba(255,255,255,0.030) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
              background-size: 42px 42px;
              mix-blend-mode: overlay;
              opacity: 0.72;
            }

            .hero-photo-image {
              filter: saturate(0.88) contrast(1.08) brightness(0.78);
              transform: scale(1.04);
            }

            .hero-photo-caption {
              position: absolute;
              left: 22px;
              right: 22px;
              bottom: 22px;
              z-index: 4;
              padding: 18px;
              border-radius: 20px;
              border: 1px solid rgba(255,255,255,0.13);
              background: rgba(3,5,6,0.68);
              backdrop-filter: blur(18px);
              box-shadow: 0 18px 58px rgba(0,0,0,0.36);
            }

            .hero-photo-caption span,
            .hero-fabric-note span {
              display: block;
              margin-bottom: 6px;
              color: #00d7ff;
              font-size: 11px;
              font-weight: 860;
              letter-spacing: 0.12em;
              text-transform: uppercase;
            }

            .hero-photo-caption strong,
            .hero-fabric-note strong {
              display: block;
              color: #f6f3eb;
              font-size: clamp(15px, 1.25vw, 18px);
              line-height: 1.24;
              overflow-wrap: anywhere;
            }

            .hero-preview-logo {
              position: absolute;
              top: 26px;
              right: 24px;
              z-index: 4;
              width: 96px;
              height: 66px;
              border-radius: 18px;
              border: 1px solid rgba(185,255,204,0.32);
              background: rgba(2,5,5,0.42);
              box-shadow:
                0 0 40px rgba(0,255,136,0.18),
                inset 0 0 24px rgba(0,255,136,0.07);
              backdrop-filter: blur(10px);
              overflow: hidden;
            }

            .hero-preview-logo::after {
              content: "";
              position: absolute;
              inset: 0;
              background:
                repeating-linear-gradient(90deg, rgba(255,255,255,0.14) 0 1px, transparent 1px 5px);
              opacity: 0.16;
              pointer-events: none;
              mix-blend-mode: screen;
            }

            .hero-side-stack {
              display: grid;
              grid-template-rows: 1fr 1fr;
              gap: 16px;
            }

            .hero-mini-photo-card {
              min-height: 218px;
              border-radius: 26px;
            }

            .hero-mini-photo-card .hero-mini-copy {
              position: absolute;
              left: 16px;
              right: 16px;
              bottom: 16px;
              z-index: 4;
            }

            .hero-mini-photo-card span {
              color: #00ff88;
              font-size: 11px;
              font-weight: 860;
              letter-spacing: 0.12em;
              text-transform: uppercase;
            }

            .hero-mini-photo-card strong {
              display: block;
              margin-top: 6px;
              color: #f6f3eb;
              font-size: clamp(14px, 1.15vw, 16px);
              line-height: 1.24;
              overflow-wrap: anywhere;
            }

            .hero-fabric-note {
              grid-column: 1 / -1;
              min-height: 86px;
              padding: 18px 20px;
              border-radius: 22px;
              background:
                radial-gradient(circle at 18% 20%, rgba(0,255,136,0.12), transparent 34%),
                radial-gradient(circle at 82% 74%, rgba(0,215,255,0.12), transparent 34%),
                rgba(255,255,255,0.045);
            }

            .hero-fabric-note strong {
              font-size: 15px;
            }


            .hero-ai-badge,
            .hero-studio-toolbar,
            .hero-placement-callout,
            .hero-floating-quote {
              position: absolute;
              z-index: 5;
              border: 1px solid rgba(255,255,255,0.12);
              background: rgba(6,7,8,0.68);
              box-shadow: 0 22px 68px rgba(0,0,0,0.42);
              backdrop-filter: blur(18px);
            }

            .hero-ai-badge {
              top: 28px;
              right: 28px;
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 12px 14px;
              border-radius: 18px;
            }

            .hero-ai-icon {
              width: 36px;
              height: 36px;
              display: grid;
              place-items: center;
              border-radius: 13px;
              background: linear-gradient(135deg, #00ff88, #00c8ff 58%, #ff28d6);
              color: #04100a;
              font-weight: 900;
            }

            .hero-studio-toolbar {
              top: 28px;
              left: 28px;
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 10px 12px;
              border-radius: 999px;
              color: rgba(245,247,248,0.72);
              font-size: 12px;
              font-weight: 760;
            }

            .hero-window-dot {
              width: 9px;
              height: 9px;
              border-radius: 999px;
              background: #00ff88;
              box-shadow: 0 0 16px currentColor;
            }

            .hero-window-dot:nth-child(2) {
              background: #00c8ff;
            }

            .hero-window-dot:nth-child(3) {
              background: #ff28d6;
            }

            .hero-placement-callout {
              left: 50%;
              bottom: 32px;
              transform: translateX(-50%);
              min-width: 292px;
              display: flex;
              align-items: center;
              gap: 13px;
              padding: 14px 16px;
              border-radius: 20px;
            }

            .hero-floating-quote {
              right: 30px;
              bottom: 90px;
              display: grid;
              gap: 2px;
              padding: 13px 15px;
              border-radius: 18px;
              color: rgba(245,247,248,0.76);
            }

            .hero-floating-quote strong {
              color: #00ff88;
              font-size: 19px;
            }

            .hero-callout-icon {
              width: 44px;
              height: 44px;
              display: grid;
              place-items: center;
              border-radius: 15px;
              background: linear-gradient(135deg, rgba(0,255,136,0.94), rgba(0,200,255,0.94));
              color: #04100a;
              font-weight: 950;
            }

            .hero-stage {
              position: absolute;
              left: 50%;
              top: 74px;
              width: min(452px, 88%);
              height: 536px;
              transform: translateX(-50%) rotateX(var(--hero-rotate-x)) rotateY(var(--hero-rotate-y));
              transform-style: preserve-3d;
              transition: transform 180ms ease-out;
              z-index: 2;
            }

            .hero-float {
              position: absolute;
              inset: 0;
              animation: heroAtelierFloat 7s ease-in-out infinite;
              transform-style: preserve-3d;
            }

            .hero-sleeve-left,
            .hero-sleeve-right {
              position: absolute;
              top: 126px;
              width: 130px;
              height: 258px;
              box-shadow:
                inset 18px 22px 32px rgba(255,255,255,0.07),
                inset -24px -32px 48px rgba(0,0,0,0.48),
                0 32px 72px rgba(0,0,0,0.44);
            }

            .hero-sleeve-left {
              left: 16px;
              border-radius: 54px 22px 44px 70px;
              clip-path: polygon(42% 0, 100% 15%, 78% 100%, 18% 91%, 0 24%);
              transform: rotate(6deg) translateZ(18px);
            }

            .hero-sleeve-right {
              right: 16px;
              border-radius: 22px 54px 70px 44px;
              clip-path: polygon(0 15%, 58% 0, 100% 24%, 82% 91%, 22% 100%);
              transform: rotate(-6deg) translateZ(18px);
            }

            .hero-shirt-body {
              position: absolute;
              left: 50%;
              top: 62px;
              width: 344px;
              height: 448px;
              overflow: hidden;
              border-radius: 94px 94px 42px 42px / 88px 88px 34px 34px;
              clip-path: polygon(17% 0, 35% 0, 42% 12%, 58% 12%, 65% 0, 83% 0, 98% 22%, 87% 100%, 13% 100%, 2% 22%);
              animation: heroAtelierBreath 6.4s ease-in-out infinite;
            }

            .hero-shirt-body::before {
              content: "";
              position: absolute;
              inset: 0;
              background-image:
                linear-gradient(104deg, transparent 0%, rgba(255,255,255,0.15) 17%, transparent 32%),
                repeating-linear-gradient(90deg, rgba(255,255,255,0.032) 0 1px, transparent 1px 8px),
                repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 10px);
              animation: heroAtelierSheen 9s ease-in-out infinite;
              pointer-events: none;
            }

            .hero-shirt-body::after {
              content: "";
              position: absolute;
              inset: 0;
              background: radial-gradient(circle at 36% 20%, rgba(255,255,255,0.18), transparent 24%), radial-gradient(circle at 78% 78%, rgba(0,0,0,0.34), transparent 38%);
              pointer-events: none;
            }

            .hero-collar {
              position: absolute;
              left: 50%;
              top: 0;
              width: 112px;
              height: 64px;
              transform: translateX(-50%);
              border-radius: 0 0 999px 999px;
              background: linear-gradient(180deg, rgba(0,0,0,0.78), rgba(0,0,0,0.36));
              box-shadow:
                0 10px 24px rgba(0,0,0,0.40),
                inset 0 -9px 16px rgba(255,255,255,0.05);
            }

            .hero-placement-box {
              position: absolute;
              transform: translateX(-50%);
              display: grid;
              place-items: center;
              overflow: hidden;
              border: 1px solid rgba(185,255,204,0.78);
              border-radius: 16px;
              background: linear-gradient(135deg, rgba(185,255,204,0.10), rgba(0,0,0,0.10));
              animation: heroAtelierPulse 3.8s ease-in-out infinite;
              z-index: 2;
            }

            .hero-placement-box.has-logo {
              background: transparent;
            }

            .hero-placement-box::before {
              content: "";
              position: absolute;
              inset: 0;
              background-image: linear-gradient(45deg, rgba(185,255,204,0.14) 25%, transparent 25%, transparent 50%, rgba(185,255,204,0.14) 50%, rgba(185,255,204,0.14) 75%, transparent 75%, transparent);
              background-size: 16px 16px;
              animation: heroAtelierThread 8s linear infinite;
              opacity: 0.22;
              pointer-events: none;
              z-index: 0;
            }

            .hero-placement-box.has-logo::before {
              opacity: 0.10;
            }

            .hero-status-pill,
            .hero-material-pill {
              position: absolute;
              z-index: 4;
              display: inline-flex;
              align-items: center;
              gap: 10px;
              border: 1px solid rgba(255,255,255,0.10);
              background: rgba(5,6,6,0.56);
              color: rgba(246,243,235,0.76);
              box-shadow: 0 18px 48px rgba(0,0,0,0.34);
              backdrop-filter: blur(16px);
            }

            .hero-status-pill {
              top: 22px;
              right: 22px;
              padding: 10px 15px;
              border-radius: 16px;
              font-size: 13px;
            }

            .hero-material-pill {
              top: 22px;
              left: 22px;
              padding: 10px 14px;
              border-radius: 999px;
              font-size: 13px;
            }

            .hero-swatch {
              width: 14px;
              height: 14px;
              border-radius: 50%;
            }

            .hero-spec-grid {
              position: absolute;
              left: 34px;
              right: 34px;
              bottom: 26px;
              z-index: 4;
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 12px;
            }

            .hero-spec-card {
              padding: 14px 12px;
              border: 1px solid rgba(255,255,255,0.10);
              border-radius: 18px;
              background:
                linear-gradient(145deg, rgba(255,255,255,0.070), rgba(255,255,255,0.030));
              text-align: center;
              backdrop-filter: blur(14px);
            }

            .hero-spec-label {
              margin-bottom: 4px;
              color: rgba(246,243,235,0.48);
              font-size: 11px;
            }

            .hero-spec-value {
              color: #f6f3eb;
              font-size: 13px;
              font-weight: 760;
            }

            @media (max-width: 1099px) {
              .hero-atelier {
                grid-template-columns: 1fr;
                gap: 34px;
                max-width: 760px;
              }

              .hero-preview-card {
                min-height: 640px;
              }

              .hero-editorial-stage {
                inset: 84px 24px 132px;
              }
            }

            @media (max-width: 720px) {
              .hero-preview-card {
                min-height: 560px;
              }

              .hero-editorial-stage {
                inset: 86px 18px 120px;
                grid-template-columns: minmax(0, 1fr) minmax(132px, 0.42fr);
                gap: 12px;
              }

              .hero-photo-caption {
                left: 14px;
                right: 14px;
                bottom: 14px;
                padding: 14px;
                border-radius: 16px;
              }

              .hero-mini-photo-card {
                min-height: 170px;
              }
            }

            @media (max-width: 560px) {
              .hero-copy-panel {
                padding: 24px;
                border-radius: 24px;
              }

              .hero-title {
                font-size: clamp(36px, 10.5vw, 50px);
                line-height: 1.06;
                letter-spacing: -0.018em;
              }

              .hero-title-accent-part {
                display: inline;
              }

              .hero-title-accent-part + .hero-title-accent-part::before {
                content: " ";
              }

              .hero-proof-strip,
              .hero-spec-grid {
                grid-template-columns: 1fr;
              }

              .hero-preview-card {
                min-height: 520px;
                border-radius: 28px;
              }

              .hero-status-pill {
                left: 22px;
                right: auto;
                top: 70px;
              }

              .hero-editorial-stage {
                inset: 72px 14px 96px;
                grid-template-columns: 1fr;
              }

              .hero-photo-panel {
                min-height: 330px;
                grid-row: auto;
              }

              .hero-side-stack,
              .hero-fabric-note {
                display: none;
              }

              .hero-ai-badge {
                display: none;
              }

              .hero-studio-toolbar {
                top: 18px;
                left: 18px;
              }

              .hero-floating-quote {
                display: none;
              }

              .hero-placement-callout {
                min-width: 0;
                width: calc(100% - 32px);
                bottom: 18px;
              }
            }


            /* Stable premium visual card: no mouse-follow spotlight or overlap. */
            .hero-preview-card {
              min-height: auto;
              width: 100%;
              min-width: 0;
              overflow: hidden;
              display: grid;
              grid-template-columns: minmax(0, 1fr) auto;
              grid-template-areas:
                "toolbar badge"
                "stage stage"
                "callout quote"
                "specs specs";
              gap: 18px;
              padding: clamp(18px, 2.2vw, 26px);
              border-color: rgba(180,255,222,0.16);
              background:
                radial-gradient(circle at 72% 12%, rgba(0,215,255,0.10), transparent 30%),
                radial-gradient(circle at 18% 92%, rgba(0,255,136,0.12), transparent 32%),
                linear-gradient(145deg, rgba(16,20,21,0.82), rgba(4,6,7,0.94));
            }

            .hero-preview-card:hover {
              transform: translateY(-3px);
              border-color: rgba(124,240,212,0.24);
              box-shadow:
                0 52px 150px rgba(0,0,0,0.62),
                0 0 58px rgba(0,215,255,0.08),
                inset 0 1px 0 rgba(255,255,255,0.11);
            }

            .hero-preview-card::before {
              inset: -18px;
              filter: blur(34px);
              opacity: 0.34;
              background:
                radial-gradient(circle at 22% 8%, rgba(0,255,136,0.15), transparent 34%),
                radial-gradient(circle at 78% 18%, rgba(0,215,255,0.12), transparent 34%);
            }

            .hero-preview-card::after {
              opacity: 0.46;
              mask-image: none;
            }

            .hero-studio-toolbar,
            .hero-ai-badge,
            .hero-placement-callout,
            .hero-floating-quote {
              position: relative;
              top: auto;
              right: auto;
              bottom: auto;
              left: auto;
              transform: none;
              z-index: 3;
              min-width: 0;
              background: rgba(5,8,9,0.58);
              border-color: rgba(199,255,225,0.13);
            }

            .hero-studio-toolbar {
              grid-area: toolbar;
              justify-self: start;
              max-width: 100%;
            }

            .hero-ai-badge {
              grid-area: badge;
              justify-self: end;
              max-width: min(260px, 100%);
            }

            .hero-editorial-stage {
              position: relative;
              inset: auto;
              grid-area: stage;
              display: grid;
              grid-template-columns: minmax(0, 1fr);
              min-height: auto;
              gap: 16px;
              transform: none;
              animation: none;
            }

            .hero-photo-panel {
              grid-row: auto;
              min-height: 0;
              aspect-ratio: 16 / 11;
              border-radius: 30px;
            }

            .hero-side-stack {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              grid-template-rows: none;
              gap: 16px;
              min-height: 0;
            }

            .hero-mini-photo-card {
              aspect-ratio: 16 / 9;
              min-height: 0;
              border-radius: 24px;
            }

            @media (min-width: 1100px) {
              .hero-editorial-stage {
                --hero-stage-height: clamp(340px, 30vw, 390px);
                grid-template-columns: minmax(0, 1.42fr) minmax(170px, 0.58fr);
                min-height: var(--hero-stage-height);
                height: var(--hero-stage-height);
                align-items: stretch;
              }

              .hero-photo-panel {
                grid-row: 1 / span 2;
                min-height: var(--hero-stage-height);
                height: var(--hero-stage-height);
                aspect-ratio: auto;
              }

              .hero-side-stack {
                grid-template-columns: 1fr;
                grid-template-rows: repeat(2, minmax(0, 1fr));
                min-height: var(--hero-stage-height);
                height: 100%;
              }

              .hero-mini-photo-card {
                height: auto;
                aspect-ratio: auto;
              }
            }

            .hero-fabric-note {
              grid-column: 1 / -1;
              min-height: auto;
              padding: 18px 20px;
            }

            .hero-placement-callout {
              grid-area: callout;
              width: auto;
              display: flex;
              align-items: center;
              gap: 13px;
            }

            .hero-floating-quote {
              grid-area: quote;
              justify-self: end;
              min-width: 170px;
            }

            .hero-spec-grid {
              position: relative;
              left: auto;
              right: auto;
              bottom: auto;
              grid-area: specs;
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 12px;
            }

            .hero-photo-caption,
            .hero-mini-copy,
            .production-photo-badge,
            .production-mini-copy {
              background: rgba(3,5,6,0.66);
              border: 1px solid rgba(213,255,230,0.13);
              border-radius: 18px;
              padding: 14px 16px;
              backdrop-filter: blur(16px);
            }

            @media (max-width: 1099px) {
              .hero-preview-card {
                grid-template-columns: 1fr;
                grid-template-areas:
                  "toolbar"
                  "badge"
                  "stage"
                  "callout"
                  "quote"
                  "specs";
              }

              .hero-ai-badge,
              .hero-floating-quote {
                justify-self: stretch;
              }

              .hero-editorial-stage {
                grid-template-columns: minmax(0, 1fr);
                min-height: auto;
              }

              .hero-photo-panel {
                min-height: 0;
              }
            }

            @media (max-width: 767px) {
              .hero-side-stack {
                grid-template-columns: 1fr;
              }

              .hero-photo-panel {
                aspect-ratio: 4 / 3;
              }
            }

            @media (max-width: 640px) {
              #hero {
                padding-left: 16px !important;
                padding-right: 16px !important;
              }

              .hero-atelier,
              .hero-preview-card,
              .hero-copy-panel {
                width: 100%;
                max-width: 100%;
              }

              .hero-preview-card {
                padding: 16px;
                border-radius: 26px;
                gap: 14px;
              }

              .hero-editorial-stage {
                grid-template-columns: 1fr;
                min-height: auto;
              }

              .hero-photo-panel,
              .hero-mini-photo-card {
                grid-row: auto;
                width: 100%;
                min-height: 0;
              }

              .hero-photo-panel {
                aspect-ratio: 4 / 3;
              }

              .hero-side-stack {
                display: grid;
                grid-template-columns: 1fr;
              }

              .hero-mini-photo-card {
                aspect-ratio: 16 / 9;
              }

              .hero-fabric-note {
                display: block;
              }

              .hero-spec-grid {
                grid-template-columns: 1fr;
              }

              .hero-ai-badge {
                display: flex;
              }

              .hero-placement-callout {
                width: auto;
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .hero-float,
              .hero-shirt-body,
              .hero-shirt-body::before,
              .hero-placement-box,
              .hero-placement-box::before,
              .hero-editorial-stage {
                animation: none;
              }
            }
          `}
        </style>

        <div
          className="hero-atelier"
        >
          <div className="hero-copy-panel">
            <div className="hero-kicker">
              <span className="hero-kicker-dot" />
              {t('hero.kicker')}
            </div>

            <h1 className="hero-title">
              {t('hero.title1')}
              <br />
              {t('hero.title2')}
              <span className="hero-title-accent">
                <span className="hero-title-accent-part">
                  {t('hero.title3')}
                </span>
                <span className="hero-title-accent-part">
                  {t('hero.title4')}
                </span>
              </span>
            </h1>

            <p className="hero-subcopy">
              {t('hero.subtitle')}
            </p>

            <div className="hero-actions">
              <a
                href="#designer"
                className="lux-button"
                style={primaryButton}
              >
                {t('nav.start')}
              </a>

              <a
                href="#craft"
                className="lux-button"
                style={secondaryButton}
              >
                {t('hero.secondaryCta')}
              </a>
            </div>

            <div className="hero-proof-strip">
              <div className="hero-proof-item">
                <div className="hero-proof-label">
                  {t('hero.proofStudioLabel')}
                </div>
                <div className="hero-proof-value">
                  {t('hero.proofStudioValue')}
                </div>
              </div>

              <div className="hero-proof-item">
                <div className="hero-proof-label">
                  {t('hero.proofArtworkLabel')}
                </div>
                <div className="hero-proof-value">
                  {preview
                    ? t('hero.proofArtworkReady')
                    : t('hero.proofArtworkDefault')}
                </div>
              </div>

              <div className="hero-proof-item">
                <div className="hero-proof-label">
                  {t('hero.proofQuoteLabel')}
                </div>
                <div className="hero-proof-value">
                  {t('hero.proofQuoteValue')}
                </div>
              </div>
            </div>
          </div>

          <div className="hero-preview-card">
            <div className="hero-studio-toolbar">
              <span className="hero-window-dot" />
              <span className="hero-window-dot" />
              <span className="hero-window-dot" />
              {t('hero.toolbar')}
            </div>

            <div className="hero-ai-badge">
              <div className="hero-ai-icon">AI</div>
              <div>
                <div
                  style={{
                    color: '#f5f7f8',
                    fontWeight: 860,
                    marginBottom: 2,
                  }}
                >
                  {t('hero.badgeTitle')}
                </div>
                <div
                  style={{
                    color: 'rgba(245,247,248,0.56)',
                    fontSize: 12,
                  }}
                >
                  {t('hero.badgeText')}
                </div>
              </div>
            </div>

            <div className="hero-editorial-stage">
              <div className="hero-photo-panel">
                {/* Hero main image from the local launch asset set. */}
                <Image
                  src={homepageImages.heroMain}
                  alt={t('hero.mainImageAlt')}
                  fill
                  priority
                  sizes="(max-width: 767px) calc(100vw - 64px), (max-width: 1099px) 680px, 620px"
                  className="hero-photo-image"
                  style={{
                    objectFit: 'cover',
                    objectPosition: 'center',
                  }}
                />

                {preview ? (
                  <div className="hero-preview-logo">
                    <Image
                      src={preview}
                      alt={t('hero.logoAlt')}
                      fill
                      unoptimized
                      style={{
                        objectFit: 'contain',
                        padding: 9,
                        filter:
                          'contrast(1.18) saturate(1.18) drop-shadow(0 0 12px rgba(0,255,136,0.24))',
                      }}
                    />
                  </div>
                ) : null}

                <div className="hero-photo-caption">
                  <span>{t('hero.photoCaptionLabel')}</span>
                  <strong>
                    {t('hero.photoCaptionText')}
                  </strong>
                </div>
              </div>

              <div className="hero-side-stack">
                <div className="hero-mini-photo-card">
                  {/* Hero stitch detail image from the local launch asset set. */}
                  <Image
                    src={homepageImages.stitchFinish}
                    alt="Close-up stitching detail on fabric"
                    fill
                    sizes="(max-width: 767px) calc(100vw - 64px), (max-width: 1099px) 330px, 300px"
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center',
                    }}
                  />
                  <div className="hero-mini-copy">
                    <span>{t('hero.stitchFinishLabel')}</span>
                    <strong>{t('hero.stitchFinishText')}</strong>
                  </div>
                </div>

                <div className="hero-mini-photo-card">
                  {/* Hero material image from the local launch asset set. */}
                  <Image
                    src={homepageImages.threadDetail}
                    alt="Premium colorful embroidery thread"
                    fill
                    sizes="(max-width: 767px) calc(100vw - 64px), (max-width: 1099px) 330px, 300px"
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center',
                    }}
                  />
                  <div className="hero-mini-copy">
                    <span>{t('hero.threadLabel')}</span>
                    <strong>{t('hero.threadText')}</strong>
                  </div>
                </div>
              </div>

              <div className="hero-fabric-note">
                <span>{t('hero.workflowLabel')}</span>
                <strong>
                  {t('hero.workflowText')}
                </strong>
              </div>
            </div>

            <div className="hero-placement-callout">
              <div className="hero-callout-icon">TEE</div>
              <div>
                <div
                  style={{
                    color: '#f5f7f8',
                    fontWeight: 860,
                  }}
                >
                  {t('hero.previewTitle')}
                </div>
                <div
                  style={{
                    color: 'rgba(245,247,248,0.58)',
                    fontSize: 13,
                    marginTop: 3,
                  }}
                >
                  {preset.size} · {t('hero.productionReady')}
                </div>
              </div>
            </div>

            <div className="hero-floating-quote">
              <span>{t('hero.priceLabel')}</span>
              <strong>
                {publicQuote
                  ? publicQuote.manual_quote
                    ? t('hero.manualQuote')
                    : `€${publicQuote.price_eur}`
                  : t('hero.fromPrice')}
              </strong>
            </div>

            <div className="hero-spec-grid">
              {[
                [
                  t('hero.specArtwork'),
                  preview
                    ? t('hero.specLogoLoaded')
                    : t('hero.specAiReady'),
                ],
                [
                  t('hero.specColors'),
                  estimate ? String(estimate.colors) : t('hero.specAuto'),
                ],
                [
                  t('hero.specStitches'),
                  estimate ? estimate.stitches.toLocaleString() : '12,450',
                ],
              ].map(([labelText, value]) => (
                <div
                  key={labelText}
                  className="hero-spec-card"
                >
                  <div className="hero-spec-label">
                    {labelText}
                  </div>
                  <div className="hero-spec-value">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="designer"
        className="designer-section"
        style={{
          padding: '96px 24px 128px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          className="designer-grid"
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns:
              'minmax(0,0.88fr) minmax(0,1.12fr)',
            gap: 32,
            alignItems: 'start',
          }}
        >
          <HoverCard style={glassCard} className="designer-controls-card">
            <div
              className="designer-stat-grid"
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(3,minmax(0,1fr))',
                gap: 12,
                marginBottom: 22,
              }}
            >
              <Stat
                label={t('designer.finishLabel')}
                value={t('designer.finishValue')}
              />

              <Stat
                label={t('designer.pricingLabel')}
                value={t('designer.pricingValue')}
              />

              <Stat
                label={t('designer.previewLabel')}
                value={t('designer.previewValue')}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gap: 16,
              }}
            >
              <label style={label}>
                {t('designer.choosePlacement')}
              </label>

              <select
                value={placement}
                onChange={(e) =>
                  setPlacement(
                    e.target.value ===
                      'center'
                      ? 'center'
                      : 'left'
                  )
                }
                style={input}
              >
                <option value="left">
                  {t('placement.left')}
                </option>

                <option value="center">
                  {t('placement.center')}
                </option>
              </select>

              <label style={label}>
                {t('designer.chooseShirtColor')}
              </label>

              <div
                className="shirt-color-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(2,minmax(0,1fr))',
                  gap: 12,
                }}
              >
                {(['black', 'white'] as const).map(
                  (color) => {
                    const active =
                      teeColor === color;

                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          setTeeColor(color)
                        }
                        style={{
                          minHeight: 54,
                          borderRadius: 16,
                          border: active
                            ? '1px solid rgba(0,255,136,0.78)'
                            : '1px solid rgba(255,255,255,0.12)',
                          background: active
                            ? 'rgba(0,255,136,0.12)'
                            : 'rgba(255,255,255,0.045)',
                          color: '#f5f7f8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 10,
                          fontWeight: 850,
                          cursor: 'pointer',
                        }}
                      >
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background:
                              color === 'black'
                                ? '#050607'
                                : '#f5f1e8',
                            border:
                              color === 'black'
                                ? '1px solid rgba(255,255,255,0.22)'
                                : '1px solid rgba(0,0,0,0.18)',
                            boxShadow: active
                              ? '0 0 18px rgba(0,255,136,0.35)'
                              : 'none',
                          }}
                        />
                        {color === 'black'
                          ? t('designer.blackTee')
                          : t('designer.whiteTee')}
                      </button>
                    );
                  }
                )}
              </div>

              <label style={label}>
                {t('designer.uploadLogo')}
              </label>

              <input
                className="stitchra-file-input"
                type="file"
                accept="image/*"
                onChange={onFile}
                style={{
                  color: '#fff',
                }}
              />

              <label style={label}>
                {t('designer.describeIdea')}
              </label>

              <div
                className="designer-prompt-row"
                style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <input
                  value={logoPrompt}
                  onChange={(e) => {
                    setLogoPrompt(e.target.value);
                    setDesignPreparation(null);
                  }}
                  aria-label={t('designer.promptAria')}
                  placeholder={t('designer.promptPlaceholder')}
                  style={{
                    ...input,
                    flex: 1,
                    minWidth: 0,
                  }}
                />

                <button
                  onClick={generateLogo}
                  disabled={isGenerating}
                  className="lux-button"
                  style={{
                    ...primaryButton,
                    border: 'none',
                    minWidth: 180,
                  }}
                >
                  {isGenerating
                    ? t('designer.generating')
                    : t('designer.generate')}
                </button>
              </div>

              {designPreparation && !error && (
                <div
                  style={{
                    display: 'grid',
                    gap: 10,
                    padding: 16,
                    borderRadius: 20,
                    border:
                      '1px solid rgba(0,255,136,0.18)',
                    background:
                      'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,200,255,0.045)), rgba(255,255,255,0.04)',
                    color: 'rgba(245,247,248,0.78)',
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}
                  >
                    <strong
                      style={{
                        color:
                          designPreparation.machine_ready_score >=
                          75
                            ? '#9dffc4'
                            : '#ffe083',
                      }}
                    >
                      {t('designer.score')}{' '}
                      {
                        designPreparation.machine_ready_score
                      }
                      /100
                    </strong>
                    <span>
                      {designPreparation.max_colors}{' '}
                      {designPreparation.max_colors === 1
                        ? t('designer.colorSingular')
                        : t('designer.colorPlural')}{' '}
                      {t('designer.target')}
                    </span>
                  </div>

                  <div>
                    <strong
                      style={{
                        color: '#f5f7f8',
                      }}
                    >
                      {t('designer.simplifiedIdea')}
                    </strong>{' '}
                    {
                      designPreparation.simplified_description
                    }
                  </div>

                  {designPreparation.warnings.length > 0 && (
                    <div>
                      <strong
                        style={{
                          color: '#ffe083',
                        }}
                      >
                        {t('designer.watch')}
                      </strong>{' '}
                      {designPreparation.warnings
                        .slice(0, 2)
                        .join(' ')}
                    </div>
                  )}

                  <div>
                    <strong
                      style={{
                        color: '#9dffc4',
                      }}
                    >
                      {t('designer.recommendation')}
                    </strong>{' '}
                    {designPreparation.recommendations
                      .slice(0, 2)
                      .join(' ')}
                  </div>
                </div>
              )}

              <button
                onClick={estimatePrice}
                disabled={isEstimating || isAnalyzing}
                className="lux-button"
                style={{
                  ...primaryButton,
                  border: 'none',
                  width: '100%',
                }}
              >
                {isAnalyzing
                  ? t('designer.prepareLogo')
                  : isEstimating
                    ? t('designer.calculating')
                    : t('designer.getClearPrice')}
              </button>

              {(status || error) && (
                <div
                  style={{
                    fontSize: 14,
                    color: error
                      ? '#ffb4b4'
                      : '#9dffc4',
                  }}
                >
                  {error || status}
                </div>
              )}

              {logoAnalysis && !error && (
                <div
                  style={{
                    display: 'grid',
                    gap: 8,
                    padding: 14,
                    borderRadius: 18,
                    border:
                      '1px solid rgba(255,255,255,0.10)',
                    background:
                      'rgba(255,255,255,0.045)',
                    color: 'rgba(245,247,248,0.78)',
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}
                  >
                    <strong
                      style={{
                        color:
                          logoAnalysis.colors_count <=
                          PRACTICAL_THREAD_COLOR_LIMIT
                            ? '#9dffc4'
                            : '#ffe083',
                      }}
                    >
                      {logoAnalysis.colors_count <=
                      PRACTICAL_THREAD_COLOR_LIMIT
                        ? t('designer.readyForEmbroidery')
                        : t('designer.needsReview')}
                    </strong>
                    <span>
                      {logoAnalysis.colors_count}{' '}
                      {logoAnalysis.colors_count === 1
                        ? t('designer.colorSingular')
                        : t('designer.colorPlural')}
                    </span>
                    <span>
                      {t('designer.contrast')} {logoAnalysis.contrast_score}
                      /100
                    </span>
                  </div>
                  <div
                    style={{
                      color: 'rgba(157,255,196,0.74)',
                      fontSize: 12,
                    }}
                  >
                    {t('designer.paletteHelp')}
                  </div>

                  {logoAnalysis.warnings.length > 0 && (
                    <div>
                      {logoAnalysis.warnings
                        .slice(0, 2)
                        .join(' ')}
                    </div>
                  )}
                </div>
              )}

              {publicQuote && (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit,minmax(120px,1fr))',
                      gap: 12,
                      marginTop: 12,
                    }}
                  >
                    <Metric
                      label={t('designer.stitches')}
                      value={publicQuote.stitches.toLocaleString()}
                    />

                    <Metric
                      label={t('designer.colors')}
                      value={publicQuote.colors}
                      helper={
                        publicQuote.colors > 6
                          ? t('designer.bestResult')
                          : t('designer.bestPrice')
                      }
                    />

                    <Metric
                      label={t('designer.coverage')}
                      value={`${(
                        publicQuote.coverage *
                        100
                      ).toFixed(1)}%`}
                    />

                    <Metric
                      label={t('designer.price')}
                      value={
                        publicQuote.manual_quote
                          ? t('hero.manualQuote')
                          : `€${publicQuote.price_eur}`
                      }
                    />
                  </div>

                  <div
                    style={{
                      ...analysisPanel,
                      marginTop: 12,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                      }}
                    >
                      <strong
                        style={{
                          color: publicQuote.manual_quote
                            ? '#ffe083'
                            : '#9dffc4',
                        }}
                      >
                        {publicQuote.manual_quote
                          ? t('designer.manualQuoteNeeded')
                          : t('designer.clearPrice')}
                      </strong>
                      <span>
                        {formatPricingTier(publicQuote.pricing_tier, t)}
                      </span>
                    </div>

                    <div>
                      {publicQuote.manual_quote
                        ? t('designer.manualQuoteText')
                        : publicQuote.customer_warnings[0] ??
                          t('designer.readyText')}
                    </div>

                    {publicQuote.customer_warnings.length > 1 && (
                      <div>
                        {publicQuote.customer_warnings
                          .slice(1, 3)
                          .join(' ')}
                      </div>
                    )}

                    {publicQuote.customer_recommendations.length > 0 && (
                      <div
                        style={{
                          color: 'rgba(157,255,196,0.74)',
                          fontSize: 12,
                        }}
                      >
                        {publicQuote.customer_recommendations
                          .slice(0, 2)
                          .join(' ')}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setOrderOpen((open) => !open);
                      setOrderError('');
                      setOrderStatus('');
                    }}
                    className="lux-button"
                    style={{
                      ...primaryButton,
                      border: 'none',
                      width: '100%',
                      marginTop: 12,
                    }}
                  >
                    {t('designer.requestOrder')}
                  </button>

                  {orderOpen && (
                    <form
                      noValidate
                      onSubmit={(event) => void requestOrder(event)}
                      style={{
                        ...analysisPanel,
                        marginTop: 12,
                        gap: 12,
                      }}
                    >
                      <strong
                        style={{
                          color: '#f5f7f8',
                        }}
                      >
                        {t('designer.sendOrderRequest')}
                      </strong>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            'repeat(auto-fit,minmax(180px,1fr))',
                          gap: 10,
                        }}
                      >
                        <div style={fieldStack}>
                          <input
                            value={orderForm.name}
                            onChange={(event) =>
                              updateOrderFormField(
                                'name',
                                event.target.value
                              )
                            }
                            placeholder={t('designer.yourName')}
                            aria-label={t('designer.yourName')}
                            aria-invalid={Boolean(
                              orderFieldErrors.name
                            )}
                            style={{
                              ...input,
                              ...(orderFieldErrors.name
                                ? invalidInput
                                : {}),
                            }}
                          />
                          {orderFieldErrors.name && (
                            <span style={fieldError}>
                              {orderFieldErrors.name}
                            </span>
                          )}
                        </div>
                        <div style={fieldStack}>
                          <input
                            value={orderForm.email}
                            onChange={(event) =>
                              updateOrderFormField(
                                'email',
                                event.target.value
                              )
                            }
                            placeholder={t('designer.email')}
                            aria-label={t('designer.email')}
                            aria-invalid={Boolean(
                              orderFieldErrors.email
                            )}
                            type="email"
                            autoComplete="email"
                            style={{
                              ...input,
                              ...(orderFieldErrors.email
                                ? invalidInput
                                : {}),
                            }}
                          />
                          {orderFieldErrors.email && (
                            <span style={fieldError}>
                              {orderFieldErrors.email}
                            </span>
                          )}
                        </div>
                        <div style={fieldStack}>
                          <input
                            value={orderForm.phone}
                            onChange={(event) =>
                              updateOrderFormField(
                                'phone',
                                event.target.value
                              )
                            }
                            placeholder={t('designer.phone')}
                            aria-label={t('designer.phone')}
                            aria-invalid={Boolean(
                              orderFieldErrors.phone
                            )}
                            style={{
                              ...input,
                              ...(orderFieldErrors.phone
                                ? invalidInput
                                : {}),
                            }}
                          />
                          {orderFieldErrors.phone && (
                            <span style={fieldError}>
                              {orderFieldErrors.phone}
                            </span>
                          )}
                        </div>
                        <div style={fieldStack}>
                          <input
                            value={orderForm.quantity}
                            onChange={(event) =>
                              updateOrderFormField(
                                'quantity',
                                event.target.value
                              )
                            }
                            placeholder={t('designer.quantity')}
                            aria-label={t('designer.quantity')}
                            aria-invalid={Boolean(
                              orderFieldErrors.quantity
                            )}
                            type="number"
                            min="1"
                            step="1"
                            style={{
                              ...input,
                              ...(orderFieldErrors.quantity
                                ? invalidInput
                                : {}),
                            }}
                          />
                          {orderFieldErrors.quantity && (
                            <span style={fieldError}>
                              {orderFieldErrors.quantity}
                            </span>
                          )}
                        </div>
                      </div>

                      <textarea
                        value={orderForm.note}
                        onChange={(event) =>
                          updateOrderFormField(
                            'note',
                            event.target.value
                          )
                        }
                        placeholder={t('designer.studioNote')}
                        aria-label={t('designer.orderNoteAria')}
                        rows={3}
                        style={{
                          ...input,
                          resize: 'vertical',
                        }}
                      />

                      <button
                        type="submit"
                        disabled={isRequestingOrder}
                        className="lux-button"
                        style={{
                          ...primaryButton,
                          border: 'none',
                          width: '100%',
                          opacity: isRequestingOrder ? 0.68 : 1,
                        }}
                      >
                        {isRequestingOrder
                          ? t('designer.sending')
                          : t('designer.sendRequest')}
                      </button>
                      {orderError && (
                        <div style={formError}>{orderError}</div>
                      )}
                    </form>
                  )}

                  {orderStatus && (
                    <div
                      style={{
                        fontSize: 13,
                        color: '#9dffc4',
                        marginTop: 10,
                      }}
                    >
                      {orderStatus}
                    </div>
                  )}
                </>
              )}
            </div>
          </HoverCard>

          <DesignerPreview
            preview={preview}
            preset={preset}
            placementLabel={
              placement === 'left'
                ? t('placement.left')
                : t('placement.center')
            }
            previewTopLabel={t('designer.previewTopLabel')}
            logoLabel={t('designer.logo')}
            teeColor={teeColor}
          />
        </div>
      </section>

      <section id="how" style={sectionStyle}>
        <SectionHeader
          eyebrow={t('sections.processEyebrow')}
          title={t('sections.processTitle')}
          text={t('sections.processText')}
        />

        <div style={fourGrid}>
          {processSteps.map((step) => (
            <StepCard
              key={step.number}
              number={step.number}
              icon={step.icon}
              title={step.title}
              text={step.text}
              accent={step.accent}
            />
          ))}
        </div>
      </section>

      <section id="features" style={sectionStyle}>
        <SectionHeader
          eyebrow={t('sections.featuresEyebrow')}
          title={t('sections.featuresTitle')}
          text={t('sections.featuresText')}
        />

        <div style={fourGrid}>
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              text={feature.text}
              accent={feature.accent}
              footer={feature.footer}
            />
          ))}
        </div>
      </section>

      <section id="craft" style={sectionStyle}>
        <div className="production-layout">
          <div className="craft-copy-panel">
            <div style={sectionEyebrow}>
              {t('sections.craftEyebrow')}
            </div>

            <h2 style={sectionTitle}>
              {t('sections.craftTitle')}
            </h2>

            <p style={sectionText}>
              {t('sections.craftText')}
            </p>

            <div className="production-stat-grid">
              {craftStats.map((stat) => (
                <div
                  key={stat.label}
                  className="glow-card production-stat-card"
                >
                  <span>{stat.value}</span>
                  <small>{stat.label}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="production-bento">
            <div className="glow-card production-photo-card production-photo-main">
              {/* Premium craft close-up image from the local launch asset set. */}
              <Image
                src={homepageImages.stitchFinish}
                alt="Close-up embroidery detail with fabric texture"
                fill
                sizes="(max-width: 900px) 100vw, 620px"
                className="production-image"
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
              />
              <div className="production-photo-overlay" />
              <div className="production-photo-badge">
                <strong>{t('craft.mainTitle')}</strong>
                <span>{t('craft.mainText')}</span>
              </div>
            </div>

            <div className="glow-card production-mini-card production-thread-card">
              {/* Thread detail image from the local launch asset set. */}
              <Image
                src={homepageImages.threadDetail}
                alt="Close-up thread detail and fabric texture"
                fill
                sizes="(max-width: 900px) 100vw, 300px"
                className="production-image"
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
              />
              <div className="production-photo-overlay" />
              <div className="production-mini-copy">
                <span>{t('craft.threadTitle')}</span>
                <strong>{t('craft.threadText')}</strong>
              </div>
            </div>

            <div className="glow-card production-mini-card production-gallery-card">
              {/* Fabric texture image from the local launch asset set. */}
              <Image
                src={homepageImages.artworkPreview}
                alt="Abstract close-up fabric texture for artwork preview"
                fill
                sizes="(max-width: 900px) 100vw, 300px"
                className="production-image"
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
              />
              <div className="production-photo-overlay" />
              <div className="production-mini-copy">
                <span>{t('craft.artworkTitle')}</span>
                <strong>{t('craft.artworkText')}</strong>
              </div>
            </div>

            <div className="glow-card production-mini-card production-workflow-card">
              {/* Machine detail image from the local launch asset set. */}
              <Image
                src={homepageImages.machineDetail}
                alt="Machine detail showing a streamlined fashion-tech embroidery workflow"
                fill
                sizes="(max-width: 900px) 100vw, 300px"
                className="production-image"
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
              />
              <div className="production-photo-overlay" />
              <div className="production-mini-copy">
                <span>{t('craft.workflowTitle')}</span>
                <strong>{t('craft.workflowText')}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="gallery" style={sectionStyle}>
        <SectionHeader
          eyebrow={t('sections.galleryEyebrow')}
          title={t('sections.galleryTitle')}
          text={t('sections.galleryText')}
        />

        <div style={galleryGrid}>
          {galleryItems.map((item) => (
            <GalleryCard
              key={item.title}
              title={item.title}
              text={item.text}
              accent={item.accent}
              image={item.image}
            />
          ))}
        </div>
      </section>

      <section id="pricing" style={sectionStyle}>
        <SectionHeader
          eyebrow={t('sections.pricingEyebrow')}
          title={t('sections.pricingTitle')}
          text={t('sections.pricingText')}
        />

        <div
          className="glow-card"
          style={pricingPanel}
        >
          <div style={priceGrid}>
            <PriceBlock label={t('pricing.leftChest')} value={t('pricing.from9')} />
            <PriceBlock label={t('pricing.badgeDetail')} value={t('pricing.calculatedAfterUpload')} />
            <PriceBlock label={t('pricing.frontDesign')} value={t('pricing.from13')} />
            <PriceBlock label={t('pricing.manualQuote')} value={t('pricing.studioReview')} highlight />
          </div>

          <div className="pricing-example">
            <div>
              <strong>{t('pricing.exampleQuote')}</strong>
              <span>{t('pricing.exampleText')}</span>
            </div>
            <strong>
              {publicQuote
                ? publicQuote.manual_quote
                  ? t('hero.manualQuote')
                  : `€${publicQuote.price_eur}`
                : t('pricing.uploadForQuote')}
            </strong>
          </div>

          <a
            href="#designer"
            className="lux-button"
            style={wideButton}
          >
            {t('pricing.getClearPrice')}
          </a>
        </div>
      </section>

      <section id="faq" style={sectionStyle}>
        <SectionHeader
          eyebrow={t('sections.faqEyebrow')}
          title={t('sections.faqTitle')}
          text={t('sections.faqText')}
        />

        <div className="faq-grid">
          {faqItems.map((item) => (
            <div
              key={item.question}
              className="glow-card faq-card"
            >
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={ctaSection}>
        <div
          className="glow-card final-cta-card"
        >
          <div style={sectionEyebrow}>
            {t('sections.ready')}
          </div>

          <h2 style={ctaTitle}>
            {t('sections.ctaTitle')}
          </h2>

          <p style={ctaText}>
            {t('sections.ctaText')}
          </p>

          <a
            href="#designer"
            className="lux-button"
            style={primaryButton}
          >
            {t('nav.start')}
          </a>
        </div>
      </section>

      <footer style={footerStyle}>
        <div style={footerInner}>
          <a
            href="#hero"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: 'rgba(245,247,248,0.66)',
              textDecoration: 'none',
            }}
          >
            <Image
              src="/stitchra-mark.svg"
              alt=""
              width={34}
              height={34}
            />
            <span><strong style={{ color: '#f5f7f8' }}>Stitchra</strong> · {t('footer.tagline')}</span>
          </a>

          <div style={footerLinks}>
            <a href="#how" style={footerLink}>{t('footer.how')}</a>
            <a href="#features" style={footerLink}>{t('footer.features')}</a>
            <a href="#pricing" style={footerLink}>{t('footer.pricing')}</a>
            <a href="#faq" style={footerLink}>{t('footer.faq')}</a>
            <a href="https://stitchra.com/impressum" style={footerLink}>{t('footer.impressum')}</a>
            <a href="https://stitchra.com/privacy" style={footerLink}>{t('footer.privacy')}</a>
            <a href="https://stitchra.com/contact" style={footerLink}>{t('footer.contact')}</a>
            <a href="https://stitchra.com/terms" style={footerLink}>{t('footer.terms')}</a>
            <span>© 2026 Stitchra</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Header({
  locale,
  t,
}: {
  locale: Locale;
  t: Translator;
}) {
  const navItems = getNavItems(t);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 50,
        backdropFilter: 'blur(22px)',
        background:
          'rgba(0,0,0,0.35)',
        borderBottom:
          '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <nav
        className="site-nav"
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          height: 86,
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            'space-between',
          padding: '0 24px',
        }}
      >
        <a
          href="#hero"
          className="header-brand"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            textDecoration: 'none',
          }}
        >
          <Image
            src="/stitchra-mark.svg"
            alt="Stitchra"
            className="header-mark"
            width={58}
            height={58}
            style={{
              width: 58,
              height: 58,
              borderRadius: 20,
              boxShadow:
                '0 0 45px rgba(0,255,136,0.35)',
            }}
            priority
          />

          <div className="header-wordmark">
            <Image
              src="/stitchra-wordmark.svg"
              alt="Stitchra AI embroidery platform"
              width={188}
              height={50}
              style={{
                display: 'block',
                width: 188,
                height: 'auto',
                filter:
                  'drop-shadow(0 0 18px rgba(0,255,136,0.20))',
              }}
              priority
            />
          </div>
        </a>

        <div
          className="header-links"
          style={{
            display: 'flex',
            gap: 26,
            alignItems: 'center',
          }}
        >
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={navLink}
            >
              {item.label}
            </a>
          ))}

          <LanguageSwitcher locale={locale} t={t} />

          <a
            href="#designer"
            className="lux-button"
            style={primaryButton}
          >
            {t('nav.start')}
          </a>
        </div>
      </nav>
    </header>
  );
}

function LanguageSwitcher({
  locale,
  t,
}: {
  locale: Locale;
  t: Translator;
}) {
  const [open, setOpen] = useState(false);

  const switchLocale = (nextLocale: Locale) => {
    const currentPath = window.location.pathname;
    const hash = window.location.hash;
    const segments = currentPath.split('/').filter(Boolean);
    const rest =
      segments[0] && locales.includes(segments[0] as Locale)
        ? segments.slice(1)
        : [];
    const nextPath = `/${nextLocale}${rest.length ? `/${rest.join('/')}` : ''}`;

    setOpen(false);
    window.location.assign(`${nextPath}${hash}`);
  };

  return (
    <div style={languageSwitcher}>
      <button
        type="button"
        aria-label={t('nav.language')}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        style={languageButton}
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="1.7"
          />
        </svg>
        <span>{localeLabels[locale].code}</span>
      </button>

      {open && (
        <div style={languageMenu}>
          {locales.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => switchLocale(item)}
              style={languageOption(item === locale)}
            >
              <span>{localeLabels[item].name}</span>
              <strong>{localeLabels[item].code}</strong>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MannequinPreview({
  preview,
  preset,
  placementLabel,
  previewTopLabel,
  logoLabel,
  teeColor,
}: {
  preview: string | null;
  preset: {
    label: string;
    size: string;
  };
  placementLabel: string;
  previewTopLabel: string;
  logoLabel: string;
  teeColor: TeeColor;
}) {
  const [mouse, setMouse] = useState({
    x: 0,
    y: 0,
    active: false,
  });

  const isWhite = teeColor === 'white';
  const rotateX = mouse.active ? mouse.y * -5 : 0;
  const rotateY = mouse.active ? mouse.x * 7 : 0;
  const lightX = mouse.active ? 50 + mouse.x * 18 : 50;
  const lightY = mouse.active ? 30 + mouse.y * 12 : 30;
  const placementLeft =
    preset.label === 'Center front' ? '50%' : '60%';
  const placementTop =
    preset.label === 'Center front' ? 190 : 128;
  const placementWidth =
    preset.label === 'Center front' ? 190 : 112;
  const placementHeight =
    preset.label === 'Center front' ? 148 : 72;
  const shirtSurface = isWhite
    ? 'radial-gradient(circle at 38% 18%, rgba(255,255,255,0.92), transparent 18%), linear-gradient(145deg,#fffdf7 0%,#dedbd2 46%,#f7f3ea 100%)'
    : 'radial-gradient(circle at 38% 18%, rgba(255,255,255,0.12), transparent 18%), linear-gradient(145deg,#101719 0%,#111514 45%,#030404 100%)';
  const sleeveSurface = isWhite
    ? 'linear-gradient(145deg,#fbf7ec,#d6d2c8 54%,#f5f1e8)'
    : 'linear-gradient(145deg,#0b1011,#18201f 55%,#030404)';
  const seamColor = isWhite
    ? 'rgba(35,31,26,0.14)'
    : 'rgba(255,255,255,0.10)';
  const logoBlend: CSSProperties['mixBlendMode'] = isWhite
    ? 'multiply'
    : 'screen';
  const placementBorder = preview
    ? '1px solid rgba(124,240,212,0.30)'
    : '1px solid rgba(124,240,212,0.86)';
  const placementGlow = preview
    ? '0 0 18px rgba(124,240,212,0.22), 0 0 58px rgba(0,200,255,0.10), inset 0 0 16px rgba(124,240,212,0.08)'
    : '0 0 28px rgba(124,240,212,0.58), 0 0 80px rgba(0,200,255,0.18), inset 0 0 26px rgba(124,240,212,0.14)';

  return (
    <div
      className="designer-preview-card"
      onMouseMove={(event) => {
        const rect =
          event.currentTarget.getBoundingClientRect();
        const x =
          (event.clientX - rect.left) / rect.width - 0.5;
        const y =
          (event.clientY - rect.top) / rect.height - 0.5;

        setMouse({
          x,
          y,
          active: true,
        });
      }}
      onMouseLeave={() =>
        setMouse({
          x: 0,
          y: 0,
          active: false,
        })
      }
      style={{
        position: 'relative',
        minHeight: 650,
        borderRadius: 36,
        overflow: 'hidden',
        background:
          `radial-gradient(circle at ${lightX}% ${lightY}%, rgba(124,240,212,0.20), transparent 18%), linear-gradient(145deg,rgba(3,5,7,0.98),rgba(8,15,17,0.94) 48%,rgba(2,3,5,0.98))`,
        border:
          '1px solid rgba(255,255,255,0.10)',
        boxShadow:
          '0 44px 130px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.08)',
        isolation: 'isolate',
        perspective: 1100,
        transition:
          'background 180ms ease, box-shadow 180ms ease',
      }}
    >
      <style>
        {`
          @keyframes stitchraTorsoFloat {
            0%, 100% { transform: translate3d(0, 0, 0); }
            50% { transform: translate3d(0, -14px, 0); }
          }

          @keyframes stitchraBreath {
            0%, 100% { transform: translateX(-50%) translateZ(58px) scale3d(1, 1, 1); filter: brightness(1); }
            50% { transform: translateX(-50%) translateZ(58px) scale3d(1.015, 1.008, 1); filter: brightness(1.045); }
          }

          @keyframes stitchraGlow {
            0%, 100% { opacity: 0.52; transform: scale(1); }
            50% { opacity: 0.92; transform: scale(1.045); }
          }

          @keyframes stitchraThread {
            0% { background-position: 0 0; }
            100% { background-position: 72px 72px; }
          }

          @keyframes stitchraFabric {
            0% { opacity: 0.26; transform: translateX(-10px); }
            50% { opacity: 0.38; transform: translateX(10px); }
            100% { opacity: 0.26; transform: translateX(-10px); }
          }
        `}
      </style>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage:
            'radial-gradient(circle at 50% 45%, black, transparent 78%)',
          transform:
            `translate3d(${mouse.x * -10}px, ${mouse.y * -10}px, 0)`,
          transition: 'transform 120ms ease',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: '14% 5% 7%',
          background:
            'radial-gradient(ellipse at center, rgba(124,240,212,0.20), transparent 55%)',
          filter: 'blur(28px)',
          opacity: 0.72,
          animation:
            'stitchraGlow 4.6s ease-in-out infinite',
        }}
      />

      <div
        className="designer-preview-label"
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          right: 20,
          padding: '10px 16px',
          borderRadius: 16,
          background:
            'rgba(0,0,0,0.45)',
          border:
            '1px solid rgba(255,255,255,0.08)',
          fontSize: 13,
          textAlign: 'center',
          zIndex: 4,
          boxShadow:
            '0 18px 45px rgba(0,0,0,0.32)',
        }}
      >
        {previewTopLabel} · {placementLabel} · {preset.size}
      </div>

      <div
        className="designer-preview-torso"
        style={{
          position: 'absolute',
          left: '50%',
          top: 72,
          transform:
            `translateX(-50%) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          width: 420,
          height: 520,
          transformStyle: 'preserve-3d',
          transition:
            'transform 140ms ease-out',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            animation:
              'stitchraTorsoFloat 6s ease-in-out infinite',
            transformStyle: 'preserve-3d',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 10,
              transform:
                'translateX(-50%) translateZ(-42px)',
              width: 320,
              height: 58,
              borderRadius: '50%',
              background:
                'radial-gradient(ellipse at center, rgba(0,0,0,0.66), transparent 68%)',
              filter: 'blur(12px)',
              opacity: 0.9,
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: 20,
              top: 122,
              width: 128,
              height: 255,
              borderRadius:
                '52px 22px 44px 68px',
              background: sleeveSurface,
              clipPath:
                'polygon(42% 0, 100% 15%, 78% 100%, 18% 91%, 0 24%)',
              boxShadow:
                'inset 18px 22px 32px rgba(255,255,255,0.08), inset -24px -30px 46px rgba(0,0,0,0.42), 0 34px 70px rgba(0,0,0,0.42)',
              transform:
                'rotate(7deg) translateZ(18px)',
            }}
          />

          <div
            style={{
              position: 'absolute',
              right: 20,
              top: 122,
              width: 128,
              height: 255,
              borderRadius:
                '22px 52px 68px 44px',
              background: sleeveSurface,
              clipPath:
                'polygon(0 15%, 58% 0, 100% 24%, 82% 91%, 22% 100%)',
              boxShadow:
                'inset 18px 22px 32px rgba(255,255,255,0.08), inset -24px -30px 46px rgba(0,0,0,0.42), 0 34px 70px rgba(0,0,0,0.42)',
              transform:
                'rotate(-7deg) translateZ(18px)',
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 62,
              transform:
                'translateX(-50%) translateZ(58px)',
              width: 340,
              height: 440,
              borderRadius:
                '92px 92px 42px 42px / 86px 86px 34px 34px',
              background: shirtSurface,
              clipPath:
                'polygon(17% 0, 35% 0, 42% 12%, 58% 12%, 65% 0, 83% 0, 98% 22%, 87% 100%, 13% 100%, 2% 22%)',
              boxShadow: isWhite
                ? 'inset 24px 22px 38px rgba(255,255,255,0.70), inset -36px -42px 60px rgba(120,112,98,0.34), 0 56px 115px rgba(0,0,0,0.48), 0 0 74px rgba(124,240,212,0.13)'
                : 'inset 24px 22px 42px rgba(255,255,255,0.055), inset -38px -48px 66px rgba(0,0,0,0.66), 0 56px 115px rgba(0,0,0,0.58), 0 0 78px rgba(124,240,212,0.13)',
              animation:
                'stitchraBreath 5.8s ease-in-out infinite',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage:
                  'linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.18) 18%, transparent 34%), repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 7px), repeating-linear-gradient(0deg, rgba(0,0,0,0.035) 0 1px, transparent 1px 9px)',
                opacity: isWhite ? 0.44 : 0.26,
                animation:
                  'stitchraFabric 8s ease-in-out infinite',
                pointerEvents: 'none',
              }}
            />

            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                transform: 'translateX(-50%)',
                width: 112,
                height: 64,
                borderRadius:
                  '0 0 999px 999px',
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0.72), rgba(0,0,0,0.34))',
                boxShadow:
                  '0 10px 24px rgba(0,0,0,0.38), inset 0 -9px 16px rgba(255,255,255,0.05)',
              }}
            />

            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: 46,
                transform: 'translateX(-50%)',
                width: 152,
                height: 1,
                background: seamColor,
                boxShadow: `0 22px 0 ${seamColor}`,
              }}
            />

            <div
              style={{
                position: 'absolute',
                left: placementLeft,
                top: placementTop,
                transform: 'translateX(-50%)',
                width: placementWidth,
                height: placementHeight,
                border: placementBorder,
                borderRadius: 18,
                display: 'grid',
                placeItems: 'center',
                overflow: 'hidden',
                boxShadow: placementGlow,
                background: preview
                  ? 'transparent'
                  : 'linear-gradient(135deg, rgba(124,240,212,0.13), rgba(0,0,0,0.08))',
                animation:
                  preview
                    ? 'none'
                    : 'stitchraGlow 3.2s ease-in-out infinite',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage:
                    'linear-gradient(45deg, rgba(124,240,212,0.18) 25%, transparent 25%, transparent 50%, rgba(124,240,212,0.18) 50%, rgba(124,240,212,0.18) 75%, transparent 75%, transparent)',
                  backgroundSize: '18px 18px',
                  opacity: preview
                    ? isWhite
                      ? 0.1
                      : 0.12
                    : isWhite
                      ? 0.24
                      : 0.34,
                  animation:
                    'stitchraThread 7s linear infinite',
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              />

              {preview ? (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 14,
                    overflow: 'hidden',
                    isolation: 'isolate',
                    background: 'transparent',
                    WebkitMaskImage:
                      'radial-gradient(ellipse at center, black 68%, rgba(0,0,0,0.86) 82%, transparent 100%)',
                    maskImage:
                      'radial-gradient(ellipse at center, black 68%, rgba(0,0,0,0.86) 82%, transparent 100%)',
                    zIndex: 1,
                  }}
                >
                  <Image
                    src={preview}
                    alt="logo"
                    fill
                    unoptimized
                    style={{
                      objectFit: 'contain',
                      mixBlendMode: logoBlend,
                      opacity: isWhite ? 0.86 : 0.82,
                      padding: 7,
                      filter: isWhite
                        ? 'contrast(1.18) saturate(0.95) brightness(0.98) drop-shadow(0 1px 2px rgba(0,0,0,0.20))'
                        : 'contrast(1.55) saturate(1.20) brightness(0.78) drop-shadow(0 0 10px rgba(124,240,212,0.36))',
                      background: 'transparent',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage:
                        'repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0 1px, transparent 1px 5px), repeating-linear-gradient(0deg, rgba(0,0,0,0.13) 0 1px, transparent 1px 6px)',
                      mixBlendMode: isWhite
                        ? 'multiply'
                        : 'screen',
                      opacity: isWhite ? 0.22 : 0.14,
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage:
                        'repeating-linear-gradient(-18deg, rgba(124,240,212,0.16) 0 1px, transparent 1px 7px)',
                      mixBlendMode: isWhite
                        ? 'multiply'
                        : 'screen',
                      opacity: isWhite ? 0.14 : 0.22,
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              ) : (
                <span
                  style={{
                    color: isWhite
                      ? 'rgba(8,12,14,0.48)'
                      : 'rgba(224,255,244,0.72)',
                    fontSize: 13,
                    fontWeight: 850,
                    letterSpacing: 0,
                    textTransform: 'uppercase',
                    zIndex: 1,
                  }}
                >
                  {logoLabel}
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: -2,
              transform:
                'translateX(-50%) translateZ(40px)',
              width: 285,
              height: 30,
              borderRadius: '50%',
              background:
                'linear-gradient(90deg, transparent, rgba(124,240,212,0.24), transparent)',
              filter: 'blur(20px)',
              opacity: 0.8,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function DesignerPreview({
  preview,
  preset,
  placementLabel,
  previewTopLabel,
  logoLabel,
  teeColor,
}: {
  preview: string | null;
  preset: {
    label: string;
    size: string;
  };
  placementLabel: string;
  previewTopLabel: string;
  logoLabel: string;
  teeColor: TeeColor;
}) {
  return (
    <MannequinPreview
      preview={preview}
      preset={preset}
      placementLabel={placementLabel}
      previewTopLabel={previewTopLabel}
      logoLabel={logoLabel}
      teeColor={teeColor}
    />
  );
}

function GlobalVisualStyles() {
  return (
    <style>
      {`
        html {
          scroll-behavior: smooth;
          scroll-padding-top: 112px;
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        section[id] {
          scroll-margin-top: 112px;
        }

        #gallery {
          scroll-margin-top: 112px;
        }

        ::selection {
          background: rgba(0,255,136,0.26);
          color: #ffffff;
        }

        button,
        input,
        select {
          font: inherit;
        }

        a:focus-visible,
        button:focus-visible,
        input:focus-visible,
        select:focus-visible {
          outline: 2px solid rgba(0,215,255,0.78);
          outline-offset: 4px;
        }

        .stitchra-file-input {
          min-height: 52px;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.045);
          color: rgba(245,247,248,0.78);
          line-height: 1.35;
        }

        .stitchra-file-input::file-selector-button {
          margin-right: 14px;
          min-height: 30px;
          padding: 0 14px;
          border: 0;
          border-radius: 10px;
          background: linear-gradient(135deg, #f7fff9, #dff7ff);
          color: #06100a;
          font-weight: 850;
          cursor: pointer;
        }

        .designer-section {
          scroll-margin-top: 112px;
        }

        .designer-grid,
        .designer-controls-card,
        .designer-stat-grid,
        .shirt-color-grid,
        .designer-prompt-row {
          min-width: 0;
        }

        .designer-controls-card {
          overflow: hidden !important;
        }

        .designer-prompt-row {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(150px, 180px);
          align-items: stretch;
        }

        .designer-prompt-row input {
          min-width: 0;
        }

        .designer-preview-card {
          width: 100%;
        }

        .designer-preview-label {
          max-width: calc(100% - 40px);
        }

        .glow-card {
          --card-glow: rgba(0,255,136,0.12);
          position: relative;
          overflow: visible !important;
          isolation: isolate;
          transition:
            transform 220ms ease,
            border-color 220ms ease,
            box-shadow 220ms ease,
            background 220ms ease;
        }

        .glow-card::before {
          content: "";
          position: absolute;
          inset: -42px;
          pointer-events: none;
          z-index: -1;
          opacity: 0.16;
          background:
            radial-gradient(circle at 50% 0%, var(--card-glow), rgba(0,212,255,0.08) 34%, transparent 68%);
          filter: blur(48px);
          transform: translateZ(0);
          transition:
            opacity 220ms ease,
            filter 220ms ease;
        }

        .glow-card::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          border-radius: inherit;
          padding: 1px;
          background:
            linear-gradient(135deg, rgba(255,255,255,0.10), transparent 28%, rgba(0,200,255,0.10));
          opacity: 0.34;
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }

        .glow-card:hover {
          transform: translateY(-3px);
          border-color: rgba(124,240,212,0.24) !important;
          box-shadow:
            0 28px 92px rgba(0,0,0,0.48),
            inset 0 1px 0 rgba(255,255,255,0.12) !important;
        }

        .glow-card:hover::before {
          opacity: 0.24;
        }

        .glow-card > :not(img):not(.production-photo-overlay):not(.production-photo-badge):not(.production-mini-copy):not(.gallery-image) {
          position: relative;
          z-index: 1;
        }

        .glow-card > img {
          z-index: 0;
        }

        .lux-button {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          transition:
            transform 180ms ease,
            box-shadow 180ms ease,
            filter 180ms ease;
        }

        .lux-button::before {
          content: "";
          position: absolute;
          inset: -45%;
          pointer-events: none;
          z-index: 0;
          opacity: 0;
          background:
            radial-gradient(circle, rgba(255,255,255,0.70), rgba(0,255,136,0.35) 24%, rgba(0,200,255,0.18) 42%, transparent 64%);
          transform: translateX(-25%);
          transition:
            opacity 180ms ease,
            transform 260ms ease;
          mix-blend-mode: soft-light;
        }

        .lux-button:hover {
          transform: translateY(-2px);
          filter: saturate(1.18);
          box-shadow:
            0 22px 64px rgba(0,255,136,0.22),
            0 18px 54px rgba(0,200,255,0.18);
        }

        .lux-button:hover::before {
          opacity: 1;
          transform: translateX(18%);
        }

        .production-layout {
          max-width: 1220px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(300px, 0.86fr) minmax(420px, 1.14fr);
          gap: clamp(28px, 5vw, 56px);
          align-items: start;
          min-width: 0;
        }

        .craft-copy-panel {
          min-width: 0;
          align-self: center;
        }

        .production-stat-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 32px;
        }

        .production-stat-card {
          min-height: 116px;
          padding: 22px;
          border-radius: 24px;
          border: 1px solid rgba(213,255,230,0.12);
          background:
            radial-gradient(circle at 24% 18%, rgba(0,255,136,0.12), transparent 34%),
            linear-gradient(145deg, rgba(255,255,255,0.065), rgba(255,255,255,0.025));
          overflow: hidden !important;
        }

        .production-stat-card span {
          display: block;
          color: #f5f7f8;
          font-size: clamp(24px, 3vw, 30px);
          font-weight: 950;
          letter-spacing: 0;
        }

        .production-stat-card small {
          display: block;
          margin-top: 8px;
          color: rgba(245,247,248,0.62);
          font-size: 13px;
          line-height: 1.45;
        }

        .production-bento {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-auto-rows: auto;
          gap: 18px;
          min-width: 0;
          width: 100%;
        }

        .production-photo-card,
        .production-mini-card {
          position: relative;
          overflow: hidden !important;
          min-width: 0;
          border: 1px solid rgba(213,255,230,0.12);
          background: rgba(255,255,255,0.04);
          contain: paint;
          box-shadow:
            0 34px 110px rgba(0,0,0,0.44),
            0 0 54px rgba(0,215,255,0.06),
            inset 0 1px 0 rgba(255,255,255,0.10);
        }

        .production-photo-card {
          border-radius: 34px;
        }

        .production-photo-main {
          grid-column: 1 / -1;
          min-height: 0;
          aspect-ratio: 16 / 9;
          grid-row: auto;
        }

        .production-mini-card {
          min-height: 0;
          aspect-ratio: 16 / 9;
          border-radius: 28px;
        }

        .production-thread-card {
          --card-glow: rgba(0,215,255,0.16);
        }

        .production-gallery-card {
          --card-glow: rgba(0,255,136,0.14);
        }

        .production-workflow-card {
          --card-glow: rgba(168,121,255,0.14);
        }

        .production-image {
          filter: saturate(0.88) contrast(1.08) brightness(0.82);
          transform: scale(1.015);
        }

        .production-mini-card span {
          color: #00d7ff;
          font-size: clamp(10px, 1vw, 12px);
          font-weight: 850;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          overflow-wrap: anywhere;
        }

        .production-mini-card strong {
          display: block;
          color: #f5f7f8;
          font-size: clamp(16px, 1.35vw, 20px);
          line-height: 1.22;
          overflow-wrap: anywhere;
          hyphens: auto;
        }

        .production-mini-copy {
          position: absolute;
          left: 18px;
          right: 18px;
          bottom: 18px;
          z-index: 2;
          display: grid;
          gap: 6px;
          min-width: 0;
          padding: 14px 15px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(5,6,7,0.56);
          backdrop-filter: blur(16px);
        }

        .production-photo-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.74)),
            radial-gradient(circle at 70% 18%, rgba(0,215,255,0.16), transparent 34%),
            radial-gradient(circle at 28% 82%, rgba(0,255,136,0.14), transparent 34%);
          pointer-events: none;
          z-index: 1;
        }

        .production-photo-badge {
          position: absolute;
          left: 18px;
          right: 18px;
          bottom: 18px;
          z-index: 2;
          display: grid;
          gap: 5px;
          padding: 16px 18px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(5,6,7,0.72);
          backdrop-filter: blur(18px);
        }

        .production-photo-badge strong {
          color: #f5f7f8;
          font-size: clamp(18px, 1.7vw, 22px);
          line-height: 1.15;
          overflow-wrap: anywhere;
        }

        .production-photo-badge span {
          color: rgba(245,247,248,0.64);
          font-size: 13px;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .gallery-card {
          min-height: 382px;
          padding: 22px;
          border-radius: 28px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          gap: 18px;
          overflow: hidden !important;
          min-width: 0;
        }

        .gallery-card::before {
          opacity: 0.18;
        }

        .gallery-card-with-image {
          padding-top: 22px;
        }

        .gallery-image {
          position: relative;
          width: 100%;
          height: 178px;
          flex: 0 0 178px;
          overflow: hidden;
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.08);
          opacity: 0.92;
          background: rgba(255,255,255,0.04);
        }

        .gallery-image::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.70)),
            radial-gradient(circle at 24% 16%, rgba(0,255,136,0.16), transparent 34%);
          pointer-events: none;
        }

        .gallery-mark {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.12);
          margin-top: -46px;
          margin-left: 14px;
          position: relative;
          z-index: 2;
        }

        .gallery-mark span {
          font-size: 20px;
          line-height: 1;
          font-weight: 950;
        }

        .gallery-copy {
          display: grid;
          gap: 0;
          min-width: 0;
        }

        .site-nav {
          width: 100%;
        }

        .pricing-example {
          margin-top: 18px;
          padding: 18px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.09);
          background:
            linear-gradient(90deg, rgba(0,255,136,0.10), rgba(0,215,255,0.08), rgba(255,40,214,0.08));
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: center;
        }

        .pricing-example strong {
          color: #f5f7f8;
          font-size: 18px;
        }

        .pricing-example span {
          display: block;
          margin-top: 4px;
          color: rgba(245,247,248,0.58);
          font-size: 13px;
        }

        .faq-grid {
          max-width: 980px;
          margin: 40px auto 0;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .faq-card {
          min-height: 174px;
          padding: 26px;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.04);
        }

        .faq-card h3 {
          margin: 0 0 12px;
          color: #f5f7f8;
          font-size: 18px;
        }

        .faq-card p {
          margin: 0;
          color: rgba(245,247,248,0.62);
          line-height: 1.65;
        }

        .final-cta-card {
          max-width: 980px;
          margin: 0 auto;
          padding: clamp(34px, 5vw, 58px);
          text-align: center;
          border-radius: 36px;
          border: 1px solid rgba(0,255,136,0.22);
          background:
            radial-gradient(circle at 22% 10%, rgba(0,255,136,0.18), transparent 34%),
            radial-gradient(circle at 82% 84%, rgba(0,215,255,0.16), transparent 34%),
            rgba(255,255,255,0.04);
          box-shadow:
            0 44px 130px rgba(0,0,0,0.46),
            inset 0 1px 0 rgba(255,255,255,0.10);
        }

        @media (max-width: 900px) {
          .header-links a:not(.lux-button) {
            display: none !important;
          }

          .header-brand {
            gap: 10px !important;
          }

          .production-layout {
            grid-template-columns: 1fr;
            gap: 34px;
          }

          .production-bento {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-template-rows: minmax(320px, auto) minmax(220px, auto);
            gap: 18px;
          }

          .production-photo-card,
          .production-photo-main {
            min-height: 340px;
            grid-row: auto;
          }

          .production-photo-main {
            grid-column: 1 / -1;
          }

          .production-mini-card {
            min-height: 240px;
          }

          .faq-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          html {
            scroll-padding-top: 92px;
          }

          section[id] {
            scroll-margin-top: 92px;
          }

          #hero {
            padding-top: 112px !important;
          }

          #designer {
            padding: 104px 16px 116px !important;
          }

          #craft,
          #gallery {
            padding: 88px 18px 76px !important;
          }

          #gallery {
            scroll-margin-top: 96px;
            padding-top: 96px !important;
          }

          #features {
            padding-top: 88px !important;
          }

          .site-nav {
            height: 74px !important;
            padding: 0 16px !important;
          }

          .header-wordmark {
            display: none !important;
          }

          .header-mark {
            width: 46px !important;
            height: 46px !important;
            border-radius: 16px !important;
          }

          .header-links .lux-button {
            min-height: 46px !important;
            padding: 0 15px !important;
            font-size: 13px !important;
            white-space: nowrap;
          }

          .header-brand {
            flex-shrink: 0;
          }

          .production-layout {
            gap: 28px;
          }

          .designer-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }

          .designer-controls-card {
            padding: 22px !important;
            border-radius: 24px !important;
          }

          .designer-stat-grid,
          .shirt-color-grid {
            grid-template-columns: 1fr !important;
          }

          .designer-prompt-row {
            grid-template-columns: 1fr !important;
          }

          .designer-prompt-row .lux-button {
            width: 100% !important;
            min-width: 0 !important;
          }

          .stitchra-file-input {
            padding: 10px;
            font-size: 13px;
          }

          .stitchra-file-input::file-selector-button {
            display: block;
            width: 100%;
            margin: 0 0 8px;
          }

          .designer-preview-card {
            min-height: 560px !important;
            border-radius: 28px !important;
          }

          .designer-preview-label {
            top: 16px !important;
            left: 16px !important;
            right: 16px !important;
            max-width: calc(100% - 32px);
            padding: 9px 12px !important;
            font-size: 12px !important;
          }

          .designer-preview-torso {
            top: 54px !important;
            width: min(360px, 112%) !important;
            height: 500px !important;
          }

          .craft-copy-panel {
            align-self: start;
          }

          .production-stat-grid {
            grid-template-columns: 1fr;
            gap: 16px;
            margin-top: 24px;
          }

          .production-stat-card {
            min-height: auto;
            padding: 22px;
            border-radius: 24px;
          }

          .production-bento {
            grid-template-columns: 1fr;
            grid-template-rows: none;
            gap: 24px;
          }

          .production-photo-card,
          .production-photo-main,
          .production-mini-card {
            width: 100%;
            min-height: 300px;
            border-radius: 28px;
          }

          .production-photo-main {
            min-height: 390px;
          }

          .production-photo-badge,
          .production-mini-copy {
            left: 16px;
            right: 16px;
            bottom: 16px;
            max-width: calc(100% - 32px);
          }

          .production-photo-badge {
            padding: 14px 15px;
            border-radius: 18px;
          }

          .production-mini-card strong {
            font-size: 18px;
            line-height: 1.25;
          }

          .production-proof-card {
            min-height: 220px;
            padding: 22px;
          }

          .proof-card-orbit {
            width: 62px;
            height: 62px;
            opacity: 0.70;
          }

          .gallery-card {
            width: 100%;
            min-height: auto;
            padding: 22px;
            border-radius: 28px;
            gap: 18px;
          }

          .gallery-card-with-image {
            padding-top: 22px;
          }

          .gallery-image {
            height: 190px;
            flex-basis: 190px;
            border-radius: 22px;
          }

          .gallery-mark {
            width: 50px;
            height: 50px;
            border-radius: 17px;
            margin-top: -42px;
            margin-left: 12px;
          }

          .gallery-mark span {
            font-size: 19px;
          }

          .gallery-card h3 {
            font-size: 19px !important;
            line-height: 1.2 !important;
            margin: 0 0 8px !important;
          }

          .gallery-card p {
            font-size: 14px !important;
            line-height: 1.55 !important;
          }

          .pricing-example {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}
    </style>
  );
}

function BackgroundEffects() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.026) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.026) 1px, transparent 1px)',
        backgroundSize: '96px 96px',
        maskImage:
          'linear-gradient(to bottom, black, transparent 86%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '10% -8% auto',
          height: 520,
          background:
            'radial-gradient(circle at 25% 35%, rgba(0,255,136,0.13), transparent 28%), radial-gradient(circle at 80% 26%, rgba(0,215,255,0.12), transparent 30%), radial-gradient(circle at 50% 82%, rgba(255,40,214,0.08), transparent 32%)',
          filter: 'blur(10px)',
        }}
      />
    </div>
  );
}

function HoverCard({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className ? `glow-card ${className}` : 'glow-card'}
      style={{
        transition:
          'transform 180ms ease, border-color 180ms ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={statCard}>
      <div style={statLabel}>{label}</div>
      <div style={statValue}>{value}</div>
    </div>
  );
}

function Metric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <div style={metricCard}>
      <div style={statLabel}>{label}</div>
      <div style={statValue}>{value}</div>
      {helper && (
        <div
          style={{
            color: 'rgba(157,255,196,0.64)',
            fontSize: 11,
            lineHeight: 1.35,
          }}
        >
          {helper}
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div style={sectionHeader}>
      <div style={sectionEyebrow}>
        {eyebrow}
      </div>

      <h2 style={sectionTitle}>
        {title}
      </h2>

      <p style={sectionText}>
        {text}
      </p>
    </div>
  );
}

function StepCard({
  number,
  icon,
  title,
  text,
  accent = 'green',
}: {
  number: string;
  icon: string;
  title: string;
  text: string;
  accent?: Accent;
}) {
  const colors = accentStyles[accent];

  return (
    <div
      className="glow-card"
      style={{
        ...stepCard,
        '--card-glow': colors.glow,
        border: `1px solid ${colors.border}`,
        background: colors.surface,
      } as CSSProperties}
    >
      <div style={stepTop}>
        <div
          style={{
            ...stepNumber,
            background: colors.soft,
            color: colors.main,
            boxShadow: `0 0 34px ${colors.glow}`,
          }}
        >
          {number}
        </div>

        <div
          style={{
            ...iconBox,
            background: colors.icon,
            color: colors.main,
          }}
        >
          {icon}
        </div>
      </div>

      <h3 style={cardTitle}>
        {title}
      </h3>

      <p style={cardText}>
        {text}
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
  accent,
  footer,
}: {
  icon: string;
  title: string;
  text: string;
  accent: Accent;
  footer: string;
}) {
  const colors = accentStyles[accent];

  return (
    <div
      className="glow-card"
      style={{
        ...featureCard,
        '--card-glow': colors.glow,
        border: `1px solid ${colors.border}`,
        background: colors.surface,
      } as CSSProperties}
    >
      <div
        style={{
          ...iconBox,
          width: 62,
          height: 62,
          borderRadius: 20,
          background: colors.icon,
          color: colors.main,
        }}
      >
        {icon}
      </div>

      <h3 style={cardTitle}>
        {title}
      </h3>

      <p style={cardText}>
        {text}
      </p>

      <div
        style={{
          marginTop: 22,
          paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          color: colors.main,
          fontSize: 13,
          fontWeight: 850,
        }}
      >
        {footer}
      </div>
    </div>
  );
}

function GalleryCard({
  title,
  text,
  accent,
  image,
}: {
  title: string;
  text: string;
  accent: Accent;
  image: string;
}) {
  const colors = accentStyles[accent];

  return (
    <div
      className="glow-card gallery-card gallery-card-with-image"
      style={{
        '--card-glow': colors.glow,
        border: `1px solid ${colors.border}`,
        background: colors.surface,
      } as CSSProperties}
    >
      <div className="gallery-image">
        <Image
          src={image}
          alt={`${title} embroidery texture`}
          fill
          sizes="(max-width: 640px) calc(100vw - 80px), (max-width: 1180px) 44vw, 260px"
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
      </div>

      <div className="gallery-copy">
        <div
          className="gallery-mark"
          style={{
            background: colors.icon,
            boxShadow: `0 0 42px ${colors.glow}`,
          }}
        >
          <span style={{ color: colors.main }}>S</span>
        </div>
        <h3 style={cardTitle}>{title}</h3>
        <p style={cardText}>{text}</p>
      </div>
    </div>
  );
}

function PriceBlock({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="glow-card"
      style={{
        ...priceBlock,
        border: highlight
          ? '1px solid rgba(0,255,136,0.34)'
          : priceBlock.border,
        background: highlight
          ? 'rgba(0,255,136,0.13)'
          : priceBlock.background,
      }}
    >
      <div style={priceLabel}>
        {label}
      </div>

      <div
        style={{
          ...priceValue,
          color: highlight ? '#00ff88' : priceValue.color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

type Accent = 'green' | 'cyan' | 'purple' | 'pink';

const accentStyles: Record<
  Accent,
  {
    main: string;
    soft: string;
    border: string;
    glow: string;
    icon: string;
    surface: string;
  }
> = {
  green: {
    main: '#00ff88',
    soft: 'rgba(0,255,136,0.13)',
    border: 'rgba(0,255,136,0.26)',
    glow: 'rgba(0,255,136,0.26)',
    icon: 'linear-gradient(135deg, rgba(0,255,136,0.30), rgba(0,200,160,0.12))',
    surface:
      'linear-gradient(145deg, rgba(10,17,16,0.82), rgba(4,7,8,0.90))',
  },
  cyan: {
    main: '#00d7ff',
    soft: 'rgba(0,215,255,0.14)',
    border: 'rgba(0,215,255,0.22)',
    glow: 'rgba(0,215,255,0.24)',
    icon: 'linear-gradient(135deg, rgba(0,215,255,0.30), rgba(70,120,255,0.16))',
    surface:
      'linear-gradient(145deg, rgba(7,14,18,0.82), rgba(4,7,10,0.90))',
  },
  purple: {
    main: '#a879ff',
    soft: 'rgba(168,121,255,0.14)',
    border: 'rgba(168,121,255,0.24)',
    glow: 'rgba(168,121,255,0.24)',
    icon: 'linear-gradient(135deg, rgba(168,121,255,0.32), rgba(255,40,214,0.14))',
    surface:
      'linear-gradient(145deg, rgba(12,10,18,0.82), rgba(6,6,10,0.90))',
  },
  pink: {
    main: '#ff28d6',
    soft: 'rgba(255,40,214,0.13)',
    border: 'rgba(255,40,214,0.22)',
    glow: 'rgba(255,40,214,0.24)',
    icon: 'linear-gradient(135deg, rgba(255,40,214,0.34), rgba(255,206,0,0.16))',
    surface:
      'linear-gradient(145deg, rgba(16,8,14,0.82), rgba(7,6,9,0.90))',
  },
};

function getNavItems(t: Translator) {
  return [
    { label: t('nav.how'), href: '#how' },
    { label: t('nav.pricing'), href: '#pricing' },
    { label: t('nav.gallery'), href: '#gallery' },
    { label: t('nav.features'), href: '#features' },
    { label: t('nav.faq'), href: '#faq' },
  ];
}

function getProcessSteps(locale: Locale): Array<{
  number: string;
  icon: string;
  title: string;
  text: string;
  accent: Accent;
}> {
  const copy = getLocalizedArray<{
    title: string;
    text: string;
  }>(locale, 'process');
  const meta = [
    { number: '01', icon: 'TEE', accent: 'green' as const },
    { number: '02', icon: 'AI', accent: 'cyan' as const },
    { number: '03', icon: '3D', accent: 'purple' as const },
    { number: '04', icon: '€', accent: 'pink' as const },
  ];

  return meta.map((item, index) => ({
    ...item,
    title: copy[index]?.title ?? '',
    text: copy[index]?.text ?? '',
  }));
}

function getFeatures(locale: Locale) {
  const copy = getLocalizedArray<{
    title: string;
    text: string;
    footer: string;
  }>(locale, 'features');
  const meta = [
    { icon: 'AI', accent: 'green' as const },
    { icon: 'FAB', accent: 'cyan' as const },
    { icon: 'PNG', accent: 'purple' as const },
    { icon: '€', accent: 'pink' as const },
  ];

  return meta.map((item, index) => ({
    ...item,
    title: copy[index]?.title ?? '',
    text: copy[index]?.text ?? '',
    footer: copy[index]?.footer ?? '',
  }));
}

function getGalleryItems(locale: Locale): Array<{
  title: string;
  text: string;
  accent: Accent;
  image: string;
}> {
  const copy = getLocalizedArray<{
    title: string;
    text: string;
  }>(locale, 'gallery');
  const meta = [
    { accent: 'green' as const, image: homepageImages.quietMonogram },
    { accent: 'cyan' as const, image: homepageImages.streetwearMark },
    { accent: 'purple' as const, image: homepageImages.patchBadge },
    { accent: 'pink' as const, image: homepageImages.minimalGraphic },
  ];

  return meta.map((item, index) => ({
    ...item,
    title: copy[index]?.title ?? '',
    text: copy[index]?.text ?? '',
  }));
}

function getCraftStats(locale: Locale) {
  return getLocalizedArray<{ value: string; label: string }>(
    locale,
    'craft.stats'
  );
}

function getFaqItems(locale: Locale) {
  return getLocalizedArray<{ question: string; answer: string }>(
    locale,
    'faq'
  );
}

const heroCard: CSSProperties = {
  padding: 48,
  borderRadius: 34,
  background:
    'linear-gradient(145deg,rgba(12,17,19,0.82),rgba(5,8,10,0.94))',
  border: '1px solid rgba(255,255,255,0.095)',
  boxShadow:
    '0 42px 130px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.08)',
  backdropFilter: 'blur(22px)',
};

const glassCard: CSSProperties = {
  ...heroCard,
  padding: 28,
  borderRadius: 28,
};

const sectionStyle: CSSProperties = {
  padding: '112px 24px',
  position: 'relative',
  zIndex: 1,
};

const sectionHeader: CSSProperties = {
  maxWidth: 760,
  margin: '0 auto',
  textAlign: 'center',
};

const sectionEyebrow: CSSProperties = {
  color: '#00ff88',
  fontSize: 12,
  fontWeight: 850,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  marginBottom: 10,
};

const sectionTitle: CSSProperties = {
  fontSize: 'clamp(36px, 5.4vw, 70px)',
  lineHeight: 0.98,
  letterSpacing: '-0.045em',
  margin: '0 0 14px',
  fontWeight: 950,
};

const sectionText: CSSProperties = {
  margin: 0,
  color: 'rgba(245,247,248,0.66)',
  fontSize: 17,
  lineHeight: 1.68,
};

const fourGrid: CSSProperties = {
  maxWidth: 1180,
  margin: '40px auto 0',
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 18,
};

const galleryGrid: CSSProperties = {
  maxWidth: 1180,
  margin: '42px auto 0',
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(250px, 1fr))',
  gap: 20,
  alignItems: 'stretch',
};

const featureCard: CSSProperties = {
  ...glassCard,
  minHeight: 252,
};

const stepCard: CSSProperties = {
  ...glassCard,
  minHeight: 300,
};

const stepTop: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 30,
};

const stepNumber: CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 14,
  background: 'rgba(0,255,136,0.13)',
  color: '#00ff88',
  display: 'grid',
  placeItems: 'center',
  fontSize: 22,
  fontWeight: 900,
};

const iconBox: CSSProperties = {
  width: 54,
  height: 54,
  borderRadius: 17,
  background:
    'linear-gradient(135deg, rgba(0,255,136,0.28), rgba(0,196,255,0.18))',
  border: '1px solid rgba(185,255,204,0.16)',
  boxShadow:
    '0 14px 36px rgba(0,0,0,0.30), 0 0 28px rgba(0,255,136,0.10)',
  display: 'grid',
  placeItems: 'center',
  fontSize: 14,
  fontWeight: 900,
  letterSpacing: '0.01em',
};

const cardTitle: CSSProperties = {
  margin: '0 0 10px',
  fontSize: 20,
  lineHeight: 1.2,
};

const cardText: CSSProperties = {
  margin: 0,
  color: 'rgba(245,247,248,0.62)',
  lineHeight: 1.65,
};

const pricingPanel: CSSProperties = {
  ...glassCard,
  maxWidth: 860,
  margin: '40px auto 0',
};

const priceGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 14,
};

const priceBlock: CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(255,255,255,0.08)',
  textAlign: 'center',
};

const priceLabel: CSSProperties = {
  color: 'rgba(245,247,248,0.58)',
  fontSize: 13,
  marginBottom: 6,
};

const priceValue: CSSProperties = {
  fontSize: 'clamp(20px, 2.7vw, 28px)',
  lineHeight: 1.12,
  fontWeight: 900,
  color: '#f5f7f8',
};

const ctaSection: CSSProperties = {
  padding: '92px 24px 120px',
  position: 'relative',
  zIndex: 1,
};

const ctaTitle: CSSProperties = {
  fontSize: 'clamp(32px, 5vw, 62px)',
  lineHeight: 1.02,
  margin: '0 0 16px',
  letterSpacing: '-0.03em',
  fontWeight: 900,
};

const ctaText: CSSProperties = {
  color: 'rgba(245,247,248,0.72)',
  fontSize: 17,
  marginBottom: 24,
};

const footerStyle: CSSProperties = {
  borderTop: '1px solid rgba(255,255,255,0.08)',
  padding: '34px 24px',
  position: 'relative',
  zIndex: 1,
  background: 'rgba(0,0,0,0.18)',
};

const footerInner: CSSProperties = {
  maxWidth: 1180,
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  flexWrap: 'wrap',
  color: 'rgba(245,247,248,0.66)',
  fontSize: 14,
};

const footerLinks: CSSProperties = {
  display: 'flex',
  gap: 18,
  flexWrap: 'wrap',
};

const primaryButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 52,
  padding: '0 22px',
  borderRadius: 16,
  color: '#06100a',
  background: 'linear-gradient(135deg,#00ff88,#00c8ff)',
  textDecoration: 'none',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 18px 50px rgba(0,200,255,0.2)',
};

const wideButton: CSSProperties = {
  ...primaryButton,
  display: 'flex',
  width: '100%',
  marginTop: 20,
};

const secondaryButton: CSSProperties = {
  ...primaryButton,
  color: '#f5f7f8',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.14)',
  boxShadow: 'none',
};

const navLink: CSSProperties = {
  padding: '8px 10px',
  borderRadius: 12,
  color: 'rgba(255,255,255,0.74)',
  fontSize: 14,
  cursor: 'pointer',
  textDecoration: 'none',
  fontWeight: 650,
};

const languageSwitcher: CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
};

const languageButton: CSSProperties = {
  minHeight: 44,
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 14,
  padding: '0 12px',
  background: 'rgba(255,255,255,0.055)',
  color: '#f5f7f8',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontWeight: 850,
};

const languageMenu: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 10px)',
  insetInlineEnd: 0,
  minWidth: 190,
  padding: 8,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(5,8,7,0.96)',
  backdropFilter: 'blur(18px)',
  boxShadow: '0 24px 70px rgba(0,0,0,0.42)',
  zIndex: 70,
};

function languageOption(active: boolean): CSSProperties {
  return {
    width: '100%',
    minHeight: 42,
    border: 0,
    borderRadius: 12,
    padding: '0 10px',
    background: active
      ? 'linear-gradient(135deg, rgba(0,255,136,0.18), rgba(0,200,255,0.12))'
      : 'transparent',
    color: active ? '#9dffc4' : 'rgba(245,247,248,0.78)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    fontWeight: 780,
  };
}

const footerLink: CSSProperties = {
  color: 'rgba(245,247,248,0.66)',
  textDecoration: 'none',
};

const input: CSSProperties = {
  minHeight: 52,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.05)',
  color: '#f5f7f8',
  padding: '0 16px',
  outline: 'none',
  width: '100%',
};

const invalidInput: CSSProperties = {
  borderColor: 'rgba(255,120,120,0.82)',
  boxShadow: '0 0 0 1px rgba(255,120,120,0.2)',
};

const fieldStack: CSSProperties = {
  display: 'grid',
  gap: 6,
};

const fieldError: CSSProperties = {
  color: '#ffb4b4',
  fontSize: 12,
  lineHeight: 1.35,
};

const formError: CSSProperties = {
  color: '#ffb4b4',
  fontSize: 13,
  lineHeight: 1.45,
  marginTop: 2,
};

const label: CSSProperties = {
  color: 'rgba(255,255,255,0.72)',
  fontSize: 14,
  fontWeight: 800,
};

const statCard: CSSProperties = {
  padding: 16,
  minHeight: 88,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.045)',
};

const metricCard: CSSProperties = {
  ...statCard,
  minHeight: 76,
};

const analysisPanel: CSSProperties = {
  padding: 16,
  borderRadius: 18,
  border: '1px solid rgba(157,255,196,0.18)',
  background:
    'linear-gradient(145deg, rgba(9,17,16,0.78), rgba(8,10,13,0.90))',
  color: 'rgba(245,247,248,0.68)',
  fontSize: 13,
  lineHeight: 1.55,
  boxShadow: '0 18px 48px rgba(0,0,0,0.22)',
};

const statLabel: CSSProperties = {
  color: 'rgba(255,255,255,0.55)',
  fontSize: 12,
  marginBottom: 6,
};

const statValue: CSSProperties = {
  color: '#f5f7f8',
  fontSize: 18,
  fontWeight: 900,
};
