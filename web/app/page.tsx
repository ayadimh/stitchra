'use client';

import Image from 'next/image';
import Link from 'next/link';
import type {
  CSSProperties,
  FormEvent,
  MouseEvent,
  RefObject,
  ReactNode,
} from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  clampLogoPlacementConfig,
  formatLogoSize,
  getDefaultLogoPlacementConfig,
  getEmbroideryZone,
  getMaxLogoWidthForAspect,
  getPlacementSideLabel,
  isEmbroideryZoneId,
  placementGroups,
  type EmbroideryPlacementGroup,
  type EmbroideryZoneId,
  type LogoPlacementConfig,
} from '@/lib/embroideryZones';
import { evaluateMachineCapability } from '@/lib/machineLimits';
import StitchraLogo from '@/components/brand/StitchraLogo';
import AICreatorPanel from '@/components/configurator/AICreatorPanel';
import AIConceptReviewPanel, {
  type AIConcept,
  type AIConceptReadiness,
} from '@/components/configurator/AIConceptReviewPanel';
import DesignAddedToast from '@/components/configurator/DesignAddedToast';
import DesignStartOptions, {
  type DesignStartMode,
} from '@/components/configurator/DesignStartOptions';
import DraftRecoveryBanner from '@/components/configurator/DraftRecoveryBanner';
import IntroSplash from '@/components/IntroSplash';
import ShirtPlacementMockup from '@/components/configurator/ShirtPlacementMockup';
import UploadOwnDesignPanel from '@/components/configurator/UploadOwnDesignPanel';
import type { CustomLogoPlacement } from '@/components/configurator/types';
import {
  DESIGN_DRAFT_ACTIVE_LOGO_IMAGE_KEY,
  blobToDataUrl,
  clearDesignDraft,
  clearDraftImages,
  dataUrlToBlob,
  loadDesignDraft,
  loadDraftImage,
  saveDesignDraft,
  saveDraftImage,
  type DesignDraftEstimateSummary,
  type DesignDraftLogoAnalysisSummary,
  type SavedDesignDraft,
} from '@/lib/designDraftStorage';
import {
  createTranslator,
  getLocaleDirection,
  getLocalizedArray,
  getLocalizedPlacementGroupLabel,
  getLocalizedPlacementZoneLabel,
  getLocalizedRouteItems,
  getPublicI18nCopy,
  localeLabels,
  localeFlags,
  locales,
  localizedPath,
  resolveLocale,
  switchLocalePath,
  type Locale,
  type PublicI18nCopy,
  type Translator,
} from '@/lib/i18n';

const API =
  process.env.NEXT_PUBLIC_API_URL ??
  'https://stitchra-production.up.railway.app';

const PRACTICAL_THREAD_COLOR_LIMIT = 15;
const MAX_LOGO_UPLOAD_BYTES = 10 * 1024 * 1024;
const SUPPORTED_LOGO_EXTENSIONS = ['png', 'jpg', 'jpeg', 'svg'] as const;
const SUPPORTED_LOGO_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/svg+xml',
]);

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

type ArtworkGenerateResponse = {
  ok?: boolean;
  imageDataUrl?: string;
  source?: string;
  filename?: string;
  message?: string;
  seed?: number;
  variationMode?: 'new' | 'refine' | 'same';
  variationIndex?: number;
  variationHint?: string;
  createdAt?: number;
};

type ArtworkVariationMode = 'new' | 'refine' | 'same';
type ArtworkGenerationIntent = 'initial' | 'new' | 'refine' | null;

function createClientId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getCurrentTimestamp() {
  return Date.now();
}

type StitchraDesignActionDetail = {
  action?:
    | 'openAICreator'
    | 'prefillIdeaPrompt'
    | 'generateArtworkFromSuggestion'
    | 'openUploadOwnDesign'
    | 'setPlacement'
    | 'setShirtColor'
    | 'scrollToViewer';
  prompt?: string;
  placement?: Placement;
  shirtColor?: TeeColor;
};

type Placement = EmbroideryZoneId;
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
const previewNotConfiguredMessage =
  'This preview deployment is not fully configured. Please test the live site at stitchra.com.';

type PublicApiErrorPayload = {
  code?: string;
  message?: string;
  errors?: {
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    quantity?: string;
  };
};

type OrderCreateResponsePayload = PublicApiErrorPayload & {
  customerConfirmationSent?: boolean;
};

function isPreviewDeploymentHost() {
  if (typeof window === 'undefined') {
    return false;
  }

  const hostname = window.location.hostname.toLowerCase();
  return (
    hostname.endsWith('.vercel.app') &&
    hostname !== 'stitchra.com' &&
    hostname !== 'www.stitchra.com'
  );
}

function getPreviewAwareErrorMessage(fallback: string) {
  return isPreviewDeploymentHost()
    ? previewNotConfiguredMessage
    : fallback;
}

async function getSafeResponseErrorMessage(
  response: Response,
  fallback: string
) {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const payload = (await response
      .json()
      .catch(() => ({}))) as PublicApiErrorPayload;

    if (payload.code === 'PREVIEW_NOT_CONFIGURED') {
      return previewNotConfiguredMessage;
    }

    return payload.message ?? fallback;
  }

  const text = await response.text().catch(() => '');
  return text || fallback;
}

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
  const baseName =
    originalName.replace(/\.[^/.]+$/, '') ||
    'logo';

  return dataUrlToNamedFile(
    dataUrl,
    `${baseName}-processed.png`
  );
}

async function dataUrlToNamedFile(
  dataUrl: string,
  filename: string
) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  return new File(
    [blob],
    filename,
    {
      type: blob.type || 'image/png',
    }
  );
}

async function getImageAspectRatio(src: string) {
  return new Promise<number>((resolve) => {
    const image = new window.Image();

    image.onload = () => {
      resolve(
        image.naturalWidth > 0 && image.naturalHeight > 0
          ? image.naturalWidth / image.naturalHeight
          : 70 / 45
      );
    };
    image.onerror = () => resolve(70 / 45);
    image.src = src;
  });
}

function getStickyHeaderHeight() {
  if (typeof document === 'undefined') {
    return 86;
  }

  const header = document.querySelector('header');

  return header?.getBoundingClientRect().height ?? 86;
}

function scrollElementToViewportCenter(element: HTMLElement) {
  const headerOffset = getStickyHeaderHeight() + 24;
  const rect = element.getBoundingClientRect();
  const availableHeight = Math.max(320, window.innerHeight - headerOffset);
  const targetTop =
    window.scrollY +
    rect.top -
    headerOffset +
    rect.height / 2 -
    availableHeight / 2;

  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior: 'smooth',
  });
}

function getCleanedLogoFilename(filename: string) {
  const baseName = filename.replace(/\.[^/.]+$/, '') || 'stitchra-logo';

  return `${baseName}-transparent.png`;
}

function isSvgLogoFile(file: File | null) {
  if (!file) {
    return false;
  }

  return (
    file.type === 'image/svg+xml' ||
    file.name.toLowerCase().endsWith('.svg')
  );
}

function getFileExtension(filename: string) {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

function isSupportedLogoFile(file: File) {
  const extension = getFileExtension(file.name);

  return (
    SUPPORTED_LOGO_MIME_TYPES.has(file.type) ||
    SUPPORTED_LOGO_EXTENSIONS.includes(
      extension as (typeof SUPPORTED_LOGO_EXTENSIONS)[number]
    )
  );
}

function loadCanvasImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Preview image could not load.'));
    image.src = src;
  });
}

function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error('Preview image could not be exported.'));
    }, 'image/png');
  });
}

function getConceptDisplayImage(concept: AIConcept) {
  return concept.cleanedImageDataUrl ?? concept.imageDataUrl;
}

function hashImageDataUrl(dataUrl: string) {
  let hash = 2166136261;

  for (let index = 0; index < dataUrl.length; index += 1) {
    hash ^= dataUrl.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `${dataUrl.length}:${(hash >>> 0).toString(16)}`;
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

function summarizeLogoAnalysis(
  analysis: LogoAnalysis | null
): DesignDraftLogoAnalysisSummary | null {
  if (!analysis) {
    return null;
  }

  return {
    colors_count: analysis.colors_count,
    contrast_score: analysis.contrast_score,
    embroidery_ready: analysis.embroidery_ready,
    warnings: analysis.warnings,
    recommendations: analysis.recommendations,
    dominant_colors: analysis.dominant_colors.map((color) => ({
      hex: color.hex,
      percentage: color.percentage,
    })),
  };
}

function restoreLogoAnalysis(
  summary: DesignDraftLogoAnalysisSummary | null
): LogoAnalysis | null {
  if (!summary) {
    return null;
  }

  return {
    processed_png: '',
    colors_count: summary.colors_count,
    dominant_colors:
      summary.dominant_colors?.map((color) => ({
        hex: color.hex,
        rgb: [],
        percentage: color.percentage,
      })) ?? [],
    contrast_score: summary.contrast_score,
    embroidery_ready: summary.embroidery_ready,
    warnings: summary.warnings,
    recommendations: summary.recommendations,
  };
}

function summarizeEstimate(
  estimate: Estimate | null
): DesignDraftEstimateSummary | null {
  if (!estimate) {
    return null;
  }

  const publicEstimate = getPublicQuote(estimate);

  return {
    stitches: publicEstimate.stitches,
    colors: publicEstimate.colors,
    coverage: publicEstimate.coverage,
    price_eur: publicEstimate.price_eur,
    manual_quote: publicEstimate.manual_quote,
    pricing_tier: publicEstimate.pricing_tier,
    warnings: publicEstimate.customer_warnings,
    recommendations: publicEstimate.customer_recommendations,
    width_mm: estimate.width_mm,
    height_mm: estimate.height_mm,
  };
}

function restoreEstimate(
  summary: DesignDraftEstimateSummary | null
): Estimate | null {
  if (!summary) {
    return null;
  }

  return {
    stitches: summary.stitches,
    colors: summary.colors,
    coverage: summary.coverage,
    price_eur: summary.price_eur,
    manual_quote: summary.manual_quote,
    pricing_tier: summary.pricing_tier,
    warnings: summary.warnings,
    recommendations: summary.recommendations,
    public_quote: {
      stitches: summary.stitches,
      colors: summary.colors,
      coverage: summary.coverage,
      price_eur: summary.price_eur,
      manual_quote: summary.manual_quote,
      pricing_tier: summary.pricing_tier,
      customer_warnings: summary.warnings,
      customer_recommendations: summary.recommendations,
    },
    width_mm: summary.width_mm,
    height_mm: summary.height_mm,
  };
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
  entry?: 'home' | 'design';
};

function getLocaleDisplay(locale: Locale) {
  return `${localeFlags[locale]} ${localeLabels[locale].name}`;
}

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

type GuidedStudioStepId =
  | 'start'
  | 'create'
  | 'review'
  | 'place'
  | 'price'
  | 'request';
type MobileDesignStepId =
  | 'choose'
  | 'create'
  | 'review'
  | 'place'
  | 'price'
  | 'request';

type GuidedStudioStep = {
  id: GuidedStudioStepId;
  label: string;
  status: 'complete' | 'active' | 'locked';
};

function GuidedStudioStepper({
  steps,
  onStepClick,
}: {
  steps: GuidedStudioStep[];
  onStepClick: (stepId: GuidedStudioStepId) => void;
}) {
  return (
    <nav className="guided-studio-stepper" aria-label="Guided design progress">
      {steps.map((step, index) => {
        const interactive = step.status !== 'locked';

        return (
          <button
            key={step.id}
            type="button"
            className={`guided-studio-step guided-studio-step-${step.status}`}
            onClick={() => onStepClick(step.id)}
            disabled={!interactive}
            aria-current={step.status === 'active' ? 'step' : undefined}
          >
            <span>{index + 1}</span>
            {step.label}
          </button>
        );
      })}
    </nav>
  );
}

function MobileDesignStepper({
  currentStep,
  completedSteps,
  labels,
  onStepClick,
}: {
  currentStep: MobileDesignStepId;
  completedSteps: Set<MobileDesignStepId>;
  labels: Record<MobileDesignStepId, string>;
  onStepClick: (stepId: MobileDesignStepId) => void;
}) {
  const steps: Array<{ id: MobileDesignStepId; label: string }> = [
    { id: 'choose', label: labels.choose },
    { id: 'create', label: labels.create },
    { id: 'review', label: labels.review },
    { id: 'place', label: labels.place },
    { id: 'price', label: labels.price },
    { id: 'request', label: labels.request },
  ];

  return (
    <nav className="mobile-design-stepper" aria-label="Mobile design progress">
      {steps.map((step, index) => {
        const isActive = currentStep === step.id;
        const isComplete = completedSteps.has(step.id);
        const isReachable = isActive || isComplete;

        return (
          <button
            key={step.id}
            type="button"
            className={[
              'mobile-design-step-chip',
              isActive ? 'mobile-design-step-active' : '',
              isComplete ? 'mobile-design-step-complete' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            disabled={!isReachable}
            aria-current={isActive ? 'step' : undefined}
            onClick={() => onStepClick(step.id)}
          >
            <span>{index + 1}</span>
            {step.label}
          </button>
        );
      })}
    </nav>
  );
}

function StartNewDesignDialog({
  open,
  copy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  copy: {
    eyebrow: string;
    title: string;
    text: string;
    cancel: string;
    confirm: string;
  };
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="reset-design-modal-overlay" role="presentation">
      <section
        className="reset-design-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-design-title"
        aria-describedby="reset-design-description"
      >
        <span>{copy.eyebrow}</span>
        <h2 id="reset-design-title">{copy.title}</h2>
        <p id="reset-design-description">{copy.text}</p>
        <div className="reset-design-actions">
          <button type="button" onClick={onCancel}>
            {copy.cancel}
          </button>
          <button type="button" onClick={onConfirm}>
            {copy.confirm}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function Home({ locale, entry = 'home' }: HomeProps = {}) {
  const activeLocale = resolveLocale(locale);
  const t = createTranslator(activeLocale);
  const publicCopy = getPublicI18nCopy(activeLocale);
  const dir = getLocaleDirection(activeLocale);
  const localizedHomePath = localizedPath(activeLocale, '/');
  const localize = (path: string) => localizedPath(activeLocale, path);

  useHtmlLocale(activeLocale);

  const [placement, setPlacement] = useState<Placement>('left_chest');
  const [placementGroup, setPlacementGroup] =
    useState<EmbroideryPlacementGroup>('front');
  const [teeColor, setTeeColor] = useState<TeeColor>('black');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const studioRootRef = useRef<HTMLDivElement | null>(null);
  const shirtViewerRef = useRef<HTMLDivElement | null>(null);
  const mobileWizardRootRef = useRef<HTMLDivElement | null>(null);
  const mobileShirtViewerRef = useRef<HTMLDivElement | null>(null);
  const mobileUploadPanelRef = useRef<HTMLDivElement | null>(null);
  const mobileAiCreatorRef = useRef<HTMLDivElement | null>(null);
  const mobileAiReviewRef = useRef<HTMLDivElement | null>(null);
  const mobilePlacementControlsRef = useRef<HTMLDivElement | null>(null);
  const mobilePriceActionRef = useRef<HTMLDivElement | null>(null);
  const mobileOrderRequestRef = useRef<HTMLDivElement | null>(null);
  const uploadPanelRef = useRef<HTMLDivElement | null>(null);
  const aiCreatorRef = useRef<HTMLDivElement | null>(null);
  const aiReviewRef = useRef<HTMLDivElement | null>(null);
  const placementControlsRef = useRef<HTMLDivElement | null>(null);
  const priceActionRef = useRef<HTMLDivElement | null>(null);
  const orderRequestRef = useRef<HTMLDivElement | null>(null);
  const viewerHintTimeoutRef = useRef<number | null>(null);
  const [logoAspectRatio, setLogoAspectRatio] = useState(70 / 45);
  const [logoPlacementConfig, setLogoPlacementConfig] =
    useState<LogoPlacementConfig>(() =>
      getDefaultLogoPlacementConfig('left_chest', 'black')
    );
  const [customLogoPlacement, setCustomLogoPlacement] =
    useState<CustomLogoPlacement | null>(null);
  const [placementMode, setPlacementMode] =
    useState<'preset' | 'custom'>('preset');
  const [viewerHint, setViewerHint] = useState('');
  const [logoFocusPulseKey, setLogoFocusPulseKey] = useState(0);
  const [designStartMode, setDesignStartMode] =
    useState<DesignStartMode>('choice');
  const [mobileDesignStep, setMobileDesignStep] =
    useState<MobileDesignStepId>('choose');
  const [hasGeneratedAiConcept, setHasGeneratedAiConcept] =
    useState(false);
  const [aiConcepts, setAiConcepts] = useState<AIConcept[]>([]);
  const [selectedAiConceptId, setSelectedAiConceptId] =
    useState<string | null>(null);
  const [activeAiConceptId, setActiveAiConceptId] =
    useState<string | null>(null);
  const [aiStyleHints, setAiStyleHints] = useState<string[]>([]);
  const [draftSaveStatus, setDraftSaveStatus] = useState('');
  const [restoredDraftAt, setRestoredDraftAt] = useState<number | null>(null);
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const [draftImageNeedsUpload, setDraftImageNeedsUpload] = useState(false);
  const hasHydratedDraftRef = useRef(false);
  const draftAutosaveTimeoutRef = useRef<number | null>(null);
  const [isCleaningBackground, setIsCleaningBackground] = useState(false);
  const [backgroundCleanupStatus, setBackgroundCleanupStatus] = useState('');
  const [designAddedToastOpen, setDesignAddedToastOpen] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewExportStatus, setPreviewExportStatus] = useState('');
  const [emptyDesignHelperOpen, setEmptyDesignHelperOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [newDesignToast, setNewDesignToast] = useState('');
  const [draftPromptNow] = useState(() => Date.now());

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
  const [orderSuccess, setOrderSuccess] = useState<{
    customerConfirmationSent: boolean;
  } | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationIntent, setGenerationIntent] =
    useState<ArtworkGenerationIntent>(null);
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

  const placementZoneId = placement;
  const selectedZone = getEmbroideryZone(placementZoneId);
  const previewSideLabel = getPlacementSideLabel(placementZoneId);
  const placementSize = {
    width: Math.round(logoPlacementConfig.logo_width_mm),
    height: Math.round(logoPlacementConfig.logo_height_mm),
  };
  const maxLogoWidthMm = getMaxLogoWidthForAspect(
    placementZoneId,
    logoAspectRatio
  );
  const logoSizeQuickActions = [
    {
      label: 'Small',
      widthMm: Math.min(
        maxLogoWidthMm,
        Math.max(20, selectedZone.defaultWidthMm * 0.72)
      ),
    },
    {
      label: 'Medium',
      widthMm: Math.min(maxLogoWidthMm, selectedZone.defaultWidthMm),
    },
    {
      label: 'Large',
      widthMm: maxLogoWidthMm,
    },
  ];
  const capabilityPreview = evaluateMachineCapability({
    zoneId: placementZoneId,
    widthMm: logoPlacementConfig.logo_width_mm,
    heightMm: logoPlacementConfig.logo_height_mm,
    colors: Math.max(1, logoAnalysis?.colors_count ?? 3),
    stitches: estimate?.stitches ?? null,
  });
  const publicQuote = estimate
    ? getPublicQuote(estimate)
    : null;
  const selectedAiConcept =
    aiConcepts.find((concept) => concept.id === selectedAiConceptId) ??
    aiConcepts[0] ??
    null;
  const aiConceptReadiness: AIConceptReadiness = {
    score: designPreparation?.machine_ready_score ?? 78,
    colorsTarget: designPreparation?.max_colors ?? 6,
    contrastNote:
      'High contrast helps the concept read clearly on black or white tees.',
    detailNote:
      'Bold shapes and limited tiny details are better for embroidery.',
    recommendation:
      designPreparation?.recommendations[0] ??
      'Use bold shapes and clear placement for best stitch quality.',
  };
  const hasActiveDesignDraft = Boolean(
    file ||
      preview ||
      aiConcepts.length > 0 ||
      logoPrompt.trim() ||
      designStartMode !== 'choice' ||
      estimate ||
      orderStatus ||
      orderSuccess ||
      customLogoPlacement ||
      showDraftRecovery ||
      draftImageNeedsUpload
  );

  const processSteps = getProcessSteps(activeLocale);
  const features = getFeatures(activeLocale);
  const galleryItems = getGalleryItems(activeLocale);
  const craftStats = getCraftStats(activeLocale);
  const faqItems = getFaqItems(activeLocale);
  const pricingCards: PricingCardItem[] = [
    {
      label: t('pricing.smallLogo'),
      value: t('pricing.from9'),
      description: t('pricing.smallLogoText'),
      visual: 'smallLogo',
      accent: 'green',
      recommended: true,
    },
    {
      label: t('pricing.largeArtwork'),
      value: t('pricing.from13'),
      description: t('pricing.largeArtworkText'),
      visual: 'largeArtwork',
      accent: 'cyan',
    },
    {
      label: t('pricing.uploadCheck'),
      value: t('pricing.calculated'),
      description: t('pricing.uploadCheckText'),
      visual: 'uploadCheck',
      accent: 'purple',
    },
    {
      label: t('pricing.complexDesigns'),
      value: t('pricing.studioReview'),
      description: t('pricing.complexDesignsText'),
      visual: 'studioReview',
      accent: 'pink',
    },
  ];
  const pricingFactors = [
    t('pricing.factorPlacement'),
    t('pricing.factorLogoSize'),
    t('pricing.factorColors'),
    t('pricing.factorStitchDetail'),
    t('pricing.factorQuantity'),
  ];

  useEffect(
    () => () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }

      if (viewerHintTimeoutRef.current) {
        window.clearTimeout(viewerHintTimeoutRef.current);
      }

      if (draftAutosaveTimeoutRef.current) {
        window.clearTimeout(draftAutosaveTimeoutRef.current);
      }
    },
    []
  );

  const applyLogoPreview = async (src: string) => {
    setPreview(src);
    const aspectRatio = await getImageAspectRatio(src);

    setLogoAspectRatio(aspectRatio);
    setLogoPlacementConfig((current) =>
      clampLogoPlacementConfig(
        {
          ...current,
          logo_height_mm: current.logo_width_mm / aspectRatio,
          shirt_color: teeColor,
        },
        aspectRatio
      )
    );
  };

  const updatePlacement = useCallback((nextPlacement: Placement) => {
    setPlacementGroup(getEmbroideryZone(nextPlacement).group);
    setPlacement(nextPlacement);
    setPlacementMode('preset');
    setEstimate(null);
    setStatus('');
    setError('');
    setViewerHint('');
    setCustomLogoPlacement(null);
    setLogoPlacementConfig(
      getDefaultLogoPlacementConfig(
        nextPlacement,
        teeColor,
        logoAspectRatio
      )
    );
  }, [logoAspectRatio, teeColor]);

  const updateShirtColor = useCallback((nextColor: TeeColor) => {
    setTeeColor(nextColor);
    setLogoPlacementConfig((current) => ({
      ...current,
      shirt_color: nextColor,
    }));
  }, []);

  const updateLogoPlacementConfig = (nextConfig: LogoPlacementConfig) => {
    setLogoPlacementConfig(
      clampLogoPlacementConfig(
        {
          ...nextConfig,
          placement_zone: placementZoneId,
          shirt_color: teeColor,
        },
        logoAspectRatio
      )
    );
    setEstimate(null);
    setOrderStatus('');
    setOrderError('');
  };

  const updateCustomLogoPlacement = (
    nextPlacement: CustomLogoPlacement | null
  ) => {
    setCustomLogoPlacement(nextPlacement);
    if (nextPlacement) {
      setPlacementMode('custom');
      setViewerHint('Logo placed. Click again to fine-tune it.');
      setLogoFocusPulseKey((current) => current + 1);
    }
    setEstimate(null);
    setOrderStatus('');
    setOrderError('');
  };

  const isMobileDesignViewport = useCallback(() => {
    return (
      entry === 'design' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 768px)').matches
    );
  }, [entry]);

  const getDesignScrollTarget = useCallback(
    (
      mobileRef: RefObject<HTMLElement | null>,
      desktopRef: RefObject<HTMLElement | null>
    ) => {
      return isMobileDesignViewport()
        ? mobileRef.current ?? desktopRef.current
        : desktopRef.current ?? mobileRef.current;
    },
    [isMobileDesignViewport]
  );

  const focusShirtViewer = useCallback((hint?: string, force = false) => {
    const viewer = getDesignScrollTarget(
      mobileShirtViewerRef,
      shirtViewerRef
    );

    if (viewer) {
      const rect = viewer.getBoundingClientRect();
      const headerOffset = getStickyHeaderHeight() + 24;
      const isComfortablyVisible =
        rect.top >= headerOffset &&
        rect.bottom <= window.innerHeight - 48;

      if (force || !isComfortablyVisible) {
        scrollElementToViewportCenter(viewer);
      }
    }

    if (hint) {
      setViewerHint(hint);

      if (viewerHintTimeoutRef.current) {
        window.clearTimeout(viewerHintTimeoutRef.current);
      }

      viewerHintTimeoutRef.current = window.setTimeout(() => {
        setViewerHint('');
        viewerHintTimeoutRef.current = null;
      }, 4200);
    }

    setLogoFocusPulseKey((current) => current + 1);
  }, [getDesignScrollTarget]);

  const scrollToPriceAction = useCallback(() => {
    const target = getDesignScrollTarget(
      mobilePriceActionRef,
      priceActionRef
    );

    if (target) {
      scrollElementToViewportCenter(target);
    }
  }, [getDesignScrollTarget]);

  const scrollToPlacementControls = useCallback(() => {
    const target = getDesignScrollTarget(
      mobilePlacementControlsRef,
      placementControlsRef
    );

    if (target) {
      scrollElementToViewportCenter(target);
    }
  }, [getDesignScrollTarget]);

  const scrollToStudioRoot = useCallback(() => {
    const target = getDesignScrollTarget(
      mobileWizardRootRef,
      studioRootRef
    );

    if (target) {
      scrollElementToViewportCenter(target);
    }
  }, [getDesignScrollTarget]);

  const scrollToAiReview = useCallback(() => {
    const target = getDesignScrollTarget(
      mobileAiReviewRef,
      aiReviewRef
    );

    if (target) {
      scrollElementToViewportCenter(target);
      return;
    }

    scrollToStudioRoot();
  }, [getDesignScrollTarget, scrollToStudioRoot]);

  const scrollToOrderRequest = useCallback(() => {
    const target = getDesignScrollTarget(
      mobileOrderRequestRef,
      orderRequestRef
    );

    if (target) {
      scrollElementToViewportCenter(target);
      return;
    }

    scrollToPriceAction();
  }, [getDesignScrollTarget, scrollToPriceAction]);

  const scrollToUploadPanel = useCallback(() => {
    setDesignStartMode('upload');
    setError('');
    setUploadError('');
    setStatus('');
    setBackgroundCleanupStatus('');
    setEmptyDesignHelperOpen(false);

    window.setTimeout(() => {
      const target =
        getDesignScrollTarget(mobileUploadPanelRef, uploadPanelRef) ??
        getDesignScrollTarget(mobileWizardRootRef, studioRootRef);

      if (target) {
        scrollElementToViewportCenter(target);
      }
    }, 0);
  }, [getDesignScrollTarget]);

  const scrollToAiCreator = useCallback(() => {
    setDesignStartMode('ai');
    setError('');
    setUploadError('');
    setStatus('');
    setBackgroundCleanupStatus('');
    setEmptyDesignHelperOpen(false);

    window.setTimeout(() => {
      const target =
        getDesignScrollTarget(mobileAiCreatorRef, aiCreatorRef) ??
        getDesignScrollTarget(mobileWizardRootRef, studioRootRef);

      if (target) {
        scrollElementToViewportCenter(target);
      }

      document.getElementById('stitchra-ai-idea-input')?.focus();
    }, 0);
  }, [getDesignScrollTarget]);

  const showEmptyDesignHelper = () => {
    if (preview) {
      return;
    }

    setEmptyDesignHelperOpen(true);
    setViewerHint(publicCopy.designWizard.place.guidanceEmpty);

    if (viewerHintTimeoutRef.current) {
      window.clearTimeout(viewerHintTimeoutRef.current);
    }

    viewerHintTimeoutRef.current = window.setTimeout(() => {
      setViewerHint('');
      viewerHintTimeoutRef.current = null;
    }, 5200);
  };

  const handleStartDesigningClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();

      if (window.matchMedia('(max-width: 768px)').matches) {
        window.location.assign(localizedPath(activeLocale, '/design'));
        return;
      }

      window.history.replaceState(null, '', '#designer');
      focusShirtViewer(undefined, true);
    },
    [activeLocale, focusShirtViewer]
  );

  const scrollToHomeStart = useCallback(() => {
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}`
    );
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  const resetDesignToStart = useCallback(async () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }

    await clearDesignDraft();
    await clearDraftImages();

    setPlacement('left_chest');
    setPlacementGroup('front');
    setTeeColor('black');
    setFile(null);
    setPreview(null);
    setLogoAspectRatio(70 / 45);
    setLogoPlacementConfig(getDefaultLogoPlacementConfig('left_chest', 'black'));
    setCustomLogoPlacement(null);
    setPlacementMode('preset');
    setViewerHint('');
    setLogoFocusPulseKey((current) => current + 1);
    setDesignStartMode('choice');
    setMobileDesignStep('choose');
    setHasGeneratedAiConcept(false);
    setAiConcepts([]);
    setSelectedAiConceptId(null);
    setActiveAiConceptId(null);
    setAiStyleHints([]);
    setEstimate(null);
    setLogoAnalysis(null);
    setDesignPreparation(null);
    setLogoPrompt('');
    setStatus('');
    setError('');
    setUploadError('');
    setPreviewExportStatus('');
    setEmptyDesignHelperOpen(false);
    setBackgroundCleanupStatus('');
    setGenerationIntent(null);
    setDesignAddedToastOpen(false);
    setOrderOpen(false);
    setOrderForm({
      name: '',
      email: '',
      phone: '',
      quantity: '1',
      note: '',
    });
    setOrderStatus('');
    setOrderError('');
    setOrderSuccess(null);
    setOrderFieldErrors({});
    setResetDialogOpen(false);
    setShowDraftRecovery(false);
    setDraftImageNeedsUpload(false);
    setRestoredDraftAt(null);
    setDraftSaveStatus('Draft cleared');
    setNewDesignToast('New design started');
    scrollToHomeStart();

    window.setTimeout(() => {
      setNewDesignToast('');
    }, 3200);
  }, [scrollToHomeStart]);

  const requestDesignReset = useCallback(() => {
    setResetDialogOpen(true);
  }, []);

  const resetDesignDraftState = useCallback(() => {
    requestDesignReset();
  }, [requestDesignReset]);

  const handleBrandResetClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (hasActiveDesignDraft) {
      event.preventDefault();
      requestDesignReset();
      return;
    }

    event.preventDefault();
    if (entry !== 'home') {
      window.location.assign(localizedHomePath);
      return;
    }

    scrollToHomeStart();
  };

  const continueRestoredDraft = () => {
    setShowDraftRecovery(false);
    focusShirtViewer(
      preview
        ? publicCopy.common.designOnShirt
        : undefined
    );
  };

  const toggleAiStyleHint = (styleHint: string) => {
    setAiStyleHints((current) =>
      current.includes(styleHint)
        ? current.filter((item) => item !== styleHint)
        : [...current, styleHint]
    );
    setError('');
    setStatus('');
  };

  const getPromptWithStyleHints = useCallback(
    (prompt: string) => {
      const normalizedPrompt = prompt.trim();

      if (!normalizedPrompt || aiStyleHints.length === 0) {
        return normalizedPrompt;
      }

      return `${normalizedPrompt}. Style direction: ${aiStyleHints.join(', ')}.`
        .replace(/\s+/g, ' ')
        .trim();
    },
    [aiStyleHints]
  );

  useEffect(() => {
    const handleDesignAction = (event: Event) => {
      const detail = (event as CustomEvent<StitchraDesignActionDetail>).detail;

      if (!detail?.action) {
        return;
      }

      if (detail.action === 'scrollToViewer') {
        focusShirtViewer(undefined, true);
      }

      if (detail.action === 'openAICreator') {
        setDesignStartMode('ai');
        setMobileDesignStep('create');
        window.setTimeout(() => {
          document.getElementById('stitchra-ai-idea-input')?.focus();
        }, 0);
      }

      if (
        detail.action === 'prefillIdeaPrompt' ||
        detail.action === 'generateArtworkFromSuggestion'
      ) {
        setDesignStartMode('ai');
        setMobileDesignStep('create');
        setLogoPrompt((detail.prompt ?? '').slice(0, 400));
        setDesignPreparation(null);
        window.setTimeout(() => {
          const target =
            detail.action === 'generateArtworkFromSuggestion'
              ? document.getElementById('stitchra-ai-generate-button')
              : document.getElementById('stitchra-ai-idea-input');

          target?.focus();
        }, 0);
      }

      if (detail.action === 'openUploadOwnDesign') {
        setDesignStartMode('upload');
        setMobileDesignStep('create');
        setUploadError('');
        setBackgroundCleanupStatus('');
      }

      if (detail.action === 'setPlacement' && detail.placement) {
        updatePlacement(detail.placement);
        setMobileDesignStep('place');
      }

      if (detail.action === 'setShirtColor' && detail.shirtColor) {
        updateShirtColor(detail.shirtColor);
      }
    };

    window.addEventListener('stitchra:design-action', handleDesignAction);

    return () => {
      window.removeEventListener('stitchra:design-action', handleDesignAction);
    };
  }, [focusShirtViewer, logoAspectRatio, teeColor, updatePlacement, updateShirtColor]);

  useEffect(() => {
    let cancelled = false;

    async function restoreDraft() {
      const draft = await loadDesignDraft();

      if (cancelled) {
        return;
      }

      if (!draft) {
        hasHydratedDraftRef.current = true;
        return;
      }

      const draftPlacement = isEmbroideryZoneId(draft.selectedPlacement)
        ? draft.selectedPlacement
        : 'left_chest';
      const draftShirtColor =
        draft.shirtColor === 'white' ? 'white' : 'black';
      const draftAspectRatio =
        Number.isFinite(draft.logoAspectRatio) && draft.logoAspectRatio > 0
          ? draft.logoAspectRatio
          : 70 / 45;
      const draftConfigZone = isEmbroideryZoneId(
        draft.logoPlacementConfig.placement_zone
      )
        ? draft.logoPlacementConfig.placement_zone
        : draftPlacement;
      const draftConfig: LogoPlacementConfig = {
        ...draft.logoPlacementConfig,
        placement_zone: draftConfigZone,
        shirt_color: draftShirtColor,
      };
      const restoredConcepts = (
        await Promise.all(
          draft.generatedConcepts.slice(0, 4).map(async (concept): Promise<AIConcept | null> => {
            const imageBlob = await loadDraftImage(concept.imageKey);
            const cleanedImageBlob = concept.cleanedImageKey
              ? await loadDraftImage(concept.cleanedImageKey)
              : null;

            if (!imageBlob) {
              return null;
            }

            const restoredImageDataUrl = await blobToDataUrl(imageBlob);
            const restoredConcept: AIConcept = {
              id: concept.id,
              filename: concept.filename,
              prompt: concept.prompt,
              imageDataUrl: restoredImageDataUrl,
              seed: concept.seed,
              variationHint: concept.variationHint,
              variationIndex: concept.variationIndex,
              variationMode: concept.variationMode,
              imageHash: concept.imageHash ?? hashImageDataUrl(restoredImageDataUrl),
              createdAt: concept.createdAt,
              accepted: concept.accepted ?? concept.id === draft.activeAiConceptId,
            };

            if (cleanedImageBlob) {
              restoredConcept.cleanedImageDataUrl = await blobToDataUrl(
                cleanedImageBlob
              );
              restoredConcept.cleanedAt = concept.cleanedAt;
            }

            if (concept.source) {
              restoredConcept.source = concept.source;
            }

            return restoredConcept;
          })
        )
      ).filter((concept): concept is AIConcept => concept !== null);

      const activeLogoBlob = draft.activeLogoImageKey
        ? await loadDraftImage(draft.activeLogoImageKey)
        : null;

      if (cancelled) {
        return;
      }

      setPlacement(draftPlacement);
      setPlacementGroup(getEmbroideryZone(draftPlacement).group);
      setTeeColor(draftShirtColor);
      setLogoAspectRatio(draftAspectRatio);
      setLogoPlacementConfig(
        clampLogoPlacementConfig(draftConfig, draftAspectRatio)
      );
      setCustomLogoPlacement(draft.customPlacement);
      setPlacementMode(draft.placementMode === 'custom' ? 'custom' : 'preset');
      setDesignStartMode(draft.designStartMode ?? 'choice');
      setLogoPrompt(draft.ideaPrompt);
      setAiStyleHints(draft.aiStyleHints);
      setAiConcepts(restoredConcepts);
      setSelectedAiConceptId(
        restoredConcepts.some((concept) => concept.id === draft.selectedAiConceptId)
          ? draft.selectedAiConceptId
          : restoredConcepts[0]?.id ?? null
      );
      setActiveAiConceptId(
        restoredConcepts.some((concept) => concept.id === draft.activeAiConceptId)
          ? draft.activeAiConceptId
          : null
      );
      setHasGeneratedAiConcept(restoredConcepts.length > 0);
      setLogoAnalysis(restoreLogoAnalysis(draft.logoAnalysisSummary));
      setEstimate(restoreEstimate(draft.estimateSummary));
      setDesignPreparation(draft.designPreparation);

      if (activeLogoBlob) {
        if (previewObjectUrlRef.current) {
          URL.revokeObjectURL(previewObjectUrlRef.current);
        }

        const restoredUrl = URL.createObjectURL(activeLogoBlob);
        previewObjectUrlRef.current = restoredUrl;
        setPreview(restoredUrl);
        setFile(
          new File(
            [activeLogoBlob],
            draft.activeLogoFilename || 'stitchra-design-draft.png',
            { type: activeLogoBlob.type || 'image/png' }
          )
        );
      } else if (draft.activeLogoImageKey) {
        setDraftImageNeedsUpload(true);
      }

      setRestoredDraftAt(draft.lastSavedAt);
      setShowDraftRecovery(
        Boolean(
          draft.activeLogoImageKey ||
            restoredConcepts.length > 0 ||
            draft.ideaPrompt.trim() ||
            draft.designStartMode ||
            draft.estimateSummary
        )
      );
      setMobileDesignStep(
        draft.estimateSummary
          ? 'price'
          : activeLogoBlob
            ? 'place'
            : restoredConcepts.length > 0
              ? 'review'
              : draft.designStartMode || draft.ideaPrompt.trim()
                ? 'create'
                : 'choose'
      );
      setDraftSaveStatus('Draft saved');
      hasHydratedDraftRef.current = true;
    }

    void restoreDraft();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedDraftRef.current) {
      return;
    }

    const hasMeaningfulDraft =
      Boolean(file) ||
      Boolean(preview) ||
      aiConcepts.length > 0 ||
      Boolean(logoPrompt.trim()) ||
      designStartMode !== 'choice' ||
      placement !== 'left_chest' ||
      teeColor !== 'black' ||
      Boolean(estimate);

    if (!hasMeaningfulDraft) {
      return;
    }

    if (draftAutosaveTimeoutRef.current) {
      window.clearTimeout(draftAutosaveTimeoutRef.current);
    }

    draftAutosaveTimeoutRef.current = window.setTimeout(() => {
      const activeLogoSource = file
        ? activeAiConceptId
          ? 'aiGenerated'
          : 'uploaded'
        : null;
      const draft: SavedDesignDraft = {
        draftVersion: 1,
        designStartMode:
          designStartMode === 'choice' ? null : designStartMode,
        shirtColor: teeColor,
        selectedSide: placementGroup,
        selectedPlacement: placement,
        placementMode,
        customPlacement: customLogoPlacement,
        logoPlacementConfig,
        logoAspectRatio,
        ideaPrompt: logoPrompt,
        aiStyleHints,
        generatedConceptStatus: hasGeneratedAiConcept
          ? 'AI concept generated. Final stitch-ready artwork is reviewed by Stitchra.'
          : null,
        generatedConcepts: aiConcepts.slice(0, 4).map((concept) => ({
          id: concept.id,
          filename: concept.filename,
          prompt: concept.prompt,
          source: concept.source,
          seed: concept.seed,
          variationHint: concept.variationHint,
          variationIndex: concept.variationIndex,
          variationMode: concept.variationMode,
          imageHash: concept.imageHash,
          accepted: concept.accepted,
          imageKey: `concept-${concept.id}`,
          cleanedImageKey: concept.cleanedImageDataUrl
            ? `concept-${concept.id}-cleaned`
            : undefined,
          cleanedAt: concept.cleanedAt,
          createdAt: concept.createdAt ?? Date.now(),
        })),
        selectedAiConceptId,
        activeAiConceptId,
        activeLogoSource,
        activeLogoFilename: file?.name ?? null,
        activeLogoImageKey: file ? DESIGN_DRAFT_ACTIVE_LOGO_IMAGE_KEY : null,
        logoAnalysisSummary: summarizeLogoAnalysis(logoAnalysis),
        estimateSummary: summarizeEstimate(estimate),
        designPreparation,
        lastSavedAt: Date.now(),
      };

      async function persistDraft() {
        setDraftSaveStatus('Saving draft...');

        if (file) {
          await saveDraftImage(DESIGN_DRAFT_ACTIVE_LOGO_IMAGE_KEY, file);
        }

        await Promise.all(
          aiConcepts.slice(0, 4).map(async (concept) => {
            await saveDraftImage(
              `concept-${concept.id}`,
              await dataUrlToBlob(concept.imageDataUrl)
            );

            if (concept.cleanedImageDataUrl) {
              await saveDraftImage(
                `concept-${concept.id}-cleaned`,
                await dataUrlToBlob(concept.cleanedImageDataUrl)
              );
            }
          })
        );
        await saveDesignDraft(draft);
        setRestoredDraftAt(draft.lastSavedAt);
        setDraftSaveStatus('Draft saved just now');
      }

      void persistDraft();
    }, 500);

    return () => {
      if (draftAutosaveTimeoutRef.current) {
        window.clearTimeout(draftAutosaveTimeoutRef.current);
      }
    };
  }, [
    activeAiConceptId,
    aiConcepts,
    aiStyleHints,
    customLogoPlacement,
    designPreparation,
    designStartMode,
    estimate,
    file,
    hasGeneratedAiConcept,
    logoAnalysis,
    logoAspectRatio,
    logoPlacementConfig,
    logoPrompt,
    placement,
    placementGroup,
    placementMode,
    preview,
    selectedAiConceptId,
    teeColor,
  ]);

  const onFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0] ?? null;

    setUploadError('');
    setEstimate(null);
    setLogoAnalysis(null);
    setDesignPreparation(null);
    setHasGeneratedAiConcept(false);
    setActiveAiConceptId(null);
    setDesignStartMode('upload');
    setStatus('');
    setError('');
    setBackgroundCleanupStatus('');
    setOrderSuccess(null);

    if (!selectedFile) {
      setFile(null);
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
      setPreview(null);
      return;
    }

    if (!isSupportedLogoFile(selectedFile)) {
      event.currentTarget.value = '';
      setUploadError('Unsupported file type. Please upload PNG, JPG or SVG.');
      return;
    }

    if (selectedFile.size > MAX_LOGO_UPLOAD_BYTES) {
      event.currentTarget.value = '';
      setUploadError('This file is too large. Please upload a logo under 10 MB.');
      return;
    }

    setFile(selectedFile);

    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(selectedFile);
    previewObjectUrlRef.current = previewUrl;

    if (process.env.NODE_ENV === 'development') {
      console.debug('[stitchra:logo-preview]', {
        uploadedFilename: selectedFile.name,
        previewUrlExists: Boolean(previewUrl),
        selectedPlacement: placementZoneId,
      });
    }

    await applyLogoPreview(previewUrl);
    setEmptyDesignHelperOpen(false);
    setMobileDesignStep('review');
    setDesignAddedToastOpen(true);
    focusShirtViewer(publicCopy.common.designOnShirt, true);
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
      const hasProcessedPreview =
        typeof analysis.processed_png === 'string' &&
        analysis.processed_png.startsWith('data:');

      if (hasProcessedPreview) {
        const processedFile = await dataUrlToFile(
          analysis.processed_png,
          selectedFile.name
        );

        setFile(processedFile);
        await applyLogoPreview(analysis.processed_png);

        if (previewObjectUrlRef.current) {
          URL.revokeObjectURL(previewObjectUrlRef.current);
          previewObjectUrlRef.current = null;
        }
      }

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

  const createAiConcept = async (
    prompt: string,
    options: {
      variationMode?: ArtworkVariationMode;
      intent?: Exclude<ArtworkGenerationIntent, null>;
      variationIndex?: number;
    } = {}
  ) => {
    setError('');
    setStatus('');
    setBackgroundCleanupStatus('');

    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      setError(t('status.describeLogoFirst'));
      return;
    }

    const variationMode = options.variationMode ?? 'new';
    const variationIndex =
      options.variationIndex ?? Math.max(1, aiConcepts.length + 1);
    const existingImageHashes = new Set(
      aiConcepts
        .map((concept) => concept.imageHash ?? hashImageDataUrl(concept.imageDataUrl))
        .filter(Boolean)
    );

    setIsGenerating(true);
    setGenerationIntent(options.intent ?? (aiConcepts.length > 0 ? 'new' : 'initial'));

    try {
      const requestConcept = async (forceDifferent: boolean) => {
        const res = await fetch('/api/artwork/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: trimmedPrompt,
            variationMode,
            variationIndex,
            forceDifferent,
            previousConcepts: aiConcepts.slice(0, 4).map((concept) => ({
              seed: concept.seed,
              variationHint: concept.variationHint,
              variationIndex: concept.variationIndex,
            })),
          }),
        });

        const payload = (await res
          .json()
          .catch(() => ({}))) as ArtworkGenerateResponse;

        if (!res.ok) {
          throw new Error(payload.message ?? t('status.generatorFailed'));
        }

        if (!payload.imageDataUrl) {
          throw new Error(t('status.generatorFailed'));
        }

        return payload;
      };

      let payload = await requestConcept(false);
      let imageHash = hashImageDataUrl(payload.imageDataUrl ?? '');
      let retriedForDuplicate = false;

      if (existingImageHashes.has(imageHash)) {
        retriedForDuplicate = true;
        setStatus('That result was too similar, so we tried another variation.');
        payload = await requestConcept(true);
        imageHash = hashImageDataUrl(payload.imageDataUrl ?? '');

        if (existingImageHashes.has(imageHash)) {
          setError(
            'This provider returned a similar concept. Try changing the idea or style.'
          );
          return;
        }
      }

      const imageDataUrl = payload.imageDataUrl;

      if (!imageDataUrl) {
        setError(t('status.generatorFailed'));
        return;
      }

      const concept: AIConcept = {
        id: createClientId('ai-concept'),
        imageDataUrl,
        filename: payload.filename ?? 'stitchra-ai-concept.png',
        prompt: trimmedPrompt,
        source: payload.source,
        seed: payload.seed,
        variationHint: payload.variationHint,
        variationIndex: payload.variationIndex ?? variationIndex,
        variationMode: payload.variationMode ?? variationMode,
        imageHash,
        createdAt: payload.createdAt ?? 0,
        accepted: false,
      };

      setAiConcepts((currentConcepts) => [
        concept,
        ...currentConcepts.filter((item) => item.id !== concept.id),
      ].slice(0, 4));
      setSelectedAiConceptId(concept.id);
      setDesignPreparation({
        embroidery_prompt: trimmedPrompt,
        recommended_style: 'Embroidery-friendly AI concept',
        max_colors: 6,
        warnings: [
          'AI concept only. Final stitch-ready artwork is reviewed by Stitchra.',
        ],
        recommendations: [
          'Use bold shapes, limited colors and clear placement for embroidery.',
        ],
        machine_ready_score: 78,
        simplified_description: trimmedPrompt,
      });
      setHasGeneratedAiConcept(true);
      setDesignStartMode('ai');
      setMobileDesignStep('review');

      setStatus(
        retriedForDuplicate
          ? 'That result was too similar, so we tried another variation.'
          : 'AI concept generated. Review it below before placing it on the shirt.'
      );
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : t('status.networkError')
      );
    } finally {
      setIsGenerating(false);
      setGenerationIntent(null);
    }
  };

  const generateLogo = async () => {
    await createAiConcept(getPromptWithStyleHints(logoPrompt), {
      variationMode: 'new',
      intent: aiConcepts.length > 0 ? 'new' : 'initial',
      variationIndex: aiConcepts.length + 1,
    });
  };

  const acceptAiConcept = async (concept: AIConcept) => {
    setError('');
    setStatus('');

    try {
      const conceptImage = getConceptDisplayImage(concept);
      const generatedFile = await dataUrlToNamedFile(
        conceptImage,
        concept.cleanedImageDataUrl
          ? getCleanedLogoFilename(concept.filename || 'stitchra-ai-concept.png')
          : concept.filename || 'stitchra-ai-concept.png'
      );

      setFile(generatedFile);
      await saveDraftImage(DESIGN_DRAFT_ACTIVE_LOGO_IMAGE_KEY, generatedFile);
      await applyLogoPreview(conceptImage);
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
      setLogoAnalysis(null);
      setActiveAiConceptId(concept.id);
      setAiConcepts((currentConcepts) =>
        currentConcepts.map((item) => ({
          ...item,
          accepted: item.id === concept.id,
        }))
      );
      setEstimate(null);
      setOrderStatus('');
      setOrderError('');
      setDesignStartMode('ai');
      setMobileDesignStep('place');
      setDesignAddedToastOpen(true);
      focusShirtViewer(publicCopy.common.designOnShirt, true);
      setStatus(publicCopy.designWizard.ai.previewNote);
      setEmptyDesignHelperOpen(false);
      setDraftSaveStatus('Draft saved just now');
    } catch {
      setError(t('status.generatorFailed'));
    }
  };

  const cleanUploadedLogoBackground = async () => {
    if (!file || isSvgLogoFile(file)) {
      return;
    }

    setIsCleaningBackground(true);
    setBackgroundCleanupStatus('');
    setError('');

    try {
      const { removePlainImageBackground } = await import(
        '@/lib/backgroundRemoval'
      );
      const result = await removePlainImageBackground(file);
      const cleanedFile = new File(
        [result.blob],
        getCleanedLogoFilename(file.name),
        { type: 'image/png' }
      );

      setFile(cleanedFile);
      await saveDraftImage(DESIGN_DRAFT_ACTIVE_LOGO_IMAGE_KEY, cleanedFile);
      await applyLogoPreview(result.dataUrl);

      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }

      setLogoAnalysis(null);
      setEstimate(null);
      setOrderStatus('');
      setOrderError('');
      setBackgroundCleanupStatus(t('status.logoReady'));
      setDesignAddedToastOpen(true);
      focusShirtViewer(publicCopy.common.designOnShirt, true);
      setEmptyDesignHelperOpen(false);
    } catch {
      setBackgroundCleanupStatus(
        t('status.cleanupUnavailable')
      );
    } finally {
      setIsCleaningBackground(false);
    }
  };

  const cleanAiConceptBackground = async (concept: AIConcept) => {
    setIsCleaningBackground(true);
    setBackgroundCleanupStatus('');
    setError('');

    try {
      const { removePlainImageBackground } = await import(
        '@/lib/backgroundRemoval'
      );
      const result = await removePlainImageBackground(
        getConceptDisplayImage(concept)
      );
      const cleanedAt = getCurrentTimestamp();

      setAiConcepts((currentConcepts) =>
        currentConcepts.map((item) =>
          item.id === concept.id
            ? {
                ...item,
                cleanedImageDataUrl: result.dataUrl,
                cleanedAt,
              }
            : item
        )
      );
      await saveDraftImage(`concept-${concept.id}-cleaned`, result.blob);

      if (activeAiConceptId === concept.id) {
        const cleanedFile = new File(
          [result.blob],
          getCleanedLogoFilename(concept.filename || 'stitchra-ai-concept.png'),
          { type: 'image/png' }
        );

        setFile(cleanedFile);
        await saveDraftImage(DESIGN_DRAFT_ACTIVE_LOGO_IMAGE_KEY, cleanedFile);
        await applyLogoPreview(result.dataUrl);
        focusShirtViewer(publicCopy.common.designOnShirt, true);
      }

      setBackgroundCleanupStatus(t('status.logoReady'));
      setDraftSaveStatus('Draft saved just now');
    } catch {
      setBackgroundCleanupStatus(
        t('status.cleanupUnavailable')
      );
    } finally {
      setIsCleaningBackground(false);
    }
  };

  const applyAiConceptChanges = async (
    changeRequest: string,
    concept: AIConcept
  ) => {
    const refinedPrompt = `${concept.prompt}. Requested changes: ${changeRequest}`
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 400);

    setLogoPrompt(refinedPrompt);
    await createAiConcept(refinedPrompt, {
      variationMode: 'refine',
      intent: 'refine',
      variationIndex: aiConcepts.length + 1,
    });
  };

  const estimatePrice = async () => {
    setError('');
    setStatus('');
    setOrderSuccess(null);

    if (!file) {
      setError(t('status.uploadLogoFirst'));
      return;
    }

    const capability = evaluateMachineCapability({
      zoneId: placementZoneId,
      widthMm: logoPlacementConfig.logo_width_mm,
      heightMm: logoPlacementConfig.logo_height_mm,
      colors: Math.max(1, logoAnalysis?.colors_count ?? 3),
    });

    if (capability.blocked) {
      setError(
        capability.message ??
          'This design is too large for the selected placement. Reduce size or choose another placement.'
      );
      return;
    }

    setIsEstimating(true);

    try {
      const fd = new FormData();

      fd.append('file', file);

      fd.append('width_mm', String(placementSize.width));

      fd.append('height_mm', String(placementSize.height));

      fd.append(
        'colors',
        String(Math.max(1, logoAnalysis?.colors_count ?? 3))
      );

      const res = await fetch(`${API}/estimate`, {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        setError(
          await getSafeResponseErrorMessage(
            res,
            t('status.estimatorFailed')
          )
        );
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
          placement: placementZoneId,
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

      const estimatedCapability = evaluateMachineCapability({
        zoneId: placementZoneId,
        widthMm: logoPlacementConfig.logo_width_mm,
        heightMm: logoPlacementConfig.logo_height_mm,
        colors: data.colors,
        stitches: data.stitches,
      });

      if (estimatedCapability.blocked) {
        setError(
          estimatedCapability.message ??
            'This design is too large for the selected placement. Reduce size or choose another placement.'
        );
        return;
      }

      if (estimatedCapability.reviewRequired) {
        pricedEstimate = {
          ...pricedEstimate,
          manual_quote: true,
          pricing_tier: 'studio_review',
          public_quote: {
            ...getPublicQuote(pricedEstimate),
            manual_quote: true,
            pricing_tier: 'studio_review',
            customer_warnings: [
              estimatedCapability.message ??
                publicCopy.designWizard.place.studioReview,
              ...getPublicQuote(pricedEstimate).customer_warnings,
            ],
          },
        };
      }

      const customerQuote = getPublicQuote(pricedEstimate);

      setEstimate(pricedEstimate);
      setOrderStatus('');
      setOrderError('');
      setMobileDesignStep('price');

      setStatus(
        customerQuote.manual_quote
          ? t('status.manualQuoteNeeded')
          : t('status.quoteReady')
      );
    } catch {
      setError(
        getPreviewAwareErrorMessage(t('status.networkError'))
      );
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
          placement: selectedZone.label,
          shirt_color: teeColor,
          logo_preview_url: preview ?? undefined,
          design_config: {
            placement: selectedZone.label,
            side: previewSideLabel,
            placement_zone: placementZoneId,
            logo_position_x: Number(
              logoPlacementConfig.logo_position_x.toFixed(4)
            ),
            logo_position_y: Number(
              logoPlacementConfig.logo_position_y.toFixed(4)
            ),
            logo_width_mm: Number(
              logoPlacementConfig.logo_width_mm.toFixed(1)
            ),
            logo_height_mm: Number(
              logoPlacementConfig.logo_height_mm.toFixed(1)
            ),
            logo_scale: Number(
              logoPlacementConfig.logo_scale.toFixed(4)
            ),
            logo_offset_x: Number(
              logoPlacementConfig.logo_offset_x.toFixed(2)
            ),
            logo_offset_y: Number(
              logoPlacementConfig.logo_offset_y.toFixed(2)
            ),
            shirt_color: teeColor,
            custom_placement: Boolean(customLogoPlacement),
            custom_placement_side: customLogoPlacement?.side,
            custom_placement_frame: customLogoPlacement?.frame,
            custom_placement_x: customLogoPlacement
              ? Number(customLogoPlacement.x.toFixed(4))
              : undefined,
            custom_placement_y: customLogoPlacement
              ? Number(customLogoPlacement.y.toFixed(4))
              : undefined,
          },
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
        .catch(() => ({}))) as OrderCreateResponsePayload;

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
          payload.code === 'PREVIEW_NOT_CONFIGURED'
            ? previewNotConfiguredMessage
            : payload.message ??
                t('status.databaseNotConfigured')
        );
        return;
      }

      setOrderStatus(t('status.requestSent'));
      setOrderSuccess({
        customerConfirmationSent: Boolean(payload.customerConfirmationSent),
      });
      setMobileDesignStep('request');
      setOrderFieldErrors({});
      setOrderOpen(false);
    } catch (error) {
      setOrderError(
        getPreviewAwareErrorMessage(t('status.orderSendFailed'))
      );

      if (process.env.NODE_ENV === 'development') {
        console.error(error);
      }
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

  const createPreviewExportBlob = async () => {
    if (!preview) {
      throw new Error('Upload or create a design before exporting the preview.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 900;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Preview export is not available in this browser.');
    }

    const shirtFill = teeColor === 'black' ? '#070809' : '#f3efe7';
    const shirtStroke =
      teeColor === 'black'
        ? 'rgba(255,255,255,0.18)'
        : 'rgba(20,25,24,0.16)';

    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#061611');
    gradient.addColorStop(0.55, '#061014');
    gradient.addColorStop(1, '#020304');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = 'rgba(0,255,180,0.12)';
    context.lineWidth = 1;
    for (let x = 80; x < canvas.width; x += 120) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      context.stroke();
    }
    for (let y = 80; y < canvas.height; y += 120) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.stroke();
    }

    context.save();
    context.translate(600, 450);
    context.fillStyle = shirtFill;
    context.strokeStyle = shirtStroke;
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(-230, -210);
    context.lineTo(-390, -110);
    context.lineTo(-315, 95);
    context.lineTo(-205, 50);
    context.lineTo(-190, 300);
    context.lineTo(190, 300);
    context.lineTo(205, 50);
    context.lineTo(315, 95);
    context.lineTo(390, -110);
    context.lineTo(230, -210);
    context.quadraticCurveTo(145, -255, 78, -215);
    context.quadraticCurveTo(0, -175, -78, -215);
    context.quadraticCurveTo(-145, -255, -230, -210);
    context.closePath();
    context.fill();
    context.stroke();

    context.globalCompositeOperation = 'destination-out';
    context.beginPath();
    context.ellipse(0, -202, 82, 44, 0, 0, Math.PI * 2);
    context.fill();
    context.globalCompositeOperation = 'source-over';
    context.strokeStyle = teeColor === 'black' ? '#101314' : '#d8d2c8';
    context.lineWidth = 10;
    context.beginPath();
    context.ellipse(0, -202, 82, 44, 0, 0, Math.PI * 2);
    context.stroke();

    const logoImage = await loadCanvasImage(preview);
    const logoMaxWidth = 260;
    const logoMaxHeight = 190;
    const logoRatio =
      logoImage.naturalWidth > 0 && logoImage.naturalHeight > 0
        ? logoImage.naturalWidth / logoImage.naturalHeight
        : logoAspectRatio;
    const logoWidth =
      logoRatio >= logoMaxWidth / logoMaxHeight
        ? logoMaxWidth
        : logoMaxHeight * logoRatio;
    const logoHeight = logoWidth / logoRatio;
    context.shadowColor =
      teeColor === 'black'
        ? 'rgba(255,255,255,0.55)'
        : 'rgba(0,255,180,0.28)';
    context.shadowBlur = 18;
    context.drawImage(
      logoImage,
      -logoWidth / 2,
      -logoHeight / 2 + 18,
      logoWidth,
      logoHeight
    );
    context.restore();

    context.fillStyle = 'rgba(245,247,248,0.9)';
    context.font = '700 34px Arial, Helvetica, sans-serif';
    context.fillText('Stitchra preview', 82, 90);
    context.fillStyle = 'rgba(245,247,248,0.62)';
    context.font = '22px Arial, Helvetica, sans-serif';
    context.fillText(`${selectedZone.label} · ${teeColor} tee`, 82, 128);

    return canvasToPngBlob(canvas);
  };

  const downloadPreview = async () => {
    setPreviewExportStatus('');

    try {
      const blob = await createPreviewExportBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'stitchra-preview.png';
      link.click();
      URL.revokeObjectURL(url);
      setPreviewExportStatus('Preview downloaded.');
    } catch (downloadError) {
      setPreviewExportStatus(
        downloadError instanceof Error
          ? downloadError.message
          : 'Preview export is not available right now.'
      );
    }
  };

  const sharePreview = async () => {
    setPreviewExportStatus('');

    try {
      const blob = await createPreviewExportBlob();
      const fileToShare = new File([blob], 'stitchra-preview.png', {
        type: 'image/png',
      });

      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [fileToShare] }) &&
        typeof navigator.share === 'function'
      ) {
        await navigator.share({
          title: 'Stitchra preview',
          text: 'My Stitchra embroidery preview',
          files: [fileToShare],
        });
        setPreviewExportStatus('Preview shared.');
        return;
      }

      await downloadPreview();
    } catch (shareError) {
      setPreviewExportStatus(
        shareError instanceof Error
          ? shareError.message
          : 'Sharing is not available on this browser.'
      );
    }
  };

  const currentStudioStep: GuidedStudioStepId = orderSuccess
    ? 'request'
    : publicQuote
      ? 'price'
      : preview
        ? 'place'
        : designStartMode === 'ai' && aiConcepts.length > 0
          ? 'review'
          : emptyDesignHelperOpen || designStartMode !== 'choice'
            ? 'create'
            : 'start';

  const guidedStudioSteps: GuidedStudioStep[] = [
    {
      id: 'start',
      label: 'Start',
      status: currentStudioStep === 'start' ? 'active' : 'complete',
    },
    {
      id: 'create',
      label: 'Create / Upload',
      status:
        currentStudioStep === 'create'
          ? 'active'
          : designStartMode !== 'choice' || preview || aiConcepts.length > 0
            ? 'complete'
            : 'locked',
    },
    {
      id: 'review',
      label: 'Review',
      status:
        currentStudioStep === 'review'
          ? 'active'
          : aiConcepts.length > 0 || preview
            ? 'complete'
            : 'locked',
    },
    {
      id: 'place',
      label: 'Place',
      status:
        currentStudioStep === 'place'
          ? 'active'
          : preview
            ? 'complete'
            : 'locked',
    },
    {
      id: 'price',
      label: 'Price',
      status:
        currentStudioStep === 'price'
          ? 'active'
          : publicQuote
            ? 'complete'
            : 'locked',
    },
    {
      id: 'request',
      label: 'Request',
      status:
        currentStudioStep === 'request'
          ? 'active'
          : orderSuccess
            ? 'complete'
            : 'locked',
    },
  ];

  const handleGuidedStepClick = (stepId: GuidedStudioStepId) => {
    const step = guidedStudioSteps.find((item) => item.id === stepId);

    if (!step || step.status === 'locked') {
      return;
    }

    if (stepId === 'start' || stepId === 'create') {
      scrollToStudioRoot();
      return;
    }

    if (stepId === 'review') {
      scrollToAiReview();
      return;
    }

    if (stepId === 'place') {
      focusShirtViewer(undefined, true);
      return;
    }

    if (stepId === 'price') {
      scrollToPriceAction();
      return;
    }

    scrollToOrderRequest();
  };

  const mobileExploreSections = publicCopy.mobileHome.exploreSections;
  const mobileHeroCopy = {
    eyebrow: publicCopy.mobileHome.productLabel,
    headline: publicCopy.mobileHome.heroTitle,
    subheadline: publicCopy.mobileHome.heroSubtitle,
    primaryCta: publicCopy.mobileHome.primaryCta,
    secondaryCta: publicCopy.mobileHome.secondaryCta,
    chips: publicCopy.mobileHome.trustChips,
    productionProof: publicCopy.mobileHome.productionProof,
    miniCardTitle: publicCopy.mobileHome.miniCardTitle,
    miniCardPrice: publicCopy.mobileHome.miniCardPrice,
  };
  const currentMobileStepIndex = Math.max(
    0,
    guidedStudioSteps.findIndex((step) => step.id === currentStudioStep)
  );
  const currentMobileStepLabel =
    guidedStudioSteps[currentMobileStepIndex]?.label ?? publicCopy.designWizard.steps.choose.label;
  const mobileStepHelp: Record<GuidedStudioStepId, string> = {
    start: publicCopy.designWizard.steps.choose.help,
    create: publicCopy.designWizard.steps.create.help,
    review: publicCopy.designWizard.steps.review.help,
    place: publicCopy.designWizard.steps.place.help,
    price: publicCopy.designWizard.steps.price.help,
    request: publicCopy.designWizard.steps.request.help,
  };
  const mobileDesignSteps: MobileDesignStepId[] = [
    'choose',
    'create',
    'review',
    'place',
    'price',
    'request',
  ];
  const mobileDesignStepLabels: Record<MobileDesignStepId, string> = {
    choose: publicCopy.designWizard.steps.choose.label,
    create: publicCopy.designWizard.steps.create.label,
    review: publicCopy.designWizard.steps.review.label,
    place: publicCopy.designWizard.steps.place.label,
    price: publicCopy.designWizard.steps.price.label,
    request: publicCopy.designWizard.steps.request.label,
  };
  const mobileDesignStepHelp: Record<MobileDesignStepId, string> = {
    choose: publicCopy.designWizard.steps.choose.help,
    create: publicCopy.designWizard.steps.create.help,
    review: publicCopy.designWizard.steps.review.help,
    place: publicCopy.designWizard.steps.place.help,
    price: publicCopy.designWizard.steps.price.help,
    request: publicCopy.designWizard.steps.request.help,
  };
  const designStartCopy = {
    eyebrow: publicCopy.designWizard.stepWord,
    title: publicCopy.designWizard.steps.choose.label,
    subtitle: publicCopy.designWizard.steps.choose.help,
    uploadTitle: publicCopy.designWizard.choice.uploadTitle,
    uploadText: publicCopy.designWizard.choice.uploadSubtitle,
    uploadCta: publicCopy.designWizard.choice.uploadCta,
    aiTitle: publicCopy.designWizard.choice.aiTitle,
    aiText: publicCopy.designWizard.choice.aiSubtitle,
    aiCta: publicCopy.designWizard.choice.aiCta,
  };
  const uploadPanelCopy = {
    eyebrow: publicCopy.designWizard.upload.eyebrow,
    title: publicCopy.designWizard.upload.title,
    subtitle: publicCopy.designWizard.upload.subtitle,
    chooseLogo: publicCopy.designWizard.upload.chooseLogo,
    fileHint: publicCopy.designWizard.upload.fileHint,
    maxSize: publicCopy.designWizard.upload.maxSize,
    ready: publicCopy.designWizard.upload.ready,
    viewOnShirt: publicCopy.designWizard.upload.viewOnShirt,
    removeBackground: publicCopy.designWizard.upload.removeBackground,
    cleaning: publicCopy.designWizard.upload.cleaning,
  };
  const aiCreatorCopy = {
    eyebrow: publicCopy.designWizard.ai.eyebrow,
    title: publicCopy.designWizard.ai.title,
    subtitle: publicCopy.designWizard.ai.subtitle,
    inputAria: publicCopy.designWizard.ai.title,
    placeholder: publicCopy.designWizard.ai.placeholder,
    generating: publicCopy.designWizard.ai.generating,
    generate: publicCopy.common.generateConcept,
    intent: publicCopy.designWizard.ai.intent,
    directionPrefix: publicCopy.designWizard.ai.directionPrefix,
    chooseDirection: publicCopy.designWizard.ai.chooseDirection,
    previewNote: publicCopy.designWizard.ai.previewNote,
    reviewNote: publicCopy.designWizard.ai.reviewNote,
    providerCredit: publicCopy.designWizard.ai.providerCredit,
    privateDataNote: publicCopy.designWizard.ai.privateDataNote,
    uploadInstead: publicCopy.designWizard.ai.uploadInstead,
    styleHints: publicCopy.designWizard.ai.styleHints,
  };
  const aiReviewCopy = {
    title: publicCopy.designWizard.steps.review.label,
    subtitle: publicCopy.designWizard.steps.review.help,
    badge: publicCopy.common.aiConcept,
    providerCredit: publicCopy.designWizard.ai.providerCredit,
    privateDataNote: publicCopy.designWizard.ai.privateDataNote,
    useThisDesign: publicCopy.common.useThisDesign,
    cleanBackground: publicCopy.designWizard.upload.removeBackground,
    cleaning: publicCopy.designWizard.upload.cleaning,
    generatingNew: publicCopy.designWizard.ai.generating,
    generateAnother: publicCopy.common.generateConcept,
    suggestChanges: publicCopy.common.keepEditing,
    uploadInstead: publicCopy.designWizard.ai.uploadInstead,
  };
  const shirtViewerCopy = {
    addDesignFirst: publicCopy.designWizard.place.emptyTitle,
    emptyTitle: publicCopy.designWizard.place.emptyTitle,
    emptyText: publicCopy.designWizard.place.emptyText,
    uploadLogo: publicCopy.common.uploadLogo,
    createWithAi: publicCopy.common.createWithAi,
    resetView: publicCopy.common.resetView,
    previewUnavailable: publicCopy.designWizard.review.addFirstText,
  };
  const quickSizeLabels = {
    Small: publicCopy.designWizard.place.small,
    Medium: publicCopy.designWizard.place.medium,
    Large: publicCopy.designWizard.place.large,
  };
  const mobileCompletedSteps = new Set<MobileDesignStepId>();

  if (designStartMode !== 'choice' || preview || aiConcepts.length > 0) {
    mobileCompletedSteps.add('choose');
  }

  if (preview || aiConcepts.length > 0 || logoPrompt.trim()) {
    mobileCompletedSteps.add('create');
  }

  if (preview) {
    mobileCompletedSteps.add('review');
    mobileCompletedSteps.add('place');
  }

  if (publicQuote) {
    mobileCompletedSteps.add('price');
  }

  if (orderSuccess) {
    mobileCompletedSteps.add('request');
  }

  const mobileDesignStepIndex = Math.max(
    0,
    mobileDesignSteps.indexOf(mobileDesignStep)
  );
  const goToMobileDesignStep = (stepId: MobileDesignStepId) => {
    if (stepId === mobileDesignStep || mobileCompletedSteps.has(stepId)) {
      setMobileDesignStep(stepId);
    }
  };
  const chooseMobileDesignMode = (
    mode: Exclude<DesignStartMode, 'choice'>
  ) => {
    setDesignStartMode(mode);
    setMobileDesignStep('create');
    setError('');
    setUploadError('');
    setStatus('');
    setBackgroundCleanupStatus('');
    setEmptyDesignHelperOpen(false);

    if (mode === 'ai') {
      window.setTimeout(() => {
        document.getElementById('stitchra-ai-idea-input')?.focus();
      }, 0);
    }
  };
  const draftIsRecent =
    restoredDraftAt !== null &&
    draftPromptNow - restoredDraftAt < 7 * 24 * 60 * 60 * 1000;
  const showMobileDraftPrompt =
    entry === 'home' && draftIsRecent && hasActiveDesignDraft;

  return (
    <main
      className={`home-shell home-entry-${entry}`}
      lang={activeLocale}
      dir={dir}
      style={{
        minHeight: '100vh',
        background: bg,
        color: '#f5f7f8',
        fontFamily:
          'var(--font-sans), "Helvetica Neue", Arial, sans-serif',
        overflowX: 'hidden',
        overflowY: 'visible',
        position: 'relative',
      }}
    >
      <BackgroundEffects />
      <GlobalVisualStyles />
      {entry === 'home' && <IntroSplash />}
      <Header
        locale={activeLocale}
        t={t}
        copy={publicCopy}
        onBrandReset={handleBrandResetClick}
        onStartDesigning={handleStartDesigningClick}
      />
      <StartNewDesignDialog
        open={resetDialogOpen}
        copy={{
          eyebrow: publicCopy.common.startFresh,
          title: publicCopy.designWizard.request.startNewDesign,
          text: publicCopy.mobileHome.draftText,
          cancel: publicCopy.common.cancel,
          confirm: publicCopy.designWizard.request.startNewDesign,
        }}
        onCancel={() => setResetDialogOpen(false)}
        onConfirm={() => void resetDesignToStart()}
      />
      {newDesignToast && (
        <div className="new-design-toast" role="status">
          {newDesignToast}
        </div>
      )}
      <DesignAddedToast
        open={designAddedToastOpen}
        copy={{
          ariaLabel: publicCopy.common.designOnShirt,
          eyebrow: publicCopy.common.aiConcept,
          title: publicCopy.common.designOnShirt,
          text: publicCopy.designWizard.place.placementText,
          viewOnShirt: publicCopy.designWizard.upload.viewOnShirt,
          checkPrice: publicCopy.common.getClearPrice,
          keepEditing: publicCopy.common.keepEditing,
        }}
        onViewOnShirt={() => {
          setDesignAddedToastOpen(false);
          focusShirtViewer(undefined, true);
        }}
        onCheckPrice={() => {
          setDesignAddedToastOpen(false);
          scrollToPriceAction();
        }}
        onKeepEditing={() => setDesignAddedToastOpen(false)}
      />

      <section id="mobile-home" className="mobile-app-launch" aria-label="Stitchra mobile start">
        <div className="mobile-launch-card">
          <Image
            src={homepageImages.machineDetail}
            alt=""
            aria-hidden="true"
            fill
            sizes="100vw"
            className="mobile-launch-bg-image"
          />
          <div className="mobile-launch-brand" aria-hidden="true">
            <div className="mobile-launch-logo">
              <StitchraLogo compact markOnly size={62} />
              <span />
            </div>
            <span>Stitchra</span>
          </div>
          <div
            className="mobile-launch-shirt-proof"
            data-stitchra-mobile-hero-proof="true"
            aria-label={`${mobileHeroCopy.miniCardTitle} - ${mobileHeroCopy.miniCardPrice}`}
          >
            <div className="mobile-launch-shirt-stage" aria-hidden="true">
              <Image
                src="/mockups/shirts/shirt-front-black.png"
                alt=""
                width={154}
                height={184}
                sizes="132px"
                className="mobile-launch-shirt-image"
              />
              <div className="mobile-launch-shirt-mark">
                <StitchraLogo compact markOnly size={34} />
              </div>
            </div>
            <div className="mobile-launch-shirt-meta">
              <span>{mobileHeroCopy.miniCardTitle}</span>
              <strong>{mobileHeroCopy.miniCardPrice}</strong>
            </div>
          </div>
          <p className="mobile-launch-eyebrow">{mobileHeroCopy.eyebrow}</p>
          <h1>{mobileHeroCopy.headline}</h1>
          <strong>{mobileHeroCopy.subheadline}</strong>
          <div className="mobile-launch-actions">
            <Link
              href={localize('/design')}
              className="mobile-launch-primary"
              data-stitchra-mobile-hero-primary="true"
            >
              {mobileHeroCopy.primaryCta}
            </Link>
            <Link href={localize('/gallery')} className="mobile-launch-secondary">
              {mobileHeroCopy.secondaryCta}
            </Link>
          </div>
          <div className="mobile-launch-proof-line">
            <span aria-hidden="true" />
            {mobileHeroCopy.productionProof}
          </div>
          <div className="mobile-launch-trust" aria-label="Stitchra trust signals">
            {mobileHeroCopy.chips.map((chip) => (
              <span key={chip}>{chip}</span>
            ))}
          </div>
          {showMobileDraftPrompt && (
            <div className="mobile-draft-soft-card" role="status">
              <div>
                <span>{publicCopy.mobileHome.savedDraft}</span>
                <strong>{publicCopy.mobileHome.continueDraft}</strong>
                <p>{publicCopy.mobileHome.draftText}</p>
              </div>
              <div>
                <Link href={localize('/design')}>{publicCopy.common.continue}</Link>
                <button
                  type="button"
                  onClick={() => void resetDesignDraftState()}
                >
                  {publicCopy.common.startFresh}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="mobile-explore" className="mobile-explore-hub">
        <div className="mobile-explore-heading">
          <span>{publicCopy.mobileHome.exploreEyebrow}</span>
          <h2>{publicCopy.mobileHome.exploreTitle}</h2>
          <p>{publicCopy.mobileHome.exploreText}</p>
        </div>

        <div className="mobile-explore-grid">
          {mobileExploreSections.map((item, index) => (
            <details key={item.id} id={item.id} open={index === 0}>
              <summary>
                <span>{String(index + 1).padStart(2, '0')}</span>
                {item.title}
              </summary>
              <p>{item.summary}</p>
              <ul>
                {item.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </details>
          ))}
        </div>

        <Link
          href={localize('/design')}
          className="mobile-explore-cta"
        >
          {publicCopy.common.startDesigning}
        </Link>
      </section>

      <section
        ref={mobileWizardRootRef}
        className="mobile-design-wizard"
        aria-label="Stitchra mobile design wizard"
      >
        <div className="mobile-design-wizard-shell">
          <div className="mobile-design-wizard-head">
            <span>
              {publicCopy.designWizard.stepWord} {mobileDesignStepIndex + 1} {publicCopy.designWizard.ofWord}{' '}
              {mobileDesignSteps.length}
            </span>
            <h1>{mobileDesignStepLabels[mobileDesignStep]}</h1>
            <p>{mobileDesignStepHelp[mobileDesignStep]}</p>
          </div>

          <MobileDesignStepper
            currentStep={mobileDesignStep}
            completedSteps={mobileCompletedSteps}
            labels={mobileDesignStepLabels}
            onStepClick={goToMobileDesignStep}
          />

          {showDraftRecovery && (
            <DraftRecoveryBanner
              lastSavedAt={restoredDraftAt}
              saveStatus={draftSaveStatus}
              imageNeedsUpload={draftImageNeedsUpload}
              copy={{
                ariaLabel: publicCopy.mobileHome.savedDraft,
                savedDraft: publicCopy.mobileHome.savedDraft,
                restoredSettings: publicCopy.mobileHome.continueDraft,
                restoredDesign: publicCopy.mobileHome.continueDraft,
                imageNeedsUploadText: publicCopy.mobileHome.draftText,
                readyText: publicCopy.mobileHome.draftText,
                continue: publicCopy.common.continue,
                startNew: publicCopy.designWizard.request.startNewDesign,
              }}
              onContinue={() => {
                continueRestoredDraft();
                setMobileDesignStep(
                  publicQuote
                    ? 'price'
                    : preview
                      ? 'place'
                      : aiConcepts.length > 0
                        ? 'review'
                        : designStartMode !== 'choice'
                          ? 'create'
                          : 'choose'
                );
              }}
              onStartNew={() => void resetDesignDraftState()}
            />
          )}

          <div className="mobile-design-step-panel">
            {mobileDesignStep === 'choose' && (
              <>
                <DesignStartOptions
                  selectedMode={designStartMode}
                  onSelectMode={chooseMobileDesignMode}
                  copy={designStartCopy}
                />
                <div className="mobile-design-inline-actions">
                  <button
                    type="button"
                    className="mobile-design-secondary-action"
                    onClick={() => {
                      setDesignStartMode('upload');
                      setMobileDesignStep('create');
                    }}
                  >
                    {publicCopy.common.uploadLogo}
                  </button>
                  <button
                    type="button"
                    className="mobile-design-primary-action"
                    onClick={() => {
                      setDesignStartMode('ai');
                      setMobileDesignStep('create');
                    }}
                  >
                    {publicCopy.common.createWithAi}
                  </button>
                </div>
              </>
            )}

            {mobileDesignStep === 'create' && (
              <div className="mobile-design-create-stack">
                {designStartMode === 'choice' && (
                  <DesignStartOptions
                    selectedMode={designStartMode}
                    onSelectMode={chooseMobileDesignMode}
                    copy={designStartCopy}
                  />
                )}

                {designStartMode === 'upload' && (
                  <div ref={mobileUploadPanelRef}>
                    <UploadOwnDesignPanel
                      fileName={file?.name ?? null}
                      canCleanBackground={Boolean(file) && !isSvgLogoFile(file)}
                      isCleaningBackground={isCleaningBackground}
                      cleanupStatus={backgroundCleanupStatus}
                      errorMessage={uploadError}
                      copy={uploadPanelCopy}
                      onFileChange={onFile}
                      onCleanBackground={() => void cleanUploadedLogoBackground()}
                      onViewOnShirt={() => setMobileDesignStep('place')}
                    />
                    <div className="mobile-design-inline-actions">
                      <button
                        type="button"
                        className="mobile-design-secondary-action"
                        onClick={() => setMobileDesignStep('choose')}
                      >
                        {publicCopy.common.back}
                      </button>
                      <button
                        type="button"
                        className="mobile-design-primary-action"
                        disabled={!preview}
                        onClick={() => setMobileDesignStep('review')}
                      >
                        {publicCopy.designWizard.review.continueToReview}
                      </button>
                    </div>
                  </div>
                )}

                {designStartMode === 'ai' && (
                  <div ref={mobileAiCreatorRef}>
                    <AICreatorPanel
                      prompt={logoPrompt}
                      selectedStyleHints={aiStyleHints}
                      isGenerating={isGenerating}
                      hasGeneratedConcept={hasGeneratedAiConcept}
                      copy={aiCreatorCopy}
                      onPromptChange={(value) => {
                        setLogoPrompt(value);
                        setDesignPreparation(null);
                        setError('');
                        setStatus('');
                      }}
                      onToggleStyleHint={toggleAiStyleHint}
                      onGenerate={generateLogo}
                      onSwitchToUpload={() => {
                        setDesignStartMode('upload');
                        setMobileDesignStep('create');
                      }}
                    />
                    <div className="mobile-design-inline-actions">
                      <button
                        type="button"
                        className="mobile-design-secondary-action"
                        onClick={() => setMobileDesignStep('choose')}
                      >
                        {publicCopy.common.back}
                      </button>
                      <button
                        type="button"
                        className="mobile-design-primary-action"
                        disabled={aiConcepts.length === 0}
                        onClick={() => setMobileDesignStep('review')}
                      >
                        {publicCopy.designWizard.review.continueToReview}
                      </button>
                    </div>
                  </div>
                )}

                {(status || error) && (
                  <p className={error ? 'mobile-design-error' : 'mobile-design-status'}>
                    {error || status}
                  </p>
                )}
              </div>
            )}

            {mobileDesignStep === 'review' && (
              <div ref={mobileAiReviewRef} className="mobile-design-review-stack">
                {selectedAiConcept ? (
                  <AIConceptReviewPanel
                    concepts={aiConcepts}
                    selectedConceptId={selectedAiConcept?.id ?? null}
                    activeConceptId={activeAiConceptId}
                    styleHints={aiStyleHints.map(
                      (styleHint) =>
                        publicCopy.designWizard.ai.styleHints[styleHint] ?? styleHint
                    )}
                    readiness={aiConceptReadiness}
                    isGenerating={isGenerating}
                    isGeneratingVariation={generationIntent === 'new'}
                    isCleaningBackground={isCleaningBackground}
                    backgroundCleanupStatus={backgroundCleanupStatus}
                    copy={aiReviewCopy}
                    onSelectConcept={setSelectedAiConceptId}
                    onUseConcept={(concept) => {
                      void acceptAiConcept(concept).then(() => {
                        setMobileDesignStep('place');
                      });
                    }}
                    onCleanBackground={(concept) =>
                      void cleanAiConceptBackground(concept)
                    }
                    onGenerateAnother={generateLogo}
                    onApplyChanges={(changeRequest, concept) =>
                      void applyAiConceptChanges(changeRequest, concept)
                    }
                    onSwitchToUpload={() => {
                      setDesignStartMode('upload');
                      setMobileDesignStep('create');
                    }}
                  />
                ) : preview ? (
                  <section className="mobile-upload-review-card">
                    <div>
                      <span>{publicCopy.designWizard.review.uploadedEyebrow}</span>
                      <h2>{publicCopy.designWizard.review.uploadedTitle}</h2>
                      <p>{publicCopy.designWizard.review.uploadedText}</p>
                    </div>
                    <button
                      type="button"
                      className="mobile-upload-review-stage"
                      onClick={() => setMobileDesignStep('place')}
                    >
                      {/* Native img is used for local object URLs and generated data URLs. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt={publicCopy.designWizard.review.uploadedTitle} />
                    </button>
                    <div className="mobile-design-inline-actions">
                      {file && !isSvgLogoFile(file) && (
                        <button
                          type="button"
                          className="mobile-design-secondary-action"
                          onClick={() => void cleanUploadedLogoBackground()}
                          disabled={isCleaningBackground}
                        >
                          {isCleaningBackground
                            ? publicCopy.designWizard.upload.cleaning
                            : publicCopy.designWizard.upload.removeBackground}
                        </button>
                      )}
                      <button
                        type="button"
                        className="mobile-design-primary-action"
                        onClick={() => setMobileDesignStep('place')}
                      >
                        {publicCopy.common.useThisDesign}
                      </button>
                    </div>
                    {backgroundCleanupStatus && (
                      <p className="mobile-design-status">{backgroundCleanupStatus}</p>
                    )}
                  </section>
                ) : (
                  <section className="mobile-empty-design-card">
                    <h2>{publicCopy.designWizard.review.addFirstTitle}</h2>
                    <p>{publicCopy.designWizard.review.addFirstText}</p>
                    <div className="mobile-design-inline-actions">
                      <button
                        type="button"
                        className="mobile-design-secondary-action"
                        onClick={() => {
                          setDesignStartMode('upload');
                          setMobileDesignStep('create');
                        }}
                      >
                        {publicCopy.common.uploadLogo}
                      </button>
                      <button
                        type="button"
                        className="mobile-design-primary-action"
                        onClick={() => {
                          setDesignStartMode('ai');
                          setMobileDesignStep('create');
                        }}
                      >
                        {publicCopy.common.createWithAi}
                      </button>
                    </div>
                  </section>
                )}
              </div>
            )}

            {mobileDesignStep === 'place' && (
              <div className="mobile-design-place-stack">
                <div ref={mobileShirtViewerRef} className="mobile-design-viewer-card">
                  <ShirtPlacementMockup
                    key={`mobile-${placementZoneId}-${placementGroup}`}
                    logoUrl={preview}
                    shirtColor={teeColor}
                    placementZone={placementZoneId}
                    config={logoPlacementConfig}
                    logoAspectRatio={logoAspectRatio}
                    onConfigChange={updateLogoPlacementConfig}
                    customPlacement={customLogoPlacement}
                    onCustomPlacementChange={updateCustomLogoPlacement}
                    copy={shirtViewerCopy}
                    viewerGroup={placementGroup}
                    focusPulseKey={logoFocusPulseKey}
                    showEmptyStateHelper={!preview && emptyDesignHelperOpen}
                    onEmptyDesignClick={showEmptyDesignHelper}
                    onStartUpload={() => {
                      setDesignStartMode('upload');
                      setMobileDesignStep('create');
                    }}
                    onStartAi={() => {
                      setDesignStartMode('ai');
                      setMobileDesignStep('create');
                    }}
                    guidanceHint={
                      viewerHint ||
                      (preview
                        ? publicCopy.designWizard.place.guidanceWithLogo
                        : publicCopy.designWizard.place.guidanceEmpty)
                    }
                  />
                </div>

                {!preview ? (
                  <section className="mobile-empty-design-card">
                    <h2>{publicCopy.designWizard.place.emptyTitle}</h2>
                    <p>{publicCopy.designWizard.place.emptyText}</p>
                    <div className="mobile-design-inline-actions">
                      <button
                        type="button"
                        className="mobile-design-secondary-action"
                        onClick={() => {
                          setDesignStartMode('upload');
                          setMobileDesignStep('create');
                        }}
                      >
                        {publicCopy.common.uploadLogo}
                      </button>
                      <button
                        type="button"
                        className="mobile-design-primary-action"
                        onClick={() => {
                          setDesignStartMode('ai');
                          setMobileDesignStep('create');
                        }}
                      >
                        {publicCopy.common.createWithAi}
                      </button>
                    </div>
                  </section>
                ) : (
                  <>
                    <div ref={mobilePlacementControlsRef} className="mobile-placement-card">
                      <div className="guided-section-header">
                        <span>{publicCopy.designWizard.place.placementEyebrow}</span>
                        <h3>{publicCopy.designWizard.place.placementTitle}</h3>
                        <p>{publicCopy.designWizard.place.placementText}</p>
                      </div>

                      <div className="placement-mode-row">
                        <button
                          type="button"
                          className={placementMode === 'preset' ? 'placement-mode-active' : ''}
                          onClick={() => {
                            setPlacementMode('preset');
                            setCustomLogoPlacement(null);
                            setViewerHint('');
                          }}
                        >
                          {publicCopy.designWizard.place.preset}
                        </button>
                        <button
                          type="button"
                          className={placementMode === 'custom' ? 'placement-mode-active' : ''}
                          onClick={() => {
                            setPlacementMode('custom');
                            focusShirtViewer(publicCopy.designWizard.place.customHint, true);
                          }}
                        >
                          {publicCopy.designWizard.place.custom}
                        </button>
                      </div>

                      <select
                        className="placement-mobile-select"
                        value={placement}
                        onChange={(event) =>
                          updatePlacement(event.target.value as Placement)
                        }
                        style={input}
                        aria-label={publicCopy.designWizard.place.placementTitle}
                      >
                        {placementGroups.map((group) => (
                          <optgroup
                            key={group.id}
                            label={getLocalizedPlacementGroupLabel(
                              activeLocale,
                              group.id,
                              group.label
                            )}
                          >
                            {group.zones.map((zoneId) => {
                              const zone = getEmbroideryZone(zoneId);

                              return (
                                <option key={zoneId} value={zoneId}>
                                  {getLocalizedPlacementZoneLabel(
                                    activeLocale,
                                    zoneId,
                                    zone.label
                                  )}
                                </option>
                              );
                            })}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div className="mobile-placement-card">
                      <div className="guided-section-header">
                        <span>{publicCopy.designWizard.place.garment}</span>
                        <h3>{publicCopy.designWizard.place.chooseShirtColor}</h3>
                      </div>
                      <div className="mobile-shirt-color-row">
                        {(['black', 'white'] as const).map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={teeColor === color ? 'mobile-shirt-color-active' : ''}
                            onClick={() => updateShirtColor(color)}
                          >
                            <span data-color={color} />
                            {color === 'black'
                              ? publicCopy.designWizard.place.blackTee
                              : publicCopy.designWizard.place.whiteTee}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mobile-placement-card">
                      <div className="guided-section-header">
                        <span>{publicCopy.designWizard.place.size}</span>
                        <h3>{formatLogoSize(logoPlacementConfig)}</h3>
                        <p>{publicCopy.designWizard.place.sizeHelp}</p>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max={Math.round(maxLogoWidthMm)}
                        step="1"
                        value={Math.round(logoPlacementConfig.logo_width_mm)}
                        onChange={(event) => {
                          const widthMm = Number(event.target.value);

                          updateLogoPlacementConfig({
                            ...logoPlacementConfig,
                            logo_width_mm: widthMm,
                            logo_height_mm: widthMm / logoAspectRatio,
                          });
                        }}
                        style={rangeInput}
                        aria-label={publicCopy.designWizard.place.size}
                      />
                      <div className="logo-size-quick-row">
                        {logoSizeQuickActions.map((action) => (
                          <button
                            key={action.label}
                            type="button"
                            onClick={() =>
                              updateLogoPlacementConfig({
                                ...logoPlacementConfig,
                                logo_width_mm: action.widthMm,
                                logo_height_mm: action.widthMm / logoAspectRatio,
                              })
                            }
                          >
                            {quickSizeLabels[action.label as keyof typeof quickSizeLabels] ?? action.label}
                          </button>
                        ))}
                      </div>
                      {capabilityPreview.message && (
                        <p className="mobile-design-warning">
                          {capabilityPreview.blocked
                            ? capabilityPreview.message
                            : publicCopy.designWizard.place.studioReview}
                        </p>
                      )}
                    </div>

                    <div className="mobile-design-inline-actions mobile-design-sticky-actions">
                      <button
                        type="button"
                        className="mobile-design-secondary-action"
                        onClick={() => setMobileDesignStep('review')}
                      >
                        {publicCopy.common.back}
                      </button>
                      <button
                        type="button"
                        className="mobile-design-primary-action"
                        onClick={() => setMobileDesignStep('price')}
                      >
                        {publicCopy.designWizard.place.continueToPrice}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {mobileDesignStep === 'price' && (
              <div ref={mobilePriceActionRef} className="mobile-price-step">
                <section className="mobile-price-card">
                  <span>{publicCopy.designWizard.price.eyebrow}</span>
                  <h2>{publicCopy.designWizard.price.title}</h2>
                  <p>{publicCopy.designWizard.price.text}</p>
                  <button
                    type="button"
                    className="mobile-design-primary-action"
                    onClick={estimatePrice}
                    disabled={isEstimating || isAnalyzing || !file}
                  >
                    {isAnalyzing
                      ? publicCopy.designWizard.price.preparingLogo
                      : isEstimating
                        ? publicCopy.designWizard.price.preparingQuote
                        : publicCopy.common.getClearPrice}
                  </button>
                  {!file && (
                    <p className="mobile-design-error">
                      {publicCopy.designWizard.price.addDesignFirst}
                    </p>
                  )}
                  {(status || error) && (
                    <p className={error ? 'mobile-design-error' : 'mobile-design-status'}>
                      {error || status}
                    </p>
                  )}
                </section>

                {publicQuote && (
                  <>
                    <div className="mobile-price-metrics">
                      <Metric
                        label={publicCopy.designWizard.price.stitches}
                        value={publicQuote.stitches.toLocaleString()}
                      />
                      <Metric label={publicCopy.designWizard.price.colors} value={publicQuote.colors} />
                      <Metric
                        label={publicCopy.designWizard.price.coverage}
                        value={`${(publicQuote.coverage * 100).toFixed(1)}%`}
                      />
                      <Metric
                        label={publicCopy.designWizard.price.price}
                        value={
                          publicQuote.manual_quote
                            ? publicCopy.designWizard.price.studioReviewRecommended
                            : `€${publicQuote.price_eur}`
                        }
                      />
                    </div>
                    <section className="mobile-price-card">
                      <strong>
                        {publicQuote.manual_quote
                          ? publicCopy.designWizard.price.studioReviewRecommended
                          : publicCopy.designWizard.price.clearStartingPrice}
                      </strong>
                      <p>
                        {publicQuote.manual_quote
                          ? publicCopy.designWizard.price.studioReviewText
                          : publicCopy.designWizard.price.estimateText}
                      </p>
                      <small>{publicCopy.designWizard.price.finalOffer}</small>
                    </section>
                    <div className="mobile-design-inline-actions mobile-design-sticky-actions">
                      <button
                        type="button"
                        className="mobile-design-secondary-action"
                        onClick={() => setMobileDesignStep('place')}
                      >
                        {publicCopy.common.back}
                      </button>
                      <button
                        type="button"
                        className="mobile-design-primary-action"
                        onClick={() => {
                          setOrderOpen(true);
                          setMobileDesignStep('request');
                        }}
                      >
                        {publicCopy.designWizard.price.continueToRequest}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {mobileDesignStep === 'request' && (
              <div ref={mobileOrderRequestRef} className="mobile-request-step">
                {orderSuccess ? (
                  <div className="order-success-panel mobile-request-success">
                    <span>{publicCopy.designWizard.request.sent}</span>
                    <h3>{publicCopy.designWizard.request.successTitle}</h3>
                    {orderSuccess.customerConfirmationSent && (
                      <p className="order-success-email">
                        {publicCopy.designWizard.request.confirmationEmail}
                      </p>
                    )}
                    <ol>
                      {publicCopy.designWizard.request.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                    <div className="order-success-actions">
                      <button type="button" onClick={() => setMobileDesignStep('place')}>
                        {publicCopy.designWizard.request.backToDesign}
                      </button>
                      <button
                        type="button"
                        onClick={() => void resetDesignDraftState()}
                      >
                        {publicCopy.designWizard.request.startNewDesign}
                      </button>
                      <a href="mailto:orders@stitchra.com">
                        {publicCopy.common.contactSupport}
                      </a>
                    </div>
                  </div>
                ) : publicQuote ? (
                  <form
                    noValidate
                    onSubmit={(event) => void requestOrder(event)}
                    className="mobile-request-form"
                  >
                    <div className="mobile-request-summary">
                      <span>{publicCopy.designWizard.request.summary}</span>
                      <strong>
                        {getLocalizedPlacementZoneLabel(
                          activeLocale,
                          placementZoneId,
                          selectedZone.label
                        )}
                      </strong>
                      <p>
                        {teeColor === 'black'
                          ? publicCopy.designWizard.place.blackTee
                          : publicCopy.designWizard.place.whiteTee}{' '}
                        ·{' '}
                        {formatLogoSize(logoPlacementConfig)} ·{' '}
                        {publicQuote.manual_quote
                          ? publicCopy.designWizard.price.studioReviewRecommended
                          : `€${publicQuote.price_eur}`}
                      </p>
                    </div>

                    <input
                      value={orderForm.name}
                      onChange={(event) =>
                        updateOrderFormField('name', event.target.value)
                      }
                      placeholder={publicCopy.designWizard.request.yourName}
                      aria-label={publicCopy.designWizard.request.yourName}
                      aria-invalid={Boolean(orderFieldErrors.name)}
                      style={{
                        ...input,
                        ...(orderFieldErrors.name ? invalidInput : {}),
                      }}
                    />
                    {orderFieldErrors.name && (
                      <span style={fieldError}>{orderFieldErrors.name}</span>
                    )}

                    <input
                      value={orderForm.email}
                      onChange={(event) =>
                        updateOrderFormField('email', event.target.value)
                      }
                      placeholder={publicCopy.designWizard.request.email}
                      aria-label={publicCopy.designWizard.request.email}
                      type="email"
                      autoComplete="email"
                      aria-invalid={Boolean(orderFieldErrors.email)}
                      style={{
                        ...input,
                        ...(orderFieldErrors.email ? invalidInput : {}),
                      }}
                    />
                    {orderFieldErrors.email && (
                      <span style={fieldError}>{orderFieldErrors.email}</span>
                    )}

                    <input
                      value={orderForm.phone}
                      onChange={(event) =>
                        updateOrderFormField('phone', event.target.value)
                      }
                      placeholder={publicCopy.designWizard.request.phone}
                      aria-label={publicCopy.designWizard.request.phone}
                      aria-invalid={Boolean(orderFieldErrors.phone)}
                      style={{
                        ...input,
                        ...(orderFieldErrors.phone ? invalidInput : {}),
                      }}
                    />
                    {orderFieldErrors.phone && (
                      <span style={fieldError}>{orderFieldErrors.phone}</span>
                    )}

                    <input
                      value={orderForm.quantity}
                      onChange={(event) =>
                        updateOrderFormField('quantity', event.target.value)
                      }
                      placeholder={publicCopy.designWizard.request.quantity}
                      aria-label={publicCopy.designWizard.request.quantity}
                      type="number"
                      min="1"
                      step="1"
                      aria-invalid={Boolean(orderFieldErrors.quantity)}
                      style={{
                        ...input,
                        ...(orderFieldErrors.quantity ? invalidInput : {}),
                      }}
                    />
                    {orderFieldErrors.quantity && (
                      <span style={fieldError}>{orderFieldErrors.quantity}</span>
                    )}

                    <textarea
                      value={orderForm.note}
                      onChange={(event) =>
                        updateOrderFormField('note', event.target.value)
                      }
                      placeholder={publicCopy.designWizard.request.note}
                      aria-label={publicCopy.designWizard.request.note}
                      rows={3}
                      style={{
                        ...input,
                        resize: 'vertical',
                      }}
                    />

                    <div className="mobile-design-inline-actions mobile-design-sticky-actions">
                      <button
                        type="button"
                        className="mobile-design-secondary-action"
                        onClick={() => setMobileDesignStep('price')}
                      >
                        {publicCopy.common.back}
                      </button>
                      <button
                        type="submit"
                        className="mobile-design-primary-action"
                        disabled={isRequestingOrder}
                      >
                        {isRequestingOrder
                          ? publicCopy.designWizard.request.sending
                          : publicCopy.designWizard.request.sendRequest}
                      </button>
                    </div>
                    {orderError && <p className="mobile-design-error">{orderError}</p>}
                    {orderStatus && !orderSuccess && (
                      <p className="mobile-design-status">{orderStatus}</p>
                    )}
                  </form>
                ) : (
                  <section className="mobile-empty-design-card">
                    <h2>{publicCopy.designWizard.price.title}</h2>
                    <p>{publicCopy.designWizard.price.text}</p>
                    <button
                      type="button"
                      className="mobile-design-primary-action"
                      onClick={() => setMobileDesignStep('price')}
                    >
                      {publicCopy.designWizard.place.continueToPrice}
                    </button>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section
        id="hero"
        className="desktop-home-section desktop-hero-section"
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
              align-items: stretch;
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
              background: linear-gradient(90deg, #00ff88, #00d7ff 58%, #7cf0d4);
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
                radial-gradient(circle at 20% 84%, rgba(124,240,212,0.08), transparent 36%);
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
              background: linear-gradient(135deg, #00ff88, #00c8ff 58%, #7cf0d4);
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
              background: #7cf0d4;
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
              align-self: stretch;
              height: 100%;
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
              .hero-atelier {
                min-height: clamp(690px, calc(100svh - 214px), 790px);
              }

              .hero-copy-panel {
                display: flex;
                flex-direction: column;
                justify-content: center;
                height: 100%;
              }

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
                onClick={handleStartDesigningClick}
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
                  {selectedZone.maxWidthMm} × {selectedZone.maxHeightMm} mm ·{' '}
                  {t('hero.productionReady')}
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
        ref={studioRootRef}
        className="designer-section showroom-section"
        data-mobile-step={currentStudioStep}
        style={{
          padding: '112px 24px 128px',
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
        }}
      >
        <div className="mobile-wizard-status" aria-live="polite">
          <span>
            Step {currentMobileStepIndex + 1} of {guidedStudioSteps.length}
          </span>
          <strong>{currentMobileStepLabel}</strong>
          <p>{mobileStepHelp[currentStudioStep]}</p>
        </div>

        <div className="guided-studio-stepper-wrap">
          <GuidedStudioStepper
            steps={guidedStudioSteps}
            onStepClick={handleGuidedStepClick}
          />
        </div>

        <div
          className="designer-grid showroom-grid"
          style={{
            maxWidth: 1160,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 22,
            alignItems: 'stretch',
          }}
        >
          <HoverCard
            style={glassCard}
            className="designer-controls-card showroom-controls-card"
          >
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
              className="showroom-control-stack"
              style={{
                display: 'grid',
                gap: 16,
              }}
            >
              {showDraftRecovery && (
                <DraftRecoveryBanner
                  lastSavedAt={restoredDraftAt}
                  saveStatus={draftSaveStatus}
                  imageNeedsUpload={draftImageNeedsUpload}
                  copy={{
                    ariaLabel: publicCopy.mobileHome.savedDraft,
                    savedDraft: publicCopy.mobileHome.savedDraft,
                    restoredSettings: publicCopy.mobileHome.continueDraft,
                    restoredDesign: publicCopy.mobileHome.continueDraft,
                    imageNeedsUploadText: publicCopy.mobileHome.draftText,
                    readyText: publicCopy.mobileHome.draftText,
                    continue: publicCopy.common.continue,
                    startNew: publicCopy.designWizard.request.startNewDesign,
                  }}
                  onContinue={continueRestoredDraft}
                  onStartNew={() => void resetDesignDraftState()}
                />
              )}

              <DesignStartOptions
                selectedMode={designStartMode}
                copy={designStartCopy}
                onSelectMode={(mode) => {
                  setDesignStartMode(mode);
                  setError('');
                  setUploadError('');
                  setStatus('');
                  setBackgroundCleanupStatus('');
                  setEmptyDesignHelperOpen(false);

                  if (mode === 'ai') {
                    window.setTimeout(() => {
                      document
                        .getElementById('stitchra-ai-idea-input')
                        ?.focus();
                    }, 0);
                  }
                }}
              />

              {designStartMode === 'upload' && (
                <div ref={uploadPanelRef}>
                  <UploadOwnDesignPanel
                    fileName={file?.name ?? null}
                    canCleanBackground={Boolean(file) && !isSvgLogoFile(file)}
                    isCleaningBackground={isCleaningBackground}
                    cleanupStatus={backgroundCleanupStatus}
                    errorMessage={uploadError}
                    copy={uploadPanelCopy}
                    onFileChange={onFile}
                    onCleanBackground={() => void cleanUploadedLogoBackground()}
                    onViewOnShirt={() => focusShirtViewer(undefined, true)}
                  />
                </div>
              )}

              {designStartMode === 'ai' && (
                <>
                  <div ref={aiCreatorRef}>
                    <AICreatorPanel
                      prompt={logoPrompt}
                      selectedStyleHints={aiStyleHints}
                      isGenerating={isGenerating}
                      hasGeneratedConcept={hasGeneratedAiConcept}
                      copy={aiCreatorCopy}
                      onPromptChange={(value) => {
                        setLogoPrompt(value);
                        setDesignPreparation(null);
                        setError('');
                        setStatus('');
                      }}
                      onToggleStyleHint={toggleAiStyleHint}
                      onGenerate={generateLogo}
                      onSwitchToUpload={() => {
                        scrollToUploadPanel();
                      }}
                    />
                  </div>
                  <div ref={aiReviewRef}>
                    <AIConceptReviewPanel
                      concepts={aiConcepts}
                      selectedConceptId={selectedAiConcept?.id ?? null}
                      activeConceptId={activeAiConceptId}
                      styleHints={aiStyleHints.map(
                        (styleHint) =>
                          publicCopy.designWizard.ai.styleHints[styleHint] ?? styleHint
                      )}
                      readiness={aiConceptReadiness}
                      isGenerating={isGenerating}
                      isGeneratingVariation={generationIntent === 'new'}
                      isCleaningBackground={isCleaningBackground}
                      backgroundCleanupStatus={backgroundCleanupStatus}
                      copy={aiReviewCopy}
                      onSelectConcept={setSelectedAiConceptId}
                      onUseConcept={(concept) => void acceptAiConcept(concept)}
                      onCleanBackground={(concept) =>
                        void cleanAiConceptBackground(concept)
                      }
                      onGenerateAnother={generateLogo}
                      onApplyChanges={(changeRequest, concept) =>
                        void applyAiConceptChanges(changeRequest, concept)
                      }
                      onSwitchToUpload={() => {
                        scrollToUploadPanel();
                      }}
                    />
                  </div>
                </>
              )}

              {designStartMode !== 'choice' && (
                <>
                  <div
                    ref={placementControlsRef}
                    className="guided-placement-panel"
                  >
                    <div className="guided-section-header">
                      <span>{publicCopy.designWizard.place.placementEyebrow}</span>
                      <h3>{publicCopy.designWizard.place.placementTitle}</h3>
                      <p>{publicCopy.designWizard.place.placementText}</p>
                    </div>

                    <div className="placement-mode-row">
                      <button
                        type="button"
                        className={
                          placementMode === 'preset'
                            ? 'placement-mode-active'
                            : ''
                        }
                        onClick={() => {
                          setPlacementMode('preset');
                          setCustomLogoPlacement(null);
                          setViewerHint('');
                        }}
                      >
                        {publicCopy.designWizard.place.preset}
                      </button>
                      <button
                        type="button"
                        className={
                          placementMode === 'custom'
                            ? 'placement-mode-active'
                            : ''
                        }
                        onClick={() => {
                          setPlacementMode('custom');
                          focusShirtViewer(
                            preview
                              ? publicCopy.designWizard.place.customHint
                              : publicCopy.designWizard.place.guidanceEmpty,
                            true
                          );
                        }}
                      >
                        {publicCopy.designWizard.place.custom}
                      </button>
                    </div>

                    {placementMode === 'preset' && (
                      <div style={placementSelector}>
                        <div
                          className="placement-tab-row"
                          style={placementTabRow}
                        >
                          {placementGroups.map((group) => (
                            <button
                              key={group.id}
                              type="button"
                              onClick={() => setPlacementGroup(group.id)}
                              style={placementTabButton(
                                placementGroup === group.id
                              )}
                            >
                              {getLocalizedPlacementGroupLabel(
                                activeLocale,
                                group.id,
                                group.label
                              )}
                            </button>
                          ))}
                        </div>

                        <div
                          className="placement-chip-grid"
                          style={placementChipGrid}
                        >
                          {placementGroups
                            .find((group) => group.id === placementGroup)
                            ?.zones.map((zoneId) => {
                              const zone = getEmbroideryZone(zoneId);
                              const active = placement === zoneId;

                              return (
                                <button
                                  key={zoneId}
                                  type="button"
                                  onClick={() => updatePlacement(zoneId)}
                                  style={placementChipButton(active)}
                                >
                                  <span>
                                    {getLocalizedPlacementZoneLabel(
                                      activeLocale,
                                      zoneId,
                                      zone.label
                                    )}
                                  </span>
                                  <small>
                                    {zone.maxWidthMm} × {zone.maxHeightMm} mm
                                  </small>
                                </button>
                              );
                            })}
                        </div>

                        <select
                          className="placement-mobile-select"
                          value={placement}
                          onChange={(event) =>
                            updatePlacement(event.target.value as Placement)
                          }
                          style={input}
                          aria-label={publicCopy.designWizard.place.placementTitle}
                        >
                          {placementGroups.map((group) => (
                            <optgroup
                              key={group.id}
                              label={getLocalizedPlacementGroupLabel(
                                activeLocale,
                                group.id,
                                group.label
                              )}
                            >
                              {group.zones.map((zoneId) => {
                                const zone = getEmbroideryZone(zoneId);

                                return (
                                  <option key={zoneId} value={zoneId}>
                                    {getLocalizedPlacementZoneLabel(
                                      activeLocale,
                                      zoneId,
                                      zone.label
                                    )}
                                  </option>
                                );
                              })}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="guided-shirt-color-panel">
                    <div className="guided-section-header">
                      <span>{publicCopy.designWizard.place.garment}</span>
                      <h3>{t('designer.chooseShirtColor')}</h3>
                    </div>
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
                                updateShirtColor(color)
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
                  </div>

              <div style={configuratorControlPanel}>
                <div style={configuratorControlHeader}>
                  <strong>Logo placement</strong>
                  <span>
                    {getLocalizedPlacementZoneLabel(
                      activeLocale,
                      placementZoneId,
                      selectedZone.label
                    )}
                  </span>
                </div>
                <label style={sliderLabel}>
                  {publicCopy.designWizard.place.size}: {formatLogoSize(logoPlacementConfig)}
                  <input
                    type="range"
                    min="20"
                    max={Math.round(maxLogoWidthMm)}
                    step="1"
                    value={Math.round(logoPlacementConfig.logo_width_mm)}
                    onChange={(event) => {
                      const widthMm = Number(event.target.value);

                      updateLogoPlacementConfig({
                        ...logoPlacementConfig,
                        logo_width_mm: widthMm,
                        logo_height_mm: widthMm / logoAspectRatio,
                      });
                    }}
                    style={rangeInput}
                  />
                </label>
                <div
                  className="logo-size-quick-row"
                  aria-label="Quick logo size"
                >
                  {logoSizeQuickActions.map((action) => {
                    const active =
                      Math.abs(
                        logoPlacementConfig.logo_width_mm - action.widthMm
                      ) < 2;

                    return (
                      <button
                        key={action.label}
                        type="button"
                        className={active ? 'logo-size-quick-active' : ''}
                        onClick={() =>
                          updateLogoPlacementConfig({
                            ...logoPlacementConfig,
                            logo_width_mm: action.widthMm,
                            logo_height_mm: action.widthMm / logoAspectRatio,
                          })
                        }
                      >
                        {quickSizeLabels[action.label as keyof typeof quickSizeLabels] ?? action.label}
                      </button>
                    );
                  })}
                </div>
                <p style={configuratorHint}>
                  {publicCopy.designWizard.place.sizeHelp}
                </p>
                {capabilityPreview.message && (
                  <p
                    style={{
                      ...configuratorWarning,
                      color: capabilityPreview.blocked
                        ? '#ffb4b4'
                        : '#ffe083',
                    }}
                  >
                    {capabilityPreview.blocked
                      ? capabilityPreview.message
                      : publicCopy.designWizard.place.studioReview}
                  </p>
                )}
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

              <div ref={priceActionRef} className="quote-action-anchor">
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
              </div>

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

                  <p className="pricing-trust-note">
                    Final offer is confirmed before production. Studio review is
                    quality control, not a failure.
                  </p>

                  <div ref={orderRequestRef} className="order-request-anchor">
                    <button
                      type="button"
                      onClick={() => {
                        setOrderOpen((open) => !open);
                        setOrderError('');
                        setOrderStatus('');
                        setOrderSuccess(null);
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

                    {orderSuccess && (
                      <div className="order-success-panel">
                        <span>{publicCopy.designWizard.request.sent}</span>
                        <h3>{publicCopy.designWizard.request.successTitle}</h3>
                        {orderSuccess.customerConfirmationSent && (
                          <p className="order-success-email">
                            {publicCopy.designWizard.request.confirmationEmail}
                          </p>
                        )}
                        <ol>
                          {publicCopy.designWizard.request.steps.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ol>
                        <div className="order-success-actions">
                          <button type="button" onClick={() => focusShirtViewer(undefined, true)}>
                            {publicCopy.designWizard.request.backToDesign}
                          </button>
                          <button
                            type="button"
                            onClick={() => void resetDesignDraftState()}
                          >
                            {publicCopy.designWizard.request.startNewDesign}
                          </button>
                          <a href="mailto:orders@stitchra.com">
                            {publicCopy.common.contactSupport}
                          </a>
                        </div>
                      </div>
                    )}

                    {orderStatus && !orderSuccess && (
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
                  </div>
                </>
              )}
                </>
              )}
              {designStartMode !== 'choice' && (
                <div className="design-draft-footer">
                  {draftSaveStatus && <span>{draftSaveStatus}</span>}
                  <button
                    type="button"
                    className="design-reset-link"
                    onClick={() => void resetDesignDraftState()}
                  >
                    {publicCopy.designWizard.request.startNewDesign}
                  </button>
                </div>
              )}
            </div>
          </HoverCard>

          <div ref={shirtViewerRef} className="showroom-viewer-anchor">
            <ShirtPlacementMockup
              key={`${placementZoneId}-${placementGroup}`}
              logoUrl={preview}
              shirtColor={teeColor}
              placementZone={placementZoneId}
              config={logoPlacementConfig}
              logoAspectRatio={logoAspectRatio}
              onConfigChange={updateLogoPlacementConfig}
              customPlacement={customLogoPlacement}
              onCustomPlacementChange={updateCustomLogoPlacement}
              copy={shirtViewerCopy}
              viewerGroup={placementGroup}
              focusPulseKey={logoFocusPulseKey}
              showEmptyStateHelper={!preview && emptyDesignHelperOpen}
              onEmptyDesignClick={showEmptyDesignHelper}
              onStartUpload={scrollToUploadPanel}
              onStartAi={scrollToAiCreator}
              guidanceHint={
                viewerHint ||
                (placementMode === 'custom'
                  ? preview
                    ? publicCopy.designWizard.place.customHint
                    : publicCopy.designWizard.place.guidanceEmpty
                  : undefined)
              }
            />
            {preview && (
              <div className="design-next-step-row" aria-label="Design next steps">
                <span>{publicCopy.common.designOnShirt}</span>
                <button
                  type="button"
                  onClick={() => {
                    setPlacementMode('custom');
                    focusShirtViewer(
                      publicCopy.designWizard.place.customHint,
                      true
                    );
                  }}
                >
                  {publicCopy.designWizard.place.custom}
                </button>
                <button type="button" onClick={scrollToPlacementControls}>
                  {publicCopy.designWizard.place.placementTitle}
                </button>
                <button type="button" onClick={scrollToPriceAction}>
                  {publicCopy.common.getClearPrice}
                </button>
                <button type="button" onClick={() => void downloadPreview()}>
                  {publicCopy.common.downloadPreview}
                </button>
                <button type="button" onClick={() => void sharePreview()}>
                  {publicCopy.common.shareDesign}
                </button>
                <button
                  type="button"
                  onClick={() => void resetDesignDraftState()}
                >
                  {publicCopy.designWizard.request.startNewDesign}
                </button>
                {previewExportStatus && (
                  <small>{previewExportStatus}</small>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="how" className="desktop-home-section" style={sectionStyle}>
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
              visual={step.visual}
              accent={step.accent}
            />
          ))}
        </div>
      </section>

      <section id="features" className="desktop-home-section studio-tools-section" style={toolSectionStyle}>
        <div style={toolSectionInner}>
          <SectionHeader
            eyebrow={t('sections.featuresEyebrow')}
            title={t('sections.featuresTitle')}
            text={t('sections.featuresText')}
          />

          <div className="tool-card-grid" style={toolGrid}>
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                text={feature.text}
                accent={feature.accent}
                footer={feature.footer}
                visual={feature.visual}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="craft" className="desktop-home-section" style={sectionStyle}>
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

      <section id="gallery" className="desktop-home-section" style={sectionStyle}>
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

      <section id="pricing" className="desktop-home-section" style={sectionStyle}>
        <SectionHeader
          eyebrow={t('sections.pricingEyebrow')}
          title={t('sections.pricingTitle')}
          text={t('sections.pricingText')}
        />

        <div
          className="glow-card pricing-confidence-panel"
          style={pricingPanel}
        >
          <div className="pricing-confidence-header">
            <div>
              <span>{t('pricing.confidenceLabel')}</span>
              <strong>{t('pricing.finalOfferNote')}</strong>
            </div>
            <div className="pricing-euro-orbit" aria-hidden="true">
              €
            </div>
          </div>

          <div
            className="pricing-factor-row"
            aria-label={t('pricing.factorsLabel')}
          >
            {pricingFactors.map((factor) => (
              <span key={factor}>{factor}</span>
            ))}
          </div>

          <div className="pricing-card-grid">
            {pricingCards.map((card) => (
              <PricingCard key={card.label} card={card} />
            ))}
          </div>

          <div className="pricing-receipt-grid">
            <div className="pricing-receipt-card">
              <div className="pricing-receipt-head">
                <span>{t('pricing.exampleEstimate')}</span>
                <strong>
                  {publicQuote
                    ? publicQuote.manual_quote
                      ? t('hero.manualQuote')
                      : `€${publicQuote.price_eur}`
                    : t('pricing.from9')}
                </strong>
              </div>
              <div className="pricing-receipt-lines">
                <div>
                  <span>{t('pricing.receiptPlacement')}</span>
                  <strong>{t('pricing.leftChest')}</strong>
                </div>
                <div>
                  <span>{t('pricing.receiptArtwork')}</span>
                  <strong>{t('pricing.cleanLogo')}</strong>
                </div>
                <div>
                  <span>{t('pricing.receiptColors')}</span>
                  <strong>3</strong>
                </div>
                <div>
                  <span>{t('pricing.receiptResult')}</span>
                  <strong>{t('pricing.from9')}</strong>
                </div>
              </div>
            </div>

            <div className="pricing-review-card">
              <span>{t('pricing.reviewBadge')}</span>
              <strong>{t('pricing.reviewTitle')}</strong>
              <p>{t('pricing.reviewText')}</p>
              <div aria-hidden="true" className="pricing-stitch-bars">
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>

          <div className="pricing-cta-row">
            <a
              href="#designer"
              className="lux-button pricing-cta-button"
              style={wideButton}
              onClick={handleStartDesigningClick}
            >
              {t('pricing.getClearPrice')}
            </a>
            <p>{t('pricing.ctaHelp')}</p>
          </div>
        </div>
      </section>

      <section id="faq" className="desktop-home-section" style={sectionStyle}>
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

      <section className="desktop-home-section final-cta-section" style={ctaSection}>
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
            onClick={handleStartDesigningClick}
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
            <StitchraLogo compact markOnly size={34} />
            <span><strong style={{ color: '#f5f7f8' }}>Stitchra</strong> · {publicCopy.footer.tagline}</span>
          </a>

          <div style={footerLinks}>
            <Link href={localize('/how-it-works')} style={footerLink}>{publicCopy.footer.how}</Link>
            <Link href={localize('/features')} style={footerLink}>{publicCopy.footer.features}</Link>
            <Link href={localize('/pricing')} style={footerLink}>{publicCopy.footer.pricing}</Link>
            <Link href={localize('/faq')} style={footerLink}>{publicCopy.footer.faq}</Link>
            <a href="https://stitchra.com/impressum" style={footerLink}>{publicCopy.footer.impressum}</a>
            <a href="https://stitchra.com/privacy" style={footerLink}>{publicCopy.footer.privacy}</a>
            <Link href={localize('/contact')} style={footerLink}>{publicCopy.footer.contact}</Link>
            <a href="https://stitchra.com/terms" style={footerLink}>{publicCopy.footer.terms}</a>
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
  copy,
  onBrandReset,
  onStartDesigning,
}: {
  locale: Locale;
  t: Translator;
  copy: PublicI18nCopy;
  onBrandReset: (event: MouseEvent<HTMLAnchorElement>) => void;
  onStartDesigning: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const navItems = getNavItems(t);
  const mobileNavItems = getLocalizedRouteItems(locale);
  const localize = (path: string) => localizedPath(locale, path);
  const mobileArrow = getLocaleDirection(locale) === 'rtl' ? '←' : '→';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileLanguageOpen, setMobileLanguageOpen] = useState(false);
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileLanguageOpen(false);
  };
  const openMobileLanguageSheet = () => setMobileLanguageOpen(true);
  const closeMobileLanguageSheet = () => setMobileLanguageOpen(false);

  const switchLocale = (nextLocale: Locale) => {
    const hash = window.location.hash;
    const nextPath = switchLocalePath(window.location.pathname, nextLocale);

    setMobileLanguageOpen(false);
    setMobileMenuOpen(false);
    try {
      window.localStorage.setItem('stitchra-locale', nextLocale);
    } catch {
      // Local storage can be unavailable in private browsing modes.
    }
    window.location.assign(`${nextPath}${hash}`);
  };

  useEffect(() => {
    if (!mobileMenuOpen && !mobileLanguageOpen) {
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

      if (mobileLanguageOpen) {
        setMobileLanguageOpen(false);
        return;
      }

      setMobileMenuOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      delete document.body.dataset.stitchraMobileSheetOpen;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileLanguageOpen, mobileMenuOpen]);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 901px)');
    const closeDesktopMenu = () => {
      if (query.matches) {
        setMobileMenuOpen(false);
        setMobileLanguageOpen(false);
      }
    };

    closeDesktopMenu();
    query.addEventListener('change', closeDesktopMenu);

    return () => {
      query.removeEventListener('change', closeDesktopMenu);
    };
  }, []);

  return (
    <header
      className="site-header"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: mobileMenuOpen || mobileLanguageOpen ? 280 : 50,
        backdropFilter: 'blur(26px) saturate(1.18)',
        background:
          'linear-gradient(180deg, rgba(0,8,7,0.92), rgba(0,5,5,0.78))',
        borderBottom:
          '1px solid rgba(185,255,222,0.14)',
        boxShadow:
          '0 18px 54px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <nav
        className="site-nav"
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          height: 78,
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
          aria-label="Go to Stitchra home and start a new design"
          onClick={onBrandReset}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            textDecoration: 'none',
          }}
        >
          <StitchraLogo compact size={46} showSubtitle={false} className="header-logo" />
        </a>

        <div
          className="desktop-nav-links"
          style={{
            display: 'flex',
            gap: 20,
            alignItems: 'center',
          }}
        >
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="desktop-nav-link"
              style={navLink}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div
          className="header-actions"
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <LanguageSwitcher locale={locale} t={t} />

          <a
            href="#designer"
            className="lux-button desktop-start-link"
            style={primaryButton}
            onClick={onStartDesigning}
          >
            {t('nav.start')}
          </a>

          <Link
            href={localize('/design')}
            className="lux-button mobile-start-link"
            style={primaryButton}
          >
            {copy.common.startDesigning}
          </Link>

          <button
            type="button"
            className="mobile-menu-button"
            aria-label={
              mobileMenuOpen ? copy.menu.ariaClose : copy.menu.ariaOpen
            }
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((current) => !current)}
            style={mobileMenuButton}
          >
            {mobileMenuOpen ? copy.common.close : copy.common.menu}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div
          className="mobile-menu-backdrop"
          onClick={closeMobileMenu}
          role="presentation"
        >
          <section
            className="mobile-menu-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobile-menu-heading">
              <div>
                <p>Stitchra</p>
                <h2 id="mobile-menu-title">{copy.menu.title}</h2>
              </div>
              <button
                type="button"
                className="mobile-menu-close"
                onClick={closeMobileMenu}
                aria-label={copy.menu.ariaClose}
              >
                ×
              </button>
            </div>

            <nav className="mobile-menu-panel" aria-label="Mobile navigation">
              {mobileNavItems.map((item) => (
                <Link
                  key={item.label}
                  href={localize(item.href)}
                  onClick={closeMobileMenu}
                >
                  <span>{item.label}</span>
                  <span aria-hidden="true">{mobileArrow}</span>
                </Link>
              ))}
            </nav>

            <div className="mobile-language-card">
              <div>
                <p>{copy.common.language}</p>
                <span>{getLocaleDisplay(locale)}</span>
              </div>
              <button
                type="button"
                onClick={openMobileLanguageSheet}
                aria-haspopup="dialog"
              >
                {localeFlags[locale]} {localeLabels[locale].code}
              </button>
            </div>

            <Link
              href={localize('/design')}
              className="mobile-menu-primary"
              onClick={() => {
                closeMobileMenu();
              }}
            >
              {copy.common.startDesigning}
            </Link>
          </section>
        </div>
      )}

      {mobileLanguageOpen && (
        <div
          className="mobile-language-backdrop"
          onClick={closeMobileLanguageSheet}
          role="presentation"
        >
          <section
            className="mobile-language-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-language-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobile-language-heading">
              <div>
                <p>{copy.common.language}</p>
                <h2 id="mobile-language-title">{copy.common.chooseLanguage}</h2>
              </div>
              <button
                type="button"
                className="mobile-menu-close"
                onClick={closeMobileLanguageSheet}
                aria-label={copy.menu.ariaCloseLanguage}
              >
                ×
              </button>
            </div>

            <div className="mobile-language-options">
              {locales.map((item) => {
                const active = item === locale;

                return (
                  <button
                    key={item}
                    type="button"
                    className={active ? 'mobile-language-active' : ''}
                    onClick={() => switchLocale(item)}
                  >
                    <span>{getLocaleDisplay(item)}</span>
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
    const hash = window.location.hash;
    const nextPath = switchLocalePath(window.location.pathname, nextLocale);

    setOpen(false);
    try {
      window.localStorage.setItem('stitchra-locale', nextLocale);
    } catch {
      // Local storage can be unavailable in private browsing modes.
    }
    window.location.assign(`${nextPath}${hash}`);
  };

  return (
    <div className="desktop-language-switcher" style={languageSwitcher}>
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
        <span>
          <span aria-hidden="true">{localeFlags[locale]}</span>{' '}
          {localeLabels[locale].code}
        </span>
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
              <span>{getLocaleDisplay(item)}</span>
              <strong>
                {localeLabels[item].code}
                {item === locale ? <span aria-hidden="true"> ✓</span> : null}
              </strong>
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

// Kept temporarily as a legacy 2D preview reference while the 3D configurator settles.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          scroll-padding-top: 132px;
          max-width: 100%;
        }

        body {
          max-width: 100%;
          overflow-x: clip;
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        main {
          overflow-x: clip;
        }

        section[id] {
          scroll-margin-top: 132px;
        }

        #gallery {
          scroll-margin-top: 132px;
        }

        #how,
        #features,
        #craft,
        #gallery,
        #pricing,
        #faq,
        .final-cta-section {
          background:
            linear-gradient(rgba(185,255,222,0.020) 1px, transparent 1px),
            linear-gradient(90deg, rgba(185,255,222,0.018) 1px, transparent 1px),
            radial-gradient(circle at 18% 8%, rgba(0,255,136,0.060), transparent 32%),
            radial-gradient(circle at 84% 18%, rgba(0,215,255,0.055), transparent 34%),
            linear-gradient(180deg, rgba(0,8,7,0.24), rgba(0,13,11,0.15));
          background-size: 88px 88px, 88px 88px, auto, auto, auto;
          background-position: center top;
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

        .stitchra-upload-box {
          position: relative;
          width: 100%;
          min-height: 116px;
          display: grid;
          grid-template-columns: auto minmax(128px, auto) minmax(0, 1fr);
          align-items: center;
          gap: 16px;
          padding: 18px;
          border-radius: 24px;
          border: 1px solid rgba(0,215,255,0.18);
          background:
            radial-gradient(circle at 14% 22%, rgba(0,255,136,0.14), transparent 34%),
            radial-gradient(circle at 88% 72%, rgba(0,215,255,0.11), transparent 34%),
            linear-gradient(135deg, rgba(255,255,255,0.085), rgba(255,255,255,0.030));
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.08),
            0 20px 58px rgba(0,0,0,0.20);
          cursor: pointer;
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease;
        }

        .stitchra-upload-box:hover {
          transform: translateY(-1px);
          border-color: rgba(24,255,154,0.38);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.10),
            0 24px 72px rgba(0,0,0,0.26),
            0 0 34px rgba(0,215,255,0.08);
        }

        .stitchra-upload-box input {
          position: absolute;
          inline-size: 1px;
          block-size: 1px;
          opacity: 0;
          pointer-events: none;
        }

        .stitchra-upload-icon {
          width: 58px;
          height: 58px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.14);
          background:
            radial-gradient(circle at 34% 24%, rgba(255,255,255,0.18), transparent 32%),
            rgba(0,255,136,0.09);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 0 28px rgba(0,255,136,0.10);
        }

        .stitchra-upload-icon i {
          position: relative;
          width: 30px;
          height: 24px;
          display: block;
          border: 2px solid rgba(0,215,255,0.92);
          border-radius: 8px;
        }

        .stitchra-upload-icon i::before {
          content: "";
          position: absolute;
          left: 50%;
          top: -12px;
          width: 16px;
          height: 16px;
          border-top: 2px solid #18ff9a;
          border-left: 2px solid #18ff9a;
          transform: translateX(-50%) rotate(45deg);
        }

        .stitchra-upload-button {
          min-height: 44px;
          padding: 0 16px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f7fff9, #dff7ff);
          color: #06100a;
          font-weight: 900;
          white-space: nowrap;
        }

        .stitchra-upload-copy {
          min-width: 0;
          color: rgba(245,247,248,0.62);
          font-size: 13px;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .upload-trust-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: -6px;
        }

        .upload-trust-row span {
          min-height: 28px;
          display: inline-flex;
          align-items: center;
          padding: 0 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.10);
          color: rgba(245,247,248,0.64);
          background: rgba(255,255,255,0.035);
          font-size: 11px;
          font-weight: 850;
        }

        .upload-ready-status {
          margin: 0;
          width: fit-content;
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid rgba(24,255,154,0.25);
          color: #9dffc4;
          background: rgba(24,255,154,0.08);
          font-size: 12px;
          font-weight: 850;
        }

        .upload-ready-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }

        .upload-clean-button {
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid rgba(0,215,255,0.22);
          color: #dffcff;
          background: rgba(0,215,255,0.075);
          font: inherit;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            background 160ms ease;
        }

        .upload-view-button {
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          border: 0;
          color: #06100a;
          background: linear-gradient(135deg, #18ff9a, #00c8ff);
          font: inherit;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 10px 26px rgba(0,215,255,0.14);
        }

        .upload-clean-button:hover {
          transform: translateY(-1px);
          border-color: rgba(24,255,154,0.38);
          background: rgba(24,255,154,0.09);
        }

        .upload-clean-button:disabled {
          cursor: not-allowed;
          opacity: 0.58;
          transform: none;
        }

        .upload-cleanup-status {
          margin: 0;
          color: rgba(157,255,196,0.78);
          font-size: 12px;
          line-height: 1.45;
        }

        .upload-error-message {
          margin: 0;
          color: #ffb4b4;
          font-size: 12px;
          line-height: 1.45;
        }

        .guided-studio-stepper-wrap {
          max-width: 1160px;
          margin: 0 auto 20px;
          scroll-margin-top: 132px;
        }

        .guided-studio-stepper {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 8px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.10);
          background:
            radial-gradient(circle at 8% 20%, rgba(0,255,136,0.12), transparent 32%),
            rgba(5,10,11,0.70);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.06),
            0 20px 60px rgba(0,0,0,0.24);
          scrollbar-width: none;
        }

        .guided-studio-stepper::-webkit-scrollbar {
          display: none;
        }

        .guided-studio-step {
          flex: 1 0 auto;
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 13px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.10);
          color: rgba(245,247,248,0.64);
          background: rgba(255,255,255,0.035);
          font: inherit;
          font-size: 12px;
          font-weight: 900;
          white-space: nowrap;
          cursor: pointer;
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            color 160ms ease,
            background 160ms ease;
        }

        .guided-studio-step span {
          width: 22px;
          height: 22px;
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          color: #06100a;
          background: linear-gradient(135deg, #18ff9a, #00c8ff);
          font-size: 11px;
        }

        .guided-studio-step-complete:hover {
          transform: translateY(-1px);
          border-color: rgba(0,215,255,0.34);
          color: #dffcff;
          background: rgba(0,215,255,0.07);
        }

        .guided-studio-step-active {
          border-color: rgba(24,255,154,0.45);
          color: #9dffc4;
          background: rgba(24,255,154,0.10);
          box-shadow: 0 0 30px rgba(0,255,136,0.08);
        }

        .guided-studio-step-locked {
          opacity: 0.48;
          cursor: not-allowed;
        }

        .design-start-panel,
        .design-path-panel {
          display: grid;
          gap: 18px;
          padding: 18px;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.11);
          background:
            radial-gradient(circle at 12% 12%, rgba(0,255,136,0.11), transparent 34%),
            linear-gradient(145deg, rgba(255,255,255,0.070), rgba(255,255,255,0.026));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
        }

        .design-start-header,
        .design-path-header {
          display: grid;
          gap: 6px;
        }

        .design-start-header span,
        .design-path-header span {
          color: #00ff88;
          font-size: 11px;
          font-weight: 880;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .design-start-header h2,
        .design-path-header h3 {
          margin: 0;
          color: #f5f7f8;
          font-size: clamp(20px, 2.2vw, 26px);
          line-height: 1.12;
          letter-spacing: 0;
        }

        .design-path-header h3 {
          font-size: clamp(18px, 1.8vw, 22px);
        }

        .design-start-header p,
        .design-path-header p,
        .design-path-helper {
          margin: 0;
          color: rgba(245,247,248,0.65);
          font-size: 14px;
          line-height: 1.58;
        }

        .ai-provider-credit {
          margin: -4px 0 0;
          width: fit-content;
          color: rgba(245,247,248,0.46);
          font-size: 11px;
          line-height: 1.5;
          font-weight: 760;
          letter-spacing: 0.01em;
        }

        .ai-provider-credit a {
          color: rgba(0,215,255,0.72);
          text-decoration: none;
          text-underline-offset: 3px;
        }

        .ai-provider-credit a:hover {
          color: #9dffc4;
          text-decoration: underline;
        }

        .design-start-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          align-items: stretch;
        }

        .design-start-card {
          position: relative;
          min-width: 0;
          min-height: 250px;
          display: grid;
          grid-template-rows: auto auto 1fr auto;
          gap: 16px;
          align-content: start;
          padding: 20px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 22px;
          background:
            radial-gradient(circle at 80% 18%, rgba(0,215,255,0.11), transparent 34%),
            rgba(3,8,9,0.55);
          color: #f5f7f8;
          text-align: left;
          cursor: pointer;
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            background 180ms ease,
            box-shadow 180ms ease;
        }

        .design-start-card::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(120deg, rgba(255,255,255,0.09), transparent 36%, rgba(0,255,136,0.07));
          opacity: 0;
          transition: opacity 180ms ease;
        }

        .design-start-card:hover,
        .design-start-card-active {
          transform: translateY(-2px);
          border-color: rgba(0,255,136,0.44);
          background:
            radial-gradient(circle at 80% 18%, rgba(0,215,255,0.16), transparent 34%),
            radial-gradient(circle at 18% 86%, rgba(0,255,136,0.13), transparent 34%),
            rgba(3,8,9,0.68);
          box-shadow: 0 24px 74px rgba(0,0,0,0.26), 0 0 42px rgba(0,255,136,0.08);
        }

        .design-start-card:hover::after,
        .design-start-card-active::after {
          opacity: 1;
        }

        .design-start-card strong,
        .design-start-card p,
        .design-start-card small,
        .design-start-visual {
          position: relative;
          z-index: 1;
        }

        .design-start-card strong {
          font-size: 18px;
          line-height: 1.18;
        }

        .design-start-card p {
          margin: 0;
          color: rgba(245,247,248,0.64);
          font-size: 13px;
          line-height: 1.55;
        }

        .design-start-card small {
          display: inline-flex;
          width: fit-content;
          min-height: 34px;
          align-items: center;
          justify-content: center;
          padding: 0 13px;
          border-radius: 999px;
          color: #071110;
          background: linear-gradient(135deg, #18ff9a, #00c8ff);
          font-size: 12px;
          font-weight: 900;
        }

        .design-start-visual {
          position: relative;
          width: 100%;
          height: 96px;
          display: grid;
          place-items: center;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.14);
          background:
            radial-gradient(circle at 35% 28%, rgba(255,255,255,0.18), transparent 26%),
            rgba(255,255,255,0.055);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
        }

        .design-start-visual i {
          position: relative;
          width: 42px;
          height: 34px;
          display: block;
          border-radius: 12px;
          border: 2px solid rgba(0,255,136,0.86);
          box-shadow: 0 0 22px rgba(0,255,136,0.22);
        }

        .design-start-visual b {
          position: absolute;
          right: 12px;
          bottom: 12px;
          min-height: 24px;
          display: inline-flex;
          align-items: center;
          padding: 0 8px;
          border-radius: 999px;
          color: rgba(246,255,249,0.82);
          background: rgba(0,0,0,0.34);
          border: 1px solid rgba(255,255,255,0.12);
          font-size: 10px;
          font-style: normal;
          font-weight: 900;
          letter-spacing: 0.05em;
        }

        .design-start-visual-upload b:nth-of-type(1) {
          right: 74px;
        }

        .design-start-visual-upload b:nth-of-type(2) {
          right: 42px;
        }

        .design-start-visual-ai b {
          right: 14px;
          color: #071110;
          background: linear-gradient(135deg, #18ff9a, #00c8ff);
          border-color: transparent;
        }

        .design-start-visual-upload i::before,
        .design-start-visual-ai i::before,
        .design-start-visual-ai i::after {
          content: "";
          position: absolute;
          pointer-events: none;
        }

        .design-start-visual-upload i::before {
          left: 50%;
          top: -10px;
          width: 18px;
          height: 18px;
          border-top: 2px solid #00d7ff;
          border-left: 2px solid #00d7ff;
          transform: translateX(-50%) rotate(45deg);
        }

        .design-start-visual-ai i {
          border-color: rgba(0,215,255,0.9);
          border-radius: 999px;
        }

        .design-start-visual-ai i::before {
          inset: 7px;
          border-radius: 999px;
          border: 1px solid rgba(124,240,212,0.88);
        }

        .design-start-visual-ai i::after {
          right: -9px;
          top: 4px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #7cf0d4;
          box-shadow: -34px 26px 0 #00ff88, 0 0 18px rgba(124,240,212,0.52);
        }

        .design-path-panel-ai {
          border-color: rgba(0,215,255,0.16);
          background:
            radial-gradient(circle at 80% 16%, rgba(0,215,255,0.13), transparent 34%),
            radial-gradient(circle at 18% 82%, rgba(124,240,212,0.12), transparent 32%),
            linear-gradient(145deg, rgba(255,255,255,0.070), rgba(255,255,255,0.026));
        }

        .ai-concept-studio {
          position: relative;
          overflow: hidden;
        }

        .ai-concept-studio::before {
          content: "";
          position: absolute;
          inset: -90px 18% auto auto;
          width: 190px;
          height: 190px;
          pointer-events: none;
          border-radius: 999px;
          background:
            radial-gradient(circle, rgba(0,215,255,0.22), rgba(124,240,212,0.10) 42%, transparent 68%);
          filter: blur(14px);
          opacity: 0.72;
        }

        .ai-concept-studio > * {
          position: relative;
          z-index: 1;
        }

        .draft-recovery-banner {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          padding: 16px;
          border-radius: 24px;
          border: 1px solid rgba(24,255,154,0.22);
          background:
            radial-gradient(circle at 14% 18%, rgba(0,255,136,0.14), transparent 34%),
            radial-gradient(circle at 88% 68%, rgba(0,215,255,0.10), transparent 34%),
            rgba(255,255,255,0.045);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.08),
            0 20px 62px rgba(0,0,0,0.22);
        }

        .draft-recovery-banner div {
          min-width: 0;
        }

        .draft-recovery-banner span {
          display: block;
          margin-bottom: 4px;
          color: #00d7ff;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .draft-recovery-banner strong {
          display: block;
          color: #f6fff9;
          font-size: 16px;
          line-height: 1.2;
        }

        .draft-recovery-banner p {
          margin: 6px 0 0;
          color: rgba(245,247,248,0.62);
          font-size: 13px;
          line-height: 1.45;
        }

        .draft-recovery-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          align-items: center;
          gap: 9px;
        }

        .draft-recovery-actions small {
          flex-basis: 100%;
          color: rgba(157,255,196,0.76);
          font-size: 11px;
          font-weight: 850;
          text-align: right;
        }

        .draft-recovery-actions button,
        .design-reset-link {
          min-height: 38px;
          padding: 0 13px;
          border-radius: 999px;
          font: inherit;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            color 160ms ease,
            background 160ms ease;
        }

        .draft-recovery-actions button:first-of-type {
          border: 0;
          color: #06100a;
          background: linear-gradient(135deg, #18ff9a, #00c8ff);
        }

        .draft-recovery-actions button:last-of-type,
        .design-reset-link {
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(246,255,249,0.78);
          background: rgba(255,255,255,0.045);
        }

        .draft-recovery-actions button:hover,
        .design-reset-link:hover {
          transform: translateY(-1px);
          border-color: rgba(0,215,255,0.38);
          color: #9dffc4;
        }

        .design-reset-link {
          justify-self: start;
        }

        .design-draft-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .design-draft-footer span {
          color: rgba(157,255,196,0.72);
          font-size: 12px;
          font-weight: 850;
        }

        .design-path-panel .designer-prompt-row {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(150px, 188px);
          gap: 12px;
          align-items: stretch;
        }

        .design-path-panel .designer-prompt-row input {
          min-width: 0;
          min-height: 54px;
          padding: 0 16px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.045);
          color: #f5f7f8;
          font: inherit;
          outline: none;
        }

        .design-path-panel .designer-prompt-row input:focus {
          border-color: rgba(0,215,255,0.55);
          box-shadow: 0 0 0 3px rgba(0,215,255,0.10);
        }

        .design-path-panel .designer-prompt-row .lux-button {
          min-width: 0;
          border: 0;
          color: #06100a;
          background: linear-gradient(135deg, #18ff9a, #00c8ff);
          box-shadow: 0 16px 44px rgba(0,220,190,0.20);
        }

        .ai-style-selector {
          display: grid;
          gap: 10px;
          padding: 14px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.10);
          background:
            radial-gradient(circle at 8% 18%, rgba(0,255,136,0.08), transparent 32%),
            rgba(255,255,255,0.035);
        }

        .ai-style-selector span {
          display: block;
          margin-bottom: 3px;
          color: #00d7ff;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        .ai-style-selector p {
          margin: 0;
          color: rgba(245,247,248,0.60);
          font-size: 12px;
          line-height: 1.45;
        }

        .ai-style-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ai-style-chip-row button {
          min-height: 34px;
          border: 1px solid rgba(0,215,255,0.16);
          border-radius: 999px;
          color: rgba(246,255,249,0.78);
          background: rgba(255,255,255,0.045);
          padding: 0 12px;
          font: inherit;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            background 160ms ease,
            color 160ms ease;
        }

        .ai-style-chip-row button:hover,
        .ai-style-chip-row .ai-style-chip-active {
          transform: translateY(-1px);
          border-color: rgba(24,255,154,0.42);
          color: #9dffc4;
          background: rgba(24,255,154,0.09);
        }

        .ai-idea-chip-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }

        .ai-idea-chip-row::-webkit-scrollbar {
          display: none;
        }

        .ai-idea-chip-row button {
          min-height: 36px;
          flex: 0 0 auto;
          border: 1px solid rgba(0,215,255,0.16);
          border-radius: 999px;
          color: rgba(246,255,249,0.84);
          background: rgba(255,255,255,0.052);
          padding: 0 12px;
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            background 160ms ease;
        }

        .ai-idea-chip-row button:hover {
          transform: translateY(-1px);
          border-color: rgba(0,215,255,0.42);
          background: rgba(0,215,255,0.09);
        }

        .ai-concept-status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 18px;
          border: 1px solid rgba(24,255,154,0.20);
          background: rgba(24,255,154,0.075);
        }

        .ai-concept-status span {
          min-height: 28px;
          display: inline-flex;
          align-items: center;
          padding: 0 10px;
          border-radius: 999px;
          color: #071110;
          background: linear-gradient(135deg, #18ff9a, #00c8ff);
          font-size: 11px;
          font-weight: 950;
        }

        .ai-concept-status strong {
          color: #9dffc4;
          font-size: 13px;
        }

        .ai-concept-review {
          display: grid;
          gap: 18px;
          padding: 18px;
          border-radius: 28px;
          border: 1px solid rgba(0,215,255,0.18);
          background:
            radial-gradient(circle at 18% 8%, rgba(0,255,136,0.13), transparent 34%),
            radial-gradient(circle at 84% 72%, rgba(0,215,255,0.12), transparent 34%),
            linear-gradient(145deg, rgba(255,255,255,0.075), rgba(255,255,255,0.026));
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.08),
            0 24px 78px rgba(0,0,0,0.24);
        }

        .ai-concept-review-header {
          display: grid;
          gap: 6px;
        }

        .ai-concept-review-header span {
          width: fit-content;
          min-height: 28px;
          display: inline-flex;
          align-items: center;
          padding: 0 10px;
          border-radius: 999px;
          color: #071110;
          background: linear-gradient(135deg, #18ff9a, #00c8ff);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .ai-concept-review-header h3 {
          margin: 0;
          color: #f5f7f8;
          font-size: clamp(20px, 2.1vw, 26px);
          line-height: 1.12;
        }

        .ai-concept-review-header p,
        .ai-concept-note {
          margin: 0;
          color: rgba(245,247,248,0.66);
          font-size: 14px;
          line-height: 1.58;
        }

        .ai-concept-variant-toggle {
          width: fit-content;
          display: inline-flex;
          gap: 6px;
          padding: 5px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.04);
        }

        .ai-concept-variant-toggle button {
          min-height: 30px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid transparent;
          color: rgba(245,247,248,0.64);
          background: transparent;
          font: inherit;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .ai-concept-variant-toggle .ai-concept-variant-active {
          border-color: rgba(24,255,154,0.38);
          color: #9dffc4;
          background: rgba(24,255,154,0.10);
        }

        .ai-concept-brief {
          display: grid;
          grid-template-columns: minmax(0, 7fr) minmax(180px, 4fr);
          gap: 12px;
        }

        .ai-concept-brief > div,
        .ai-readiness-box {
          min-width: 0;
          padding: 14px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.040);
        }

        .ai-concept-brief span,
        .ai-readiness-box span {
          display: block;
          margin-bottom: 6px;
          color: #00d7ff;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .ai-concept-brief p {
          margin: 0;
          color: rgba(246,255,249,0.78);
          font-size: 13px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .ai-concept-style-list {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .ai-concept-style-list b {
          min-height: 28px;
          display: inline-flex;
          align-items: center;
          padding: 0 9px;
          border-radius: 999px;
          border: 1px solid rgba(24,255,154,0.20);
          color: #9dffc4;
          background: rgba(24,255,154,0.075);
          font-size: 11px;
          font-weight: 900;
        }

        .ai-readiness-box {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          background:
            radial-gradient(circle at 12% 0%, rgba(0,255,136,0.11), transparent 34%),
            rgba(255,255,255,0.040);
        }

        .ai-readiness-box div {
          min-width: 0;
        }

        .ai-readiness-box strong {
          display: block;
          color: #f6fff9;
          font-size: 22px;
          line-height: 1.1;
        }

        .ai-readiness-box p {
          margin: 0;
          color: rgba(245,247,248,0.64);
          font-size: 13px;
          line-height: 1.45;
        }

        .ai-readiness-box p:last-child {
          grid-column: 1 / -1;
          color: rgba(157,255,196,0.76);
        }

        .ai-concept-stage {
          position: relative;
          min-height: clamp(280px, 38vw, 440px);
          display: grid;
          place-items: center;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 26px;
          background:
            linear-gradient(45deg, rgba(255,255,255,0.035) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(255,255,255,0.035) 25%, transparent 25%),
            radial-gradient(circle at 50% 42%, rgba(0,215,255,0.13), transparent 34%),
            rgba(0,0,0,0.28);
          background-size: 28px 28px, 28px 28px, auto, auto;
          color: inherit;
          cursor: zoom-in;
        }

        .ai-concept-stage img {
          width: min(78%, 520px);
          max-height: 380px;
          object-fit: contain;
          display: block;
          filter:
            drop-shadow(0 24px 58px rgba(0,0,0,0.48))
            drop-shadow(0 0 22px rgba(124,240,212,0.16));
          user-select: none;
        }

        .ai-concept-stage span {
          position: absolute;
          left: 16px;
          top: 16px;
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          padding: 0 10px;
          border-radius: 999px;
          color: #9dffc4;
          background: rgba(0,0,0,0.42);
          border: 1px solid rgba(24,255,154,0.22);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .ai-concept-comparison {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .ai-concept-comparison figure {
          margin: 0;
          min-width: 0;
          display: grid;
          gap: 8px;
          padding: 10px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.10);
          background:
            linear-gradient(45deg, rgba(255,255,255,0.035) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(255,255,255,0.035) 25%, transparent 25%),
            rgba(255,255,255,0.035);
          background-size: 20px 20px, 20px 20px, auto;
        }

        .ai-concept-comparison img {
          width: 100%;
          height: 150px;
          object-fit: contain;
          display: block;
        }

        .ai-concept-comparison figcaption {
          color: rgba(246,255,249,0.70);
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .ai-cleanup-status,
        .ai-cleanup-status-success {
          margin: 0;
          color: rgba(245,247,248,0.68);
          font-size: 13px;
          line-height: 1.5;
        }

        .ai-cleanup-status-success {
          color: rgba(157,255,196,0.82);
        }

        .ai-variation-helper {
          margin: -8px 0 0;
          color: rgba(245,247,248,0.52);
          font-size: 12px;
          line-height: 1.45;
        }

        .ai-concept-action-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }

        .ai-concept-primary,
        .ai-concept-secondary,
        .ai-concept-link {
          min-height: 44px;
          border-radius: 999px;
          padding: 0 16px;
          font: inherit;
          font-weight: 900;
          cursor: pointer;
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            box-shadow 160ms ease;
        }

        .ai-concept-primary {
          border: 0;
          color: #06100a;
          background: linear-gradient(135deg, #18ff9a, #00c8ff);
          box-shadow: 0 16px 44px rgba(0,220,190,0.20);
        }

        .ai-concept-secondary {
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(246,255,249,0.88);
          background: rgba(255,255,255,0.055);
        }

        .ai-concept-link {
          border: 0;
          padding-inline: 4px;
          color: #00d7ff;
          background: transparent;
        }

        .ai-concept-primary:hover,
        .ai-concept-secondary:hover,
        .ai-concept-link:hover {
          transform: translateY(-1px);
          border-color: rgba(0,215,255,0.42);
        }

        .ai-concept-primary:disabled,
        .ai-concept-secondary:disabled {
          cursor: not-allowed;
          opacity: 0.58;
          transform: none;
        }

        .ai-output-safety-box {
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          padding: 13px 14px;
          border-radius: 20px;
          border: 1px solid rgba(255,224,131,0.18);
          background:
            radial-gradient(circle at 8% 0%, rgba(255,224,131,0.11), transparent 34%),
            rgba(255,255,255,0.035);
        }

        .ai-output-safety-box p {
          margin: 0;
          color: rgba(245,247,248,0.68);
          font-size: 12px;
          line-height: 1.45;
        }

        .ai-refinement-chip-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }

        .ai-refinement-strip {
          display: grid;
          gap: 8px;
          padding: 13px 14px;
          border-radius: 20px;
          border: 1px solid rgba(0,215,255,0.12);
          background: rgba(255,255,255,0.035);
        }

        .ai-refinement-strip > span {
          color: #00d7ff;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .ai-refinement-chip-row::-webkit-scrollbar {
          display: none;
        }

        .ai-refinement-chip-row button {
          flex: 0 0 auto;
          min-height: 32px;
          border-radius: 999px;
          border: 1px solid rgba(0,215,255,0.16);
          color: rgba(246,255,249,0.80);
          background: rgba(255,255,255,0.045);
          padding: 0 11px;
          font: inherit;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
        }

        .ai-refinement-chip-row button:hover {
          border-color: rgba(24,255,154,0.38);
          color: #9dffc4;
        }

        .ai-concept-change-box {
          display: grid;
          gap: 10px;
          padding: 14px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.045);
        }

        .ai-concept-change-box label {
          color: #f5f7f8;
          font-size: 13px;
          font-weight: 850;
        }

        .ai-concept-change-box textarea {
          width: 100%;
          min-height: 92px;
          resize: vertical;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.045);
          color: #f5f7f8;
          padding: 12px 14px;
          font: inherit;
          line-height: 1.45;
          outline: none;
        }

        .ai-concept-change-box textarea:focus {
          border-color: rgba(0,215,255,0.55);
          box-shadow: 0 0 0 3px rgba(0,215,255,0.10);
        }

        .ai-concept-history {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }

        .ai-concept-history::-webkit-scrollbar {
          display: none;
        }

        .ai-concept-history button {
          min-width: 98px;
          display: grid;
          gap: 7px;
          border: 1px solid rgba(255,255,255,0.11);
          border-radius: 18px;
          background: rgba(255,255,255,0.045);
          padding: 8px;
          color: rgba(246,255,249,0.76);
          cursor: pointer;
        }

        .ai-concept-history .ai-concept-thumb-active {
          border-color: rgba(24,255,154,0.42);
          box-shadow: 0 0 26px rgba(24,255,154,0.10);
        }

        .ai-concept-history img {
          width: 82px;
          height: 82px;
          object-fit: contain;
          border-radius: 12px;
          background: rgba(0,0,0,0.24);
        }

        .ai-concept-history span {
          font-size: 11px;
          font-weight: 850;
        }

        .ai-concept-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 120;
          display: grid;
          place-items: center;
          padding: 22px;
          background: rgba(0,0,0,0.72);
          backdrop-filter: blur(18px);
        }

        .ai-concept-modal {
          position: relative;
          width: min(920px, 100%);
          max-height: calc(100dvh - 44px);
          overflow: auto;
          display: grid;
          gap: 18px;
          padding: clamp(18px, 3vw, 28px);
          border-radius: 30px;
          border: 1px solid rgba(0,215,255,0.18);
          background:
            radial-gradient(circle at 18% 10%, rgba(0,255,136,0.13), transparent 34%),
            linear-gradient(145deg, rgba(8,12,13,0.96), rgba(2,4,5,0.98));
          box-shadow: 0 42px 130px rgba(0,0,0,0.62);
        }

        .ai-concept-modal img {
          width: 100%;
          max-height: 70dvh;
          object-fit: contain;
          display: block;
          border-radius: 22px;
          background: rgba(255,255,255,0.035);
        }

        .ai-concept-modal-close {
          position: absolute;
          right: 16px;
          top: 16px;
          width: 42px;
          height: 42px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 999px;
          color: #f6fff9;
          background: rgba(0,0,0,0.42);
          font-size: 24px;
          cursor: pointer;
        }

        .guided-placement-panel,
        .guided-shirt-color-panel {
          display: grid;
          gap: 14px;
          padding: 18px;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.10);
          background:
            radial-gradient(circle at 88% 18%, rgba(0,215,255,0.09), transparent 30%),
            rgba(255,255,255,0.035);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .quote-action-anchor,
        .guided-placement-panel,
        .showroom-viewer-anchor,
        .order-request-anchor {
          scroll-margin-top: 124px;
        }

        .pricing-trust-note {
          margin: 12px 0 0;
          color: rgba(245,247,248,0.60);
          font-size: 12px;
          line-height: 1.45;
        }

        .order-success-panel {
          display: grid;
          gap: 12px;
          margin-top: 12px;
          padding: 18px;
          border-radius: 24px;
          border: 1px solid rgba(24,255,154,0.24);
          background:
            radial-gradient(circle at 14% 8%, rgba(0,255,136,0.16), transparent 34%),
            radial-gradient(circle at 86% 82%, rgba(0,215,255,0.11), transparent 34%),
            rgba(255,255,255,0.045);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
        }

        .order-success-panel > span,
        .order-success-email {
          width: fit-content;
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          padding: 0 11px;
          border-radius: 999px;
          color: #071110;
          background: linear-gradient(135deg, #18ff9a, #00c8ff);
          font-size: 11px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .order-success-panel h3 {
          margin: 0;
          color: #f6fff9;
          font-size: 18px;
          line-height: 1.25;
        }

        .order-success-panel ol {
          margin: 0;
          padding-left: 20px;
          color: rgba(245,247,248,0.70);
          font-size: 13px;
          line-height: 1.6;
        }

        .order-success-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .order-success-actions button,
        .order-success-actions a {
          min-height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(246,255,249,0.84);
          background: rgba(255,255,255,0.05);
          font: inherit;
          font-size: 12px;
          font-weight: 900;
          text-decoration: none;
          cursor: pointer;
        }

        .guided-section-header {
          display: grid;
          gap: 5px;
        }

        .guided-section-header span {
          color: #00d7ff;
          font-size: 11px;
          font-weight: 880;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        .guided-section-header h3 {
          margin: 0;
          color: #f5f7f8;
          font-size: 19px;
          line-height: 1.18;
        }

        .guided-section-header p {
          margin: 0;
          color: rgba(245,247,248,0.62);
          font-size: 13px;
          line-height: 1.5;
        }

        .placement-mode-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .placement-mode-row button {
          min-height: 46px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 999px;
          color: rgba(246,255,249,0.82);
          background: rgba(255,255,255,0.045);
          font: inherit;
          font-weight: 850;
          cursor: pointer;
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            background 160ms ease;
        }

        .placement-mode-row button:hover,
        .placement-mode-row .placement-mode-active {
          transform: translateY(-1px);
          border-color: rgba(24,255,154,0.42);
          color: #9dffc4;
          background: rgba(24,255,154,0.10);
        }

        .logo-size-quick-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: -2px;
        }

        .logo-size-quick-row button {
          min-height: 38px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 999px;
          color: rgba(246,255,249,0.80);
          background: rgba(255,255,255,0.045);
          font: inherit;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            color 160ms ease,
            background 160ms ease;
        }

        .logo-size-quick-row button:hover,
        .logo-size-quick-row .logo-size-quick-active {
          transform: translateY(-1px);
          border-color: rgba(24,255,154,0.38);
          color: #9dffc4;
          background: rgba(24,255,154,0.10);
        }

        .showroom-viewer-anchor {
          order: 1;
          min-width: 0;
        }

        .showroom-viewer-anchor .shirt-placement-preview-card {
          min-height: 720px;
        }

        .design-next-step-row {
          margin-top: 14px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          justify-content: center;
          padding: 14px;
          border-radius: 24px;
          border: 1px solid rgba(24,255,154,0.18);
          background:
            radial-gradient(circle at 20% 18%, rgba(0,255,136,0.10), transparent 34%),
            rgba(3,8,9,0.62);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
        }

        .design-next-step-row span {
          color: rgba(246,255,249,0.72);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .design-next-step-row button {
          min-height: 36px;
          padding: 0 13px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(246,255,249,0.84);
          background: rgba(255,255,255,0.050);
          font: inherit;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            color 160ms ease,
            background 160ms ease;
        }

        .design-next-step-row button:hover {
          transform: translateY(-1px);
          border-color: rgba(24,255,154,0.38);
          color: #9dffc4;
          background: rgba(24,255,154,0.08);
        }

        .design-next-step-row small {
          flex-basis: 100%;
          color: rgba(157,255,196,0.72);
          font-size: 11px;
          font-weight: 850;
          text-align: center;
        }

        .reset-design-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 155;
          display: grid;
          place-items: center;
          padding: 22px;
          background: rgba(0,0,0,0.62);
          backdrop-filter: blur(18px);
        }

        .reset-design-modal {
          width: min(430px, calc(100vw - 32px));
          display: grid;
          gap: 14px;
          padding: 22px;
          border-radius: 28px;
          border: 1px solid rgba(24,255,154,0.24);
          background:
            radial-gradient(circle at 16% 8%, rgba(0,255,136,0.16), transparent 34%),
            radial-gradient(circle at 86% 82%, rgba(0,215,255,0.13), transparent 34%),
            rgba(5,10,11,0.96);
          box-shadow:
            0 30px 100px rgba(0,0,0,0.58),
            inset 0 1px 0 rgba(255,255,255,0.08);
        }

        .reset-design-modal > span {
          width: fit-content;
          min-height: 28px;
          display: inline-flex;
          align-items: center;
          padding: 0 10px;
          border-radius: 999px;
          color: #071110;
          background: linear-gradient(135deg, #18ff9a, #00c8ff);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .reset-design-modal h2 {
          margin: 0;
          color: #f6fff9;
          font-size: 24px;
          line-height: 1.15;
        }

        .reset-design-modal p {
          margin: 0;
          color: rgba(245,247,248,0.68);
          font-size: 14px;
          line-height: 1.6;
        }

        .reset-design-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .reset-design-actions button {
          min-height: 42px;
          padding: 0 15px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(246,255,249,0.86);
          background: rgba(255,255,255,0.055);
          font: inherit;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
        }

        .reset-design-actions button:last-child {
          border: 0;
          color: #06100a;
          background: linear-gradient(135deg, #18ff9a, #00c8ff);
          box-shadow: 0 16px 44px rgba(0,220,190,0.20);
        }

        .new-design-toast {
          position: fixed;
          left: 50%;
          bottom: max(22px, env(safe-area-inset-bottom));
          z-index: 150;
          transform: translateX(-50%);
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          padding: 0 16px;
          border-radius: 999px;
          border: 1px solid rgba(24,255,154,0.24);
          color: #9dffc4;
          background: rgba(5,10,11,0.92);
          backdrop-filter: blur(14px);
          box-shadow: 0 18px 54px rgba(0,0,0,0.34);
          font-size: 13px;
          font-weight: 900;
        }

        .design-added-toast {
          position: fixed;
          right: max(18px, env(safe-area-inset-right));
          bottom: max(18px, env(safe-area-inset-bottom));
          z-index: 140;
          width: min(420px, calc(100vw - 32px));
          display: grid;
          gap: 14px;
          padding: 18px;
          border-radius: 26px;
          border: 1px solid rgba(24,255,154,0.24);
          background:
            radial-gradient(circle at 18% 10%, rgba(0,255,136,0.16), transparent 38%),
            radial-gradient(circle at 84% 80%, rgba(0,215,255,0.14), transparent 36%),
            rgba(5,10,11,0.92);
          backdrop-filter: blur(18px);
          box-shadow:
            0 28px 90px rgba(0,0,0,0.50),
            inset 0 1px 0 rgba(255,255,255,0.08);
        }

        .design-added-toast span {
          display: block;
          margin-bottom: 5px;
          color: #00d7ff;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        .design-added-toast strong {
          display: block;
          color: #f6fff9;
          font-size: 18px;
          line-height: 1.2;
        }

        .design-added-toast p {
          margin: 8px 0 0;
          color: rgba(245,247,248,0.66);
          font-size: 13px;
          line-height: 1.5;
        }

        .design-added-toast-actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .design-added-toast-actions button {
          min-height: 40px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(246,255,249,0.84);
          background: rgba(255,255,255,0.055);
          font: inherit;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .design-added-toast-actions button:first-child {
          border: 0;
          color: #06100a;
          background: linear-gradient(135deg, #18ff9a, #00c8ff);
        }

        .design-added-toast-actions button:hover {
          filter: brightness(1.08);
        }

        .design-path-link {
          width: fit-content;
          min-height: 36px;
          padding: 0;
          border: 0;
          color: #00d7ff;
          background: transparent;
          font: inherit;
          font-size: 13px;
          font-weight: 850;
          cursor: pointer;
          text-align: left;
        }

        .design-path-link:hover {
          color: #18ff9a;
        }

        .designer-section {
          scroll-margin-top: 112px;
        }

        .showroom-section {
          background:
            radial-gradient(circle at 50% 18%, rgba(0,255,136,0.14), transparent 28%),
            radial-gradient(circle at 78% 38%, rgba(0,200,255,0.13), transparent 24%),
            linear-gradient(180deg, rgba(1,4,5,0.24), rgba(0,0,0,0.22));
        }

        .showroom-grid .shirt-placement-preview-card {
          order: 1;
          min-height: 720px;
        }

        .showroom-controls-card {
          order: 2;
          max-width: 1160px;
          width: 100%;
          margin: -28px auto 0;
          z-index: 4;
        }

        .showroom-controls-card .designer-stat-grid {
          display: none !important;
        }

        .showroom-control-stack {
          grid-template-columns: minmax(0, 1fr);
          align-items: start;
        }

        .showroom-control-stack > label,
        .showroom-control-stack > .placement-mobile-select,
        .showroom-control-stack > div,
        .showroom-control-stack > button,
        .showroom-control-stack > form {
          min-width: 0;
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

        .placement-mobile-select {
          display: none;
        }

        .placement-chip-grid small {
          color: rgba(245,247,248,0.52);
          font-size: 11px;
          font-weight: 760;
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

        .studio-tools-section::before {
          content: "";
          position: absolute;
          inset: 56px max(18px, calc((100vw - 1240px) / 2)) 48px;
          pointer-events: none;
          border-radius: 42px;
          background:
            radial-gradient(circle at 18% 18%, rgba(0,255,136,0.13), transparent 34%),
            radial-gradient(circle at 82% 30%, rgba(0,215,255,0.12), transparent 35%),
            linear-gradient(135deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012));
          border: 1px solid rgba(255,255,255,0.065);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 42px 130px rgba(0,0,0,0.26);
        }

        .tool-card-grid .tool-card {
          position: relative;
        }

        .tool-card-grid .tool-card:nth-child(even) {
          transform: translateY(28px);
        }

        .tool-card-grid .tool-card::after {
          content: "";
          position: absolute;
          left: 30px;
          right: 30px;
          top: 26px;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--card-glow), transparent);
          opacity: 0.9;
        }

        @keyframes homepageVisualFloat {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -5px, 0); }
        }

        @keyframes homepageVisualShimmer {
          0% { transform: translateX(-38%) rotate(-8deg); opacity: 0; }
          42% { opacity: 0.52; }
          100% { transform: translateX(38%) rotate(-8deg); opacity: 0; }
        }

        .homepage-card-visual {
          position: relative;
          overflow: hidden;
          color: var(--visual-main);
          contain: paint;
          animation: homepageVisualFloat 6.4s ease-in-out infinite;
        }

        .homepage-card-visual::before {
          content: "";
          position: absolute;
          inset: -28px;
          pointer-events: none;
          background:
            radial-gradient(circle at 34% 22%, var(--visual-glow), transparent 42%),
            radial-gradient(circle at 82% 78%, rgba(0,215,255,0.18), transparent 42%);
          filter: blur(18px);
          opacity: 0.56;
        }

        .homepage-card-visual::after {
          content: "";
          position: absolute;
          top: -24%;
          bottom: -24%;
          left: 22%;
          width: 32px;
          pointer-events: none;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.24), transparent);
          animation: homepageVisualShimmer 7.2s ease-in-out infinite;
        }

        .homepage-card-visual svg {
          position: relative;
          z-index: 1;
        }

        @media (prefers-reduced-motion: reduce) {
          .homepage-card-visual,
          .homepage-card-visual::after,
          .mobile-launch-logo > span {
            animation: none !important;
          }
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
          --card-glow: rgba(124,240,212,0.14);
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
          gap: clamp(18px, 2.4vw, 34px);
        }

        .header-brand {
          flex: 0 0 auto;
          min-width: 0;
        }

        .desktop-nav-links {
          flex: 1 1 auto;
          justify-content: center;
          min-width: 0;
          white-space: nowrap;
        }

        .desktop-nav-link {
          flex: 0 0 auto;
          white-space: nowrap;
          line-height: 1;
        }

        .header-actions {
          flex: 0 0 auto;
          justify-content: flex-end;
          min-width: 0;
        }

        .desktop-language-switcher,
        .desktop-start-link {
          flex: 0 0 auto;
        }

        .desktop-start-link {
          white-space: nowrap;
        }

        .mobile-app-launch,
        .mobile-explore-hub,
        .mobile-design-wizard,
        .mobile-wizard-status {
          display: none;
        }

        .mobile-menu-panel,
        .mobile-menu-button,
        .mobile-start-link {
          display: none !important;
        }

        .home-entry-design .desktop-home-section,
        .home-entry-design .mobile-app-launch,
        .home-entry-design .mobile-explore-hub {
          display: none !important;
        }

        .home-entry-design .designer-section {
          padding-top: calc(118px + env(safe-area-inset-top)) !important;
        }

        .mobile-menu-backdrop,
        .mobile-language-backdrop {
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
          background:
            radial-gradient(circle at 50% 100%, rgba(0, 255, 180, 0.13), transparent 42%),
            rgba(0, 0, 0, 0.58);
          backdrop-filter: blur(10px);
        }

        .mobile-language-backdrop {
          z-index: 300;
        }

        .mobile-menu-sheet,
        .mobile-language-sheet {
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
          border: 1px solid rgba(140, 255, 220, 0.18);
          border-radius: 30px 30px 24px 24px;
          background:
            radial-gradient(circle at 16% 0%, rgba(0,255,136,0.16), transparent 34%),
            radial-gradient(circle at 92% 14%, rgba(0,200,255,0.14), transparent 34%),
            rgba(4, 10, 11, 0.96);
          box-shadow:
            0 34px 100px rgba(0,0,0,0.58),
            inset 0 1px 0 rgba(255,255,255,0.08);
          backdrop-filter: blur(22px);
          transform: translateX(-50%);
        }

        .mobile-menu-sheet *,
        .mobile-language-sheet * {
          box-sizing: border-box;
        }

        .mobile-menu-heading,
        .mobile-language-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          padding: 20px 20px 14px;
        }

        .mobile-menu-heading p,
        .mobile-language-heading p {
          margin: 0 0 4px;
          color: #18ff9a;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .mobile-menu-heading h2,
        .mobile-language-heading h2 {
          margin: 0;
          color: #f7fff9;
          font-size: 22px;
          letter-spacing: 0;
        }

        .mobile-menu-close {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 999px;
          color: #f7fff9;
          background: rgba(255,255,255,0.06);
          font: inherit;
          font-size: 20px;
          cursor: pointer;
        }

        .mobile-menu-panel {
          position: static;
          padding: 12px;
          border-top: 1px solid rgba(255,255,255,0.08);
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .mobile-menu-panel a {
          min-height: 50px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          border-radius: 16px;
          color: rgba(246,255,249,0.84);
          text-decoration: none;
          font-size: 15px;
          font-weight: 850;
        }

        .mobile-menu-panel a:hover {
          background: rgba(255,255,255,0.06);
          color: #9dffc4;
        }

        .mobile-language-card {
          margin: 12px;
          padding: 12px;
          min-height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          background: rgba(255,255,255,0.045);
        }

        .mobile-language-card p {
          margin: 0 0 4px;
          color: rgba(246,255,249,0.52);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .mobile-language-card span {
          color: #f7fff9;
          font-size: 15px;
          font-weight: 850;
        }

        .mobile-language-card button {
          min-width: 58px;
          min-height: 40px;
          border: 1px solid rgba(0,255,170,0.24);
          border-radius: 999px;
          color: #9dffc4;
          background:
            linear-gradient(135deg, rgba(0,255,136,0.16), rgba(0,200,255,0.10));
          font: inherit;
          font-size: 13px;
          font-weight: 950;
          cursor: pointer;
        }

        .mobile-menu-primary {
          min-height: 50px;
          margin: 0 12px 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          color: #06100a;
          text-decoration: none;
          font-size: 15px;
          font-weight: 950;
          background: linear-gradient(135deg,#00ff88,#00c8ff);
          box-shadow: 0 16px 46px rgba(0,200,255,0.18);
        }

        .mobile-language-options {
          display: grid;
          gap: 8px;
          padding: 0 14px 16px;
        }

        .mobile-language-options button {
          min-height: 54px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 18px;
          padding: 0 14px;
          color: rgba(246,255,249,0.84);
          background: rgba(255,255,255,0.045);
          font: inherit;
          cursor: pointer;
        }

        .mobile-language-options button span {
          font-weight: 850;
        }

        .mobile-language-options button strong {
          color: rgba(246,255,249,0.58);
          font-size: 13px;
          letter-spacing: 0.08em;
        }

        .mobile-language-options .mobile-language-active {
          border-color: rgba(0,255,170,0.34);
          background:
            linear-gradient(135deg, rgba(0,255,136,0.16), rgba(0,200,255,0.10));
          color: #f7fff9;
        }

        .mobile-language-options .mobile-language-active strong {
          color: #9dffc4;
        }

        .home-shell[dir="rtl"] .mobile-app-launch,
        .home-shell[dir="rtl"] .mobile-explore-hub,
        .home-shell[dir="rtl"] .mobile-design-wizard,
        .home-shell[dir="rtl"] .mobile-menu-sheet,
        .home-shell[dir="rtl"] .mobile-language-sheet {
          direction: rtl;
          text-align: right;
        }

        .home-shell[dir="rtl"] .mobile-menu-panel a,
        .home-shell[dir="rtl"] .mobile-language-options button,
        .home-shell[dir="rtl"] .mobile-language-card,
        .home-shell[dir="rtl"] .mobile-design-inline-actions,
        .home-shell[dir="rtl"] .mobile-shirt-color-row,
        .home-shell[dir="rtl"] .placement-mode-row {
          direction: rtl;
        }

        .home-shell[dir="rtl"] .mobile-explore-grid ul {
          padding-left: 0;
          padding-right: 18px;
        }

        .pricing-confidence-panel {
          overflow: hidden;
          position: relative;
        }

        .pricing-confidence-panel::before {
          content: "";
          position: absolute;
          inset: -1px;
          background:
            radial-gradient(circle at 14% 2%, rgba(0,255,136,0.14), transparent 34%),
            radial-gradient(circle at 85% 8%, rgba(0,215,255,0.12), transparent 32%);
          pointer-events: none;
        }

        .pricing-confidence-panel > * {
          position: relative;
          z-index: 1;
        }

        .pricing-confidence-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 18px;
        }

        .pricing-confidence-header span,
        .pricing-card-copy span,
        .pricing-receipt-head span,
        .pricing-review-card span {
          color: rgba(245,247,248,0.58);
          font-size: 12px;
          font-weight: 850;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .pricing-confidence-header strong {
          display: block;
          max-width: 680px;
          margin-top: 7px;
          color: #f5f7f8;
          font-size: clamp(20px, 2.5vw, 30px);
          line-height: 1.18;
        }

        .pricing-euro-orbit {
          width: 64px;
          height: 64px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border: 1px solid rgba(0,255,190,0.32);
          border-radius: 22px;
          color: #06100d;
          background: linear-gradient(135deg, #00ff88, #00d7ff);
          box-shadow: 0 0 54px rgba(0,215,255,0.22);
          font-size: 28px;
          font-weight: 950;
        }

        .pricing-factor-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 24px;
        }

        .pricing-factor-row span {
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 999px;
          color: rgba(245,247,248,0.74);
          background: rgba(255,255,255,0.04);
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 750;
        }

        .pricing-card-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          align-items: stretch;
        }

        .pricing-card {
          min-height: 350px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding: 22px;
          border: 1px solid var(--pricing-border);
          border-radius: 28px;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.08),
            0 20px 70px rgba(0,0,0,0.24);
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease;
        }

        .pricing-card:hover {
          transform: translateY(-5px);
          border-color: var(--pricing-main);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.10),
            0 24px 78px rgba(0,0,0,0.34),
            0 0 48px var(--pricing-glow);
        }

        .pricing-card-recommended {
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.10),
            0 28px 90px rgba(0,0,0,0.26),
            0 0 42px rgba(0,255,136,0.12);
        }

        .pricing-visual-shell {
          min-height: 132px;
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 24px;
          background:
            linear-gradient(135deg, var(--pricing-soft), rgba(255,255,255,0.025));
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.08),
            0 18px 50px rgba(0,0,0,0.22);
          overflow: hidden;
        }

        .pricing-visual-shell svg {
          display: block;
          width: 100%;
          height: 132px;
        }

        .pricing-card-copy {
          display: grid;
          gap: 12px;
        }

        .pricing-card-copy strong {
          color: var(--pricing-main);
          font-size: clamp(26px, 3vw, 36px);
          line-height: 1;
        }

        .pricing-card-copy p {
          margin: 0;
          color: rgba(245,247,248,0.66);
          font-size: 14.5px;
          line-height: 1.65;
        }

        .pricing-receipt-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(280px, 0.92fr);
          gap: 16px;
          margin-top: 18px;
        }

        .pricing-receipt-card,
        .pricing-review-card {
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 26px;
          background: rgba(255,255,255,0.045);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.07);
        }

        .pricing-receipt-card {
          padding: 20px;
        }

        .pricing-receipt-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          padding-bottom: 15px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .pricing-receipt-head strong {
          color: #06100d;
          background: linear-gradient(135deg, #00ff88, #00d7ff);
          border-radius: 999px;
          padding: 10px 14px;
          font-size: 18px;
          box-shadow: 0 0 34px rgba(0,215,255,0.20);
        }

        .pricing-receipt-lines {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          padding-top: 14px;
        }

        .pricing-receipt-lines div {
          min-width: 0;
          border-radius: 18px;
          background: rgba(0,0,0,0.20);
          padding: 12px;
        }

        .pricing-receipt-lines span {
          display: block;
          margin-bottom: 6px;
          color: rgba(245,247,248,0.48);
          font-size: 12px;
        }

        .pricing-receipt-lines strong {
          color: #f5f7f8;
          font-size: 15px;
          line-height: 1.2;
        }

        .pricing-review-card {
          position: relative;
          overflow: hidden;
          padding: 22px;
          background:
            radial-gradient(circle at 92% 0%, rgba(0,215,255,0.15), transparent 36%),
            radial-gradient(circle at 8% 100%, rgba(0,255,136,0.08), transparent 34%),
            rgba(255,255,255,0.045);
        }

        .pricing-review-card strong {
          display: block;
          margin-top: 8px;
          color: #f5f7f8;
          font-size: 22px;
          line-height: 1.2;
        }

        .pricing-review-card p {
          max-width: 420px;
          margin: 10px 0 0;
          color: rgba(245,247,248,0.66);
          font-size: 14.5px;
          line-height: 1.65;
        }

        .pricing-stitch-bars {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          height: 46px;
          margin-top: 16px;
        }

        .pricing-stitch-bars i {
          width: 34px;
          border-radius: 999px 999px 8px 8px;
          background: linear-gradient(180deg, rgba(0,255,136,0.78), rgba(0,215,255,0.50));
          box-shadow: 0 0 24px rgba(0,215,255,0.16);
        }

        .pricing-stitch-bars i:nth-child(1) { height: 18px; }
        .pricing-stitch-bars i:nth-child(2) { height: 30px; }
        .pricing-stitch-bars i:nth-child(3) { height: 40px; }
        .pricing-stitch-bars i:nth-child(4) { height: 25px; }

        .pricing-cta-row {
          display: grid;
          gap: 12px;
          margin-top: 18px;
        }

        .pricing-cta-row p {
          margin: 0;
          color: rgba(245,247,248,0.62);
          font-size: 14px;
          line-height: 1.5;
          text-align: center;
        }

        .pricing-cta-button {
          position: relative;
          overflow: hidden;
        }

        .pricing-cta-button::after {
          content: "";
          position: absolute;
          inset: -40% auto -40% -25%;
          width: 32%;
          transform: rotate(18deg);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.36), transparent);
          animation: pricingCtaShimmer 4.2s ease-in-out infinite;
        }

        @keyframes pricingCtaShimmer {
          0%, 58% { transform: translateX(0) rotate(18deg); opacity: 0; }
          68% { opacity: 0.65; }
          100% { transform: translateX(420%) rotate(18deg); opacity: 0; }
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
            linear-gradient(145deg, rgba(8,18,17,0.72), rgba(3,6,7,0.88));
          box-shadow:
            0 44px 130px rgba(0,0,0,0.46),
            inset 0 1px 0 rgba(255,255,255,0.10);
        }

        @media (max-width: 1023px) {
          .desktop-nav-links {
            display: none !important;
          }

          .desktop-language-switcher {
            display: none !important;
          }

          .desktop-start-link {
            display: none !important;
          }

          .mobile-start-link {
            display: inline-flex !important;
          }

          .mobile-menu-button {
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
          }

          .mobile-menu-panel {
            display: grid;
            gap: 4px;
          }

          .site-nav {
            height: 74px !important;
            padding: 0 16px !important;
          }

          .header-logo .stitchra-logo-copy {
            display: none !important;
          }

          .header-logo {
            gap: 0 !important;
          }

          .header-logo > span:first-child {
            width: 46px !important;
            height: 46px !important;
            border-radius: 16px !important;
          }

          .header-logo svg {
            width: 46px !important;
            height: 46px !important;
          }

          .header-actions {
            gap: 8px !important;
            min-width: 0;
          }

          .header-actions .lux-button {
            min-height: 44px !important;
            padding: 0 14px !important;
            border-radius: 14px !important;
            font-size: 13px !important;
            white-space: nowrap;
          }

          .header-brand {
            gap: 10px !important;
            flex-shrink: 0;
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

          .tool-card-grid .tool-card:nth-child(even) {
            transform: none;
          }
        }

        @media (max-width: 768px) {
          .desktop-home-section {
            display: block;
          }

          .mobile-app-launch,
          .mobile-explore-hub {
            display: none !important;
          }

          .home-entry-home .mobile-explore-hub,
          .home-entry-home .designer-section {
            display: none !important;
          }

          .home-entry-design .mobile-design-wizard {
            display: block !important;
          }

          .home-entry-design .designer-section {
            display: none !important;
          }

          .site-header {
            background:
              linear-gradient(180deg, rgba(0,8,7,0.96), rgba(0,5,5,0.86)) !important;
            border-bottom-color: rgba(185,255,222,0.16) !important;
            box-shadow:
              0 18px 58px rgba(0,0,0,0.54),
              inset 0 1px 0 rgba(255,255,255,0.05) !important;
          }

          .site-nav {
            gap: 10px !important;
          }

          .header-actions {
            flex: 1 1 auto;
            justify-content: flex-end;
            overflow: hidden;
          }

          .mobile-start-link {
            max-width: min(42vw, 156px);
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .mobile-menu-button {
            flex: 0 0 auto;
            white-space: nowrap;
          }

          .home-entry-home .desktop-hero-section {
            min-height: auto !important;
            padding: calc(108px + env(safe-area-inset-top)) 16px 76px !important;
          }

          .home-entry-home .hero-atelier {
            grid-template-columns: minmax(0, 1fr);
            max-width: 600px;
            gap: 20px;
          }

          .home-entry-home .hero-copy-panel {
            padding: 24px 20px;
            border-radius: 28px;
          }

          .home-entry-home .hero-preview-card {
            height: auto;
            border-radius: 28px;
          }

          .home-entry-home .hero-actions {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .home-entry-home .hero-actions .lux-button {
            width: 100%;
          }

          .home-entry-home .hero-proof-strip,
          .home-entry-home .hero-spec-grid {
            grid-template-columns: 1fr;
          }

          .home-entry-home #how,
          .home-entry-home #features,
          .home-entry-home #craft,
          .home-entry-home #gallery,
          .home-entry-home #pricing,
          .home-entry-home #faq,
          .home-entry-home .final-cta-section {
            padding: 88px 18px 76px !important;
          }

          .home-entry-home .pricing-confidence-panel {
            margin-top: 32px !important;
          }

          .mobile-design-wizard {
            min-height: 100svh;
            padding: calc(92px + env(safe-area-inset-top)) 12px calc(118px + env(safe-area-inset-bottom));
            position: relative;
            z-index: 1;
          }

          .mobile-design-wizard-shell {
            max-width: 520px;
            margin: 0 auto;
            display: grid;
            gap: 12px;
          }

          .mobile-design-wizard-head {
            display: grid;
            gap: 6px;
            padding: 18px;
            border: 1px solid rgba(140,255,220,0.16);
            border-radius: 24px;
            background:
              radial-gradient(circle at 12% 0%, rgba(0,255,136,0.12), transparent 34%),
              rgba(255,255,255,0.045);
          }

          .mobile-design-wizard-head span,
          .mobile-price-card span,
          .mobile-upload-review-card span,
          .mobile-request-summary span {
            color: #18ff9a;
            font-size: 11px;
            font-weight: 950;
            letter-spacing: 0.14em;
            text-transform: uppercase;
          }

          .mobile-design-wizard-head h1,
          .mobile-price-card h2,
          .mobile-upload-review-card h2,
          .mobile-empty-design-card h2 {
            margin: 0;
            color: #f7fff9;
            font-size: 28px;
            line-height: 1.05;
            letter-spacing: 0;
          }

          .mobile-design-wizard-head p,
          .mobile-price-card p,
          .mobile-upload-review-card p,
          .mobile-empty-design-card p,
          .mobile-request-summary p {
            margin: 0;
            color: rgba(246,255,249,0.66);
            font-size: 14.5px;
            line-height: 1.5;
          }

          .mobile-design-stepper {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            padding: 2px 2px 8px;
            scrollbar-width: none;
          }

          .mobile-design-stepper::-webkit-scrollbar {
            display: none;
          }

          .mobile-design-step-chip {
            min-height: 38px;
            flex: 0 0 auto;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 999px;
            color: rgba(246,255,249,0.58);
            background: rgba(255,255,255,0.045);
            padding: 0 12px 0 8px;
            font: inherit;
            font-size: 12px;
            font-weight: 900;
          }

          .mobile-design-step-chip span {
            width: 24px;
            height: 24px;
            display: grid;
            place-items: center;
            border-radius: 999px;
            color: #06100a;
            background: rgba(246,255,249,0.48);
            font-size: 11px;
          }

          .mobile-design-step-chip:disabled {
            opacity: 0.52;
          }

          .mobile-design-step-active,
          .mobile-design-step-complete {
            border-color: rgba(0,255,170,0.30);
            color: #f7fff9;
            background: linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,200,255,0.09));
          }

          .mobile-design-step-active span,
          .mobile-design-step-complete span {
            background: linear-gradient(135deg, #00ff88, #00c8ff);
          }

          .mobile-design-step-panel,
          .mobile-design-create-stack,
          .mobile-design-review-stack,
          .mobile-design-place-stack,
          .mobile-price-step,
          .mobile-request-step {
            display: grid;
            gap: 12px;
            min-width: 0;
          }

          .mobile-design-step-panel .design-start-panel,
          .mobile-design-step-panel .design-path-panel,
          .mobile-design-step-panel .ai-concept-review {
            border-radius: 26px;
          }

          .mobile-design-inline-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .mobile-design-primary-action,
          .mobile-design-secondary-action {
            min-height: 52px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 18px;
            padding: 0 14px;
            font: inherit;
            font-size: 14px;
            font-weight: 950;
            text-decoration: none;
          }

          .mobile-design-primary-action {
            border: 0;
            color: #06100a;
            background: linear-gradient(135deg, #00ff88, #00c8ff);
            box-shadow: 0 18px 48px rgba(0,200,255,0.20);
          }

          .mobile-design-secondary-action {
            border: 1px solid rgba(255,255,255,0.14);
            color: #f7fff9;
            background: rgba(255,255,255,0.055);
          }

          .mobile-design-primary-action:disabled,
          .mobile-design-secondary-action:disabled {
            cursor: not-allowed;
            opacity: 0.5;
          }

          .mobile-design-sticky-actions {
            position: sticky;
            bottom: max(10px, env(safe-area-inset-bottom));
            z-index: 24;
            padding: 8px;
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 22px;
            background: rgba(4,10,11,0.86);
            backdrop-filter: blur(14px);
          }

          .mobile-design-status,
          .mobile-design-error,
          .mobile-design-warning {
            margin: 0;
            border-radius: 16px;
            padding: 12px;
            font-size: 13px;
            line-height: 1.45;
          }

          .mobile-design-status {
            color: #9dffc4;
            background: rgba(0,255,136,0.07);
          }

          .mobile-design-error {
            color: #ffb4b4;
            background: rgba(255,80,80,0.08);
          }

          .mobile-design-warning {
            color: #ffe083;
            background: rgba(255,224,131,0.08);
          }

          .mobile-upload-review-card,
          .mobile-empty-design-card,
          .mobile-placement-card,
          .mobile-price-card,
          .mobile-request-summary,
          .mobile-request-form {
            display: grid;
            gap: 12px;
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 24px;
            background: rgba(255,255,255,0.045);
            padding: 16px;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
          }

          .mobile-upload-review-stage {
            min-height: 260px;
            display: grid;
            place-items: center;
            border: 1px solid rgba(140,255,220,0.14);
            border-radius: 22px;
            background:
              linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25% 50%, rgba(255,255,255,0.04) 50% 75%, transparent 75%),
              rgba(0,0,0,0.22);
            background-size: 22px 22px;
            padding: 18px;
          }

          .mobile-upload-review-stage img {
            max-width: min(100%, 280px);
            max-height: 240px;
            object-fit: contain;
            filter: drop-shadow(0 16px 32px rgba(0,0,0,0.34));
          }

          .mobile-design-viewer-card {
            min-width: 0;
          }

          .mobile-design-viewer-card .shirt-placement-viewer {
            min-height: min(620px, calc(100svh - 170px));
          }

          .mobile-shirt-color-row {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .mobile-shirt-color-row button {
            min-height: 52px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 9px;
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 16px;
            color: #f7fff9;
            background: rgba(255,255,255,0.045);
            font: inherit;
            font-size: 14px;
            font-weight: 900;
          }

          .mobile-shirt-color-row span {
            width: 18px;
            height: 18px;
            border-radius: 999px;
          }

          .mobile-shirt-color-row span[data-color="black"] {
            background: #050607;
            border: 1px solid rgba(255,255,255,0.22);
          }

          .mobile-shirt-color-row span[data-color="white"] {
            background: #f5f1e8;
            border: 1px solid rgba(0,0,0,0.18);
          }

          .mobile-shirt-color-active {
            border-color: rgba(0,255,136,0.70) !important;
            background: rgba(0,255,136,0.10) !important;
          }

          .mobile-price-metrics {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .mobile-price-card strong,
          .mobile-request-summary strong {
            color: #f7fff9;
            font-size: 20px;
          }

          .mobile-price-card small {
            color: rgba(157,255,196,0.74);
            line-height: 1.45;
          }

          .mobile-request-form {
            gap: 10px;
          }

          .mobile-request-success {
            margin-top: 0;
          }

          .mobile-app-launch {
            min-height: 100svh;
            padding: calc(88px + env(safe-area-inset-top)) 14px 28px;
            position: relative;
            z-index: 1;
          }

          .mobile-launch-card {
            position: relative;
            isolation: isolate;
            overflow: hidden;
            min-height: min(680px, calc(100svh - 116px));
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            align-items: flex-start;
            gap: 16px;
            padding: 26px 22px 24px;
            border: 1px solid rgba(140,255,220,0.24);
            border-radius: 32px;
            background: rgba(5, 10, 11, 0.9);
            box-shadow:
              0 32px 92px rgba(0,0,0,0.42),
              0 0 54px rgba(0,255,136,0.10),
              inset 0 1px 0 rgba(255,255,255,0.08);
            backdrop-filter: blur(10px);
          }

          .mobile-launch-bg-image {
            position: absolute;
            inset: 0;
            z-index: 0;
            object-fit: cover;
            object-position: center;
            opacity: 0.44;
            transform: scale(1.015);
          }

          .mobile-launch-card::after {
            content: "";
            position: absolute;
            inset: 0;
            z-index: 1;
            background:
              linear-gradient(180deg, rgba(1, 6, 6, 0.18) 0%, rgba(2, 9, 9, 0.48) 34%, rgba(1, 7, 8, 0.93) 100%),
              radial-gradient(circle at 24% 16%, rgba(0,255,136,0.16), transparent 34%),
              radial-gradient(circle at 96% 20%, rgba(0,200,255,0.1), transparent 34%),
              linear-gradient(135deg, rgba(0, 16, 12, 0.44), rgba(2, 10, 12, 0.8));
          }

          .mobile-launch-card > :not(.mobile-launch-bg-image) {
            position: relative;
            z-index: 2;
          }

          .mobile-launch-brand {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 2px;
          }

          .mobile-launch-brand > span {
            color: #f7fff9;
            font-size: 20px;
            font-weight: 950;
            letter-spacing: 0;
            text-shadow: 0 2px 22px rgba(0,0,0,0.52);
          }

          .mobile-launch-logo {
            position: relative;
            width: 66px;
            height: 66px;
            display: grid;
            place-items: center;
          }

          .mobile-launch-logo > span {
            position: absolute;
            left: 14px;
            right: 8px;
            bottom: 4px;
            height: 2px;
            border-radius: 999px;
            background: linear-gradient(90deg, transparent, #18ff9a, #00c8ff);
            transform-origin: left center;
            animation: mobileThreadDraw 900ms ease-out 1 both;
          }

          .mobile-launch-shirt-proof {
            position: absolute;
            top: 96px;
            inset-inline-end: 16px;
            width: 154px;
            display: grid;
            gap: 8px;
            padding: 10px;
            border: 1px solid rgba(170,255,222,0.22);
            border-radius: 24px;
            background:
              linear-gradient(180deg, rgba(10, 24, 22, 0.72), rgba(3, 8, 9, 0.86)),
              rgba(255,255,255,0.05);
            box-shadow:
              0 18px 46px rgba(0,0,0,0.38),
              0 0 22px rgba(0,255,136,0.12),
              inset 0 1px 0 rgba(255,255,255,0.09);
          }

          .mobile-launch-shirt-stage {
            position: relative;
            min-height: 118px;
            display: grid;
            place-items: center;
            overflow: hidden;
            border-radius: 18px;
            background:
              radial-gradient(circle at 50% 18%, rgba(0,255,136,0.2), transparent 44%),
              linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
          }

          .mobile-launch-shirt-stage::after {
            content: "";
            position: absolute;
            inset: auto 16px 12px;
            height: 10px;
            border-radius: 999px;
            background: rgba(0,0,0,0.38);
            filter: blur(6px);
          }

          .mobile-launch-shirt-image {
            width: 106px;
            height: auto;
            object-fit: contain;
            filter: drop-shadow(0 14px 18px rgba(0,0,0,0.34));
          }

          .mobile-launch-shirt-mark {
            position: absolute;
            top: 42px;
            left: 50%;
            width: 38px;
            height: 38px;
            display: grid;
            place-items: center;
            transform: translateX(-50%);
            border-radius: 999px;
            background: rgba(2, 10, 8, 0.72);
            box-shadow:
              0 0 0 1px rgba(24,255,154,0.26),
              0 0 18px rgba(0,255,136,0.18);
          }

          .mobile-launch-shirt-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
          }

          .mobile-launch-shirt-meta span,
          .mobile-launch-shirt-meta strong {
            white-space: nowrap;
            letter-spacing: 0;
          }

          .mobile-launch-shirt-meta span {
            min-width: 0;
            overflow: hidden;
            color: rgba(246,255,249,0.78);
            font-size: 11px;
            font-weight: 850;
            text-overflow: ellipsis;
          }

          .mobile-launch-shirt-meta strong {
            flex: 0 0 auto;
            display: inline-flex;
            align-items: center;
            min-height: 24px;
            padding: 3px 8px;
            border-radius: 999px;
            color: #06100a;
            background: linear-gradient(135deg, #00ff88, #00c8ff);
            font-size: 11px;
            font-weight: 950;
            line-height: 1;
            text-shadow: none;
          }

          .mobile-launch-eyebrow,
          .mobile-explore-heading span {
            margin: 0;
            color: #18ff9a;
            font-size: 12px;
            font-weight: 950;
            letter-spacing: 0.15em;
            text-transform: uppercase;
          }

          .mobile-launch-card h1 {
            margin: 0;
            color: #f7fff9;
            max-width: 350px;
            font-size: clamp(34px, 9.8vw, 47px);
            line-height: 1.02;
            letter-spacing: 0;
            text-wrap: balance;
            text-shadow: 0 4px 30px rgba(0,0,0,0.54);
          }

          .mobile-launch-card strong {
            max-width: 360px;
            color: rgba(246,255,249,0.82);
            font-size: 16px;
            line-height: 1.5;
            font-weight: 650;
            text-shadow: 0 1px 18px rgba(0,0,0,0.45);
          }

          .mobile-launch-actions {
            width: 100%;
            display: grid;
            gap: 12px;
            margin-top: 8px;
          }

          .mobile-launch-proof-line {
            min-height: 28px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: rgba(203,255,224,0.82);
            font-size: 12px;
            font-weight: 850;
            letter-spacing: 0.01em;
          }

          .mobile-launch-proof-line span {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: linear-gradient(135deg, #00ff88, #00c8ff);
            box-shadow: 0 0 18px rgba(0,255,136,0.36);
          }

          .mobile-launch-trust {
            width: 100%;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 4px;
          }

          .mobile-launch-trust span {
            min-height: 32px;
            display: inline-flex;
            align-items: center;
            border: 1px solid rgba(170,255,222,0.16);
            border-radius: 999px;
            color: rgba(246,255,249,0.78);
            background: rgba(4, 14, 13, 0.52);
            padding: 6px 10px;
            font-size: 12px;
            font-weight: 850;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
          }

          .mobile-draft-soft-card {
            width: 100%;
            display: grid;
            gap: 12px;
            margin-top: 2px;
            padding: 14px;
            border: 1px solid rgba(140,255,220,0.14);
            border-radius: 22px;
            background: rgba(255,255,255,0.05);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
          }

          .mobile-draft-soft-card span {
            display: block;
            margin-bottom: 4px;
            color: #18ff9a;
            font-size: 11px;
            font-weight: 950;
            letter-spacing: 0.14em;
            text-transform: uppercase;
          }

          .mobile-draft-soft-card strong {
            display: block;
            color: #f7fff9;
            font-size: 16px;
          }

          .mobile-draft-soft-card p {
            margin: 4px 0 0;
            color: rgba(246,255,249,0.62);
            font-size: 13px;
            line-height: 1.4;
            letter-spacing: 0;
            text-transform: none;
          }

          .mobile-draft-soft-card div:last-child {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .mobile-draft-soft-card a,
          .mobile-draft-soft-card button {
            min-height: 42px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 14px;
            font: inherit;
            font-size: 13px;
            font-weight: 950;
            text-decoration: none;
          }

          .mobile-draft-soft-card a {
            color: #06100a;
            background: linear-gradient(135deg, #00ff88, #00c8ff);
          }

          .mobile-draft-soft-card button {
            border: 1px solid rgba(255,255,255,0.14);
            color: #f7fff9;
            background: rgba(255,255,255,0.055);
          }

          .mobile-launch-primary,
          .mobile-launch-secondary,
          .mobile-explore-cta {
            min-height: 56px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 18px;
            text-decoration: none;
            font-size: 15px;
            font-weight: 950;
          }

          .mobile-launch-primary,
          .mobile-explore-cta {
            color: #06100a;
            background: linear-gradient(135deg, #00ff88, #00c8ff);
            box-shadow:
              0 18px 48px rgba(0,200,255,0.24),
              0 0 24px rgba(0,255,136,0.12);
          }

          .mobile-launch-secondary {
            min-height: 50px;
            color: rgba(246,255,249,0.88);
            border: 1px solid rgba(255,255,255,0.13);
            background: rgba(255,255,255,0.05);
          }

          @media (max-width: 380px), (max-height: 730px) {
            .mobile-launch-card {
              gap: 13px;
              padding: 22px 18px 20px;
            }

            .mobile-launch-shirt-proof {
              position: relative;
              top: auto;
              inset-inline-end: auto;
              width: min(100%, 218px);
              align-self: flex-end;
              grid-template-columns: 78px minmax(0, 1fr);
              align-items: center;
              gap: 10px;
              padding: 9px;
            }

            .mobile-launch-shirt-stage {
              min-height: 78px;
            }

            .mobile-launch-shirt-image {
              width: 70px;
            }

            .mobile-launch-shirt-mark {
              top: 26px;
              width: 28px;
              height: 28px;
            }

            .mobile-launch-shirt-meta {
              display: grid;
              justify-items: start;
              gap: 6px;
            }

            .mobile-launch-card h1 {
              font-size: clamp(31px, 9vw, 40px);
            }

            .mobile-launch-card strong {
              font-size: 15px;
              line-height: 1.42;
            }
          }

          .mobile-explore-hub {
            padding: 28px 16px 38px;
            scroll-margin-top: 92px;
            position: relative;
            z-index: 1;
          }

          .mobile-explore-heading {
            display: grid;
            gap: 10px;
            margin-bottom: 16px;
          }

          .mobile-explore-heading h2 {
            margin: 0;
            color: #f7fff9;
            font-size: clamp(28px, 9vw, 40px);
            line-height: 1.04;
            letter-spacing: 0;
          }

          .mobile-explore-heading p {
            margin: 0;
            color: rgba(246,255,249,0.64);
            line-height: 1.58;
          }

          .mobile-explore-grid {
            display: grid;
            gap: 10px;
          }

          .mobile-explore-grid details {
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 22px;
            background: rgba(255,255,255,0.045);
            overflow: hidden;
          }

          .mobile-explore-grid summary {
            min-height: 58px;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0 15px;
            color: #f7fff9;
            font-weight: 900;
            cursor: pointer;
            list-style: none;
          }

          .mobile-explore-grid summary::-webkit-details-marker {
            display: none;
          }

          .mobile-explore-grid summary span {
            width: 34px;
            height: 34px;
            display: grid;
            place-items: center;
            border-radius: 12px;
            color: #06100a;
            background: linear-gradient(135deg, #18ff9a, #00c8ff);
            font-size: 12px;
          }

          .mobile-explore-grid details p,
          .mobile-explore-grid details ul {
            margin: 0;
            padding: 0 15px 14px 61px;
            color: rgba(246,255,249,0.68);
            line-height: 1.5;
            font-size: 14px;
          }

          .mobile-explore-grid details ul {
            display: grid;
            gap: 6px;
            padding-bottom: 16px;
          }

          .mobile-explore-cta {
            width: 100%;
            margin-top: 16px;
          }

          .designer-section {
            padding: calc(92px + env(safe-area-inset-top)) 12px 120px !important;
            min-height: auto !important;
          }

          .mobile-wizard-status {
            max-width: 100%;
            margin: 0 auto 12px;
            display: grid;
            gap: 5px;
            padding: 15px;
            border: 1px solid rgba(140,255,220,0.16);
            border-radius: 22px;
            background:
              radial-gradient(circle at 12% 0%, rgba(0,255,136,0.12), transparent 34%),
              rgba(255,255,255,0.045);
          }

          .mobile-wizard-status span {
            color: #18ff9a;
            font-size: 11px;
            font-weight: 950;
            letter-spacing: 0.14em;
            text-transform: uppercase;
          }

          .mobile-wizard-status strong {
            color: #f7fff9;
            font-size: 22px;
            line-height: 1.1;
          }

          .mobile-wizard-status p {
            margin: 0;
            color: rgba(246,255,249,0.64);
            line-height: 1.45;
            font-size: 14px;
          }

          .guided-studio-stepper-wrap {
            position: sticky;
            top: calc(74px + env(safe-area-inset-top));
            z-index: 32;
            margin-bottom: 14px;
            scroll-margin-top: 112px;
          }

          .guided-studio-stepper {
            border-radius: 22px;
            padding: 7px;
            background: rgba(4, 10, 11, 0.82);
            backdrop-filter: blur(12px);
          }

          .guided-studio-step {
            flex: 0 0 auto;
            min-height: 38px;
            padding: 0 11px;
            font-size: 11px;
          }

          .designer-grid.showroom-grid {
            display: flex !important;
            flex-direction: column;
            gap: 16px !important;
            max-width: 100% !important;
          }

          .showroom-viewer-anchor {
            order: 1;
            scroll-margin-top: 112px;
          }

          .showroom-controls-card {
            order: 2;
          }

          .designer-stat-grid {
            display: none !important;
          }

          .showroom-control-stack {
            gap: 13px !important;
          }

          .guided-placement-panel,
          .guided-shirt-color-panel,
          .quote-action-anchor,
          .order-request-anchor,
          .design-draft-footer {
            scroll-margin-top: 112px;
          }

          .designer-controls-card {
            box-shadow:
              0 24px 80px rgba(0,0,0,0.28),
              inset 0 1px 0 rgba(255,255,255,0.08) !important;
            backdrop-filter: blur(12px) !important;
          }

          @keyframes mobileThreadDraw {
            from {
              transform: scaleX(0);
              opacity: 0;
            }
            to {
              transform: scaleX(1);
              opacity: 1;
            }
          }
        }

        @media (max-width: 640px) {
          html {
            scroll-padding-top: 92px;
          }

          .site-header {
            padding-top: env(safe-area-inset-top);
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

          .header-logo .stitchra-logo-copy {
            display: none !important;
          }

          .header-logo {
            gap: 0 !important;
          }

          .header-logo > span:first-child {
            width: 46px !important;
            height: 46px !important;
            border-radius: 16px !important;
          }

          .header-logo svg {
            width: 46px !important;
            height: 46px !important;
          }

          .header-actions .lux-button {
            min-height: 46px !important;
            padding: 0 15px !important;
            font-size: 13px !important;
            white-space: nowrap;
          }

          .header-actions {
            gap: 8px !important;
            min-width: 0;
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

          .design-start-panel,
          .design-path-panel {
            padding: 16px;
            border-radius: 22px;
          }

          .design-start-grid {
            grid-template-columns: 1fr;
          }

          .design-start-card {
            min-height: 190px;
          }

          .draft-recovery-banner {
            display: grid;
            gap: 14px;
          }

          .draft-recovery-actions {
            justify-content: stretch;
          }

          .draft-recovery-actions small {
            text-align: left;
          }

          .draft-recovery-actions button {
            flex: 1 1 150px;
          }

          .ai-concept-brief,
          .ai-readiness-box,
          .ai-concept-comparison {
            grid-template-columns: 1fr;
          }

          .ai-concept-stage {
            min-height: 300px;
          }

          .ai-concept-action-row {
            display: grid;
            grid-template-columns: 1fr;
          }

          .ai-concept-primary,
          .ai-concept-secondary,
          .ai-concept-link {
            width: 100%;
            justify-content: center;
            text-align: center;
          }

          .design-added-toast {
            left: 16px;
            right: 16px;
            bottom: max(14px, env(safe-area-inset-bottom));
            width: auto;
          }

          .design-added-toast-actions,
          .design-next-step-row {
            grid-template-columns: 1fr;
          }

          .design-added-toast-actions {
            display: grid;
          }

          .design-next-step-row {
            display: grid;
            justify-items: stretch;
          }

          .design-path-panel .designer-prompt-row,
          .designer-prompt-row {
            grid-template-columns: 1fr !important;
          }

          .design-path-panel .designer-prompt-row .lux-button,
          .designer-prompt-row .lux-button {
            width: 100% !important;
            min-width: 0 !important;
          }

          .placement-tab-row {
            margin-inline: -2px;
            padding-bottom: 8px;
          }

          .placement-chip-grid {
            display: flex !important;
            overflow-x: auto;
            gap: 10px !important;
            padding-bottom: 8px;
            scroll-snap-type: x proximity;
          }

          .placement-chip-grid button {
            min-width: 168px;
            scroll-snap-align: start;
          }

          .placement-mobile-select {
            display: block;
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

          .stitchra-upload-box {
            grid-template-columns: 1fr;
            padding: 14px;
            gap: 10px;
          }

          .stitchra-upload-button {
            width: 100%;
          }

          .designer-preview-card {
            min-height: min(620px, calc(100svh - 110px)) !important;
            border-radius: 28px !important;
          }

          .showroom-viewer-anchor .shirt-placement-preview-card,
          .showroom-grid .shirt-placement-preview-card {
            min-height: min(620px, calc(100svh - 110px)) !important;
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
            width: min(390px, 122%) !important;
            height: min(520px, calc(100svh - 154px)) !important;
          }

          .showroom-controls-card {
            margin: 16px auto 0 !important;
          }

          .glow-card::before {
            inset: -24px;
            opacity: 0.10;
            filter: blur(28px);
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

          .pricing-confidence-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .pricing-card-grid,
          .pricing-receipt-grid {
            grid-template-columns: 1fr;
          }

          .pricing-card {
            min-height: auto;
          }

          .pricing-receipt-lines {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .pricing-receipt-head {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (min-width: 720px) and (max-width: 1180px) {
          .pricing-card-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pricing-card,
          .pricing-cta-button::after {
            animation: none;
            transition: none;
          }

          .pricing-card:hover {
            transform: none;
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
            'radial-gradient(circle at 25% 35%, rgba(0,255,136,0.13), transparent 28%), radial-gradient(circle at 80% 26%, rgba(0,215,255,0.12), transparent 30%), radial-gradient(circle at 50% 82%, rgba(124,240,212,0.08), transparent 32%)',
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
  visual,
  accent = 'green',
}: {
  number: string;
  icon: string;
  title: string;
  text: string;
  visual: HomepageCardVisualKind;
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

      <HomepageCardVisual kind={visual} accent={accent} />

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
  visual,
}: {
  icon: string;
  title: string;
  text: string;
  accent: Accent;
  footer: string;
  visual: HomepageCardVisualKind;
}) {
  const colors = accentStyles[accent];

  return (
    <div
      className="glow-card tool-card"
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

      <HomepageCardVisual kind={visual} accent={accent} compact />

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

function HomepageCardVisual({
  kind,
  accent,
  compact = false,
}: {
  kind: HomepageCardVisualKind;
  accent: Accent;
  compact?: boolean;
}) {
  const colors = accentStyles[accent];
  const gradientId = `visual-gradient-${kind}`;
  const glowId = `visual-glow-${kind}`;

  return (
    <div
      className="homepage-card-visual"
      aria-hidden="true"
      style={{
        ...cardVisualShell,
        minHeight: compact ? 122 : 136,
        margin: compact ? '20px 0 34px' : '4px 0 38px',
        '--visual-main': colors.main,
        '--visual-glow': colors.glow,
        '--visual-soft': colors.soft,
      } as CSSProperties}
    >
      <svg
        viewBox="0 0 260 142"
        role="presentation"
        focusable="false"
        style={cardVisualSvg}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={colors.main} stopOpacity="0.96" />
            <stop offset="58%" stopColor="#00d7ff" stopOpacity="0.66" />
            <stop offset="100%" stopColor="#7cf0d4" stopOpacity="0.54" />
          </linearGradient>
          <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern
            id={`${kind}-fabric`}
            width="12"
            height="12"
            patternUnits="userSpaceOnUse"
          >
            <path d="M0 6H12M6 0V12" stroke="currentColor" strokeOpacity="0.11" />
          </pattern>
          <pattern
            id={`${kind}-checker`}
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <rect width="8" height="8" fill="rgba(255,255,255,0.10)" />
            <rect x="8" y="8" width="8" height="8" fill="rgba(255,255,255,0.10)" />
          </pattern>
        </defs>

        <rect
          x="10"
          y="10"
          width="240"
          height="122"
          rx="28"
          fill="rgba(255,255,255,0.035)"
          stroke="currentColor"
          strokeOpacity="0.10"
        />
        <circle cx="56" cy="44" r="42" fill={colors.main} opacity="0.08" />
        <circle cx="204" cy="104" r="52" fill="#00d7ff" opacity="0.055" />

        {kind === 'garment' && (
          <>
            <path
              d="M99 39L117 31C124 43 136 43 143 31L161 39L183 55L172 76L160 70V113H100V70L88 76L77 55L99 39Z"
              fill="rgba(255,255,255,0.09)"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.2"
              filter={`url(#${glowId})`}
            />
            <path
              d="M118 37C123 45 137 45 142 37"
              fill="none"
              stroke="rgba(255,255,255,0.46)"
              strokeWidth="2"
            />
            <circle cx="116" cy="62" r="4" fill={colors.main} />
            <circle cx="130" cy="78" r="4" fill="#00d7ff" />
            <circle cx="145" cy="62" r="4" fill="#7cf0d4" />
            <rect x="36" y="87" width="28" height="28" rx="10" fill="#050607" stroke="rgba(255,255,255,0.22)" />
            <rect x="68" y="87" width="28" height="28" rx="10" fill="#f5f1e8" stroke="rgba(255,255,255,0.22)" />
            <path d="M196 54H226M196 72H216M196 90H230" stroke={colors.main} strokeWidth="3" strokeLinecap="round" opacity="0.72" />
          </>
        )}

        {kind === 'artwork' && (
          <>
            <rect x="42" y="39" width="64" height="70" rx="16" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.14)" />
            <path d="M62 72C72 52 83 52 92 72C83 92 72 92 62 72Z" fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth="2" />
            <path d="M113 74H146" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round" />
            <path d="M132 58L146 74L132 90" fill="none" stroke={colors.main} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="154" y="31" width="72" height="86" rx="18" fill="rgba(255,255,255,0.075)" stroke={`url(#${gradientId})`} strokeWidth="2" filter={`url(#${glowId})`} />
            <path d="M177 83C188 56 204 56 216 83C203 103 189 104 177 83Z" fill="none" stroke={colors.main} strokeWidth="3" />
            <circle cx="177" cy="83" r="4" fill="#00d7ff" />
            <circle cx="216" cy="83" r="4" fill="#00d7ff" />
            <circle cx="196" cy="59" r="4" fill="#7cf0d4" />
            <path d="M203 35L207 43L216 46L207 49L203 58L199 49L190 46L199 43Z" fill={colors.main} opacity="0.8" />
          </>
        )}

        {kind === 'fabric' && (
          <>
            <rect x="42" y="32" width="176" height="88" rx="24" fill={`url(#${kind}-fabric)`} stroke="rgba(255,255,255,0.13)" />
            <path
              d="M100 46L116 39C122 49 138 49 144 39L160 46L177 59L168 76L160 71V109H100V71L92 76L83 59L100 46Z"
              fill="rgba(255,255,255,0.075)"
              stroke={`url(#${gradientId})`}
              strokeWidth="2"
            />
            <rect x="116" y="65" width="42" height="28" rx="9" fill="rgba(0,0,0,0.28)" stroke={colors.main} strokeWidth="2" filter={`url(#${glowId})`} />
            <path d="M118 66H155M118 74H155M118 82H155M118 90H155" stroke="rgba(255,255,255,0.13)" />
            <path d="M192 50C209 64 211 84 196 100" fill="none" stroke={colors.main} strokeWidth="3" strokeLinecap="round" />
            <path d="M196 50L192 50L194 56" fill="none" stroke={colors.main} strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        {kind === 'quote' && (
          <>
            <rect x="42" y="28" width="128" height="88" rx="18" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.13)" />
            <path d="M62 54H96M62 73H124M62 92H108" stroke="rgba(255,255,255,0.34)" strokeWidth="4" strokeLinecap="round" />
            <circle cx="143" cy="54" r="6" fill={colors.main} />
            <circle cx="143" cy="73" r="6" fill="#00d7ff" />
            <circle cx="143" cy="92" r="6" fill="#7cf0d4" />
            <circle cx="196" cy="74" r="34" fill={`url(#${gradientId})`} opacity="0.88" filter={`url(#${glowId})`} />
            <text x="196" y="83" textAnchor="middle" fontSize="30" fontWeight="900" fill="#05100b">€</text>
            <path d="M184 116H226" stroke={colors.main} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
          </>
        )}

        {kind === 'aiLogo' && (
          <>
            <rect x="36" y="38" width="82" height="42" rx="16" fill="rgba(255,255,255,0.075)" stroke="rgba(255,255,255,0.13)" />
            <path d="M56 59H98M70 74H106" stroke="rgba(255,255,255,0.32)" strokeWidth="4" strokeLinecap="round" />
            <path d="M118 62C140 34 175 35 196 62C177 93 139 94 118 62Z" fill="none" stroke={`url(#${gradientId})`} strokeWidth="2.5" filter={`url(#${glowId})`} />
            <path d="M151 75C160 54 174 54 184 75C174 90 160 91 151 75Z" fill="none" stroke={colors.main} strokeWidth="3" />
            <circle cx="132" cy="47" r="4" fill={colors.main} />
            <circle cx="204" cy="71" r="4" fill="#00d7ff" />
            <circle cx="148" cy="102" r="4" fill="#7cf0d4" />
            <path d="M132 47L166 62L204 71M166 62L148 102" stroke="rgba(255,255,255,0.20)" />
          </>
        )}

        {kind === 'fabricPreview' && (
          <>
            <rect x="38" y="30" width="184" height="92" rx="24" fill={`url(#${kind}-fabric)`} stroke="rgba(255,255,255,0.12)" />
            <ellipse cx="130" cy="78" rx="66" ry="30" fill="rgba(0,0,0,0.22)" />
            <rect x="101" y="55" width="58" height="42" rx="13" fill="rgba(255,255,255,0.08)" stroke={`url(#${gradientId})`} strokeWidth="2.4" filter={`url(#${glowId})`} />
            <path d="M113 79C122 62 138 62 147 79C138 92 122 92 113 79Z" fill="none" stroke={colors.main} strokeWidth="3" />
            <path d="M57 49H86M174 49H204M57 106H98M162 106H205" stroke="rgba(255,255,255,0.24)" strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        {kind === 'cleanup' && (
          <>
            <rect x="42" y="34" width="78" height="76" rx="18" fill={`url(#${kind}-checker)`} stroke="rgba(255,255,255,0.13)" />
            <path d="M59 55H103M59 90H103M59 55V90M103 55V90" stroke="rgba(255,255,255,0.32)" strokeDasharray="5 6" />
            <path d="M125 72H151" stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round" />
            <path d="M140 59L153 72L140 85" fill="none" stroke={colors.main} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="158" y="30" width="66" height="84" rx="18" fill="rgba(255,255,255,0.075)" stroke={`url(#${gradientId})`} strokeWidth="2" />
            <path d="M177 83C187 58 205 58 215 83C204 100 188 101 177 83Z" fill="none" stroke={colors.main} strokeWidth="3" filter={`url(#${glowId})`} />
            <path d="M171 46H212M171 105H212" stroke="rgba(255,255,255,0.25)" strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        {kind === 'price' && (
          <>
            <rect x="46" y="26" width="116" height="92" rx="18" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.14)" />
            <path d="M66 52H98M66 72H121M66 92H108" stroke="rgba(255,255,255,0.31)" strokeWidth="4" strokeLinecap="round" />
            <path d="M132 52H145M132 72H145M132 92H145" stroke={colors.main} strokeWidth="4" strokeLinecap="round" />
            <rect x="178" y="46" width="52" height="52" rx="18" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} />
            <text x="204" y="78" textAnchor="middle" fontSize="28" fontWeight="900" fill="#05100b">€</text>
            <path d="M181 113H229" stroke={colors.main} strokeWidth="3" strokeLinecap="round" opacity="0.72" />
          </>
        )}
      </svg>
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

type PricingVisualKind =
  | 'smallLogo'
  | 'largeArtwork'
  | 'uploadCheck'
  | 'studioReview';

type PricingCardItem = {
  label: string;
  value: string;
  description: string;
  visual: PricingVisualKind;
  accent: Accent;
  recommended?: boolean;
};

function PricingCard({ card }: { card: PricingCardItem }) {
  const colors = accentStyles[card.accent];

  return (
    <div
      className={`glow-card pricing-card ${
        card.recommended ? 'pricing-card-recommended' : ''
      }`}
      style={{
        '--pricing-main': colors.main,
        '--pricing-border': colors.border,
        '--pricing-glow': colors.glow,
        '--pricing-soft': colors.soft,
        background: colors.surface,
      } as CSSProperties}
    >
      <PricingVisual kind={card.visual} accent={card.accent} />

      <div className="pricing-card-copy">
        <span>{card.label}</span>
        <strong>{card.value}</strong>
        <p>{card.description}</p>
      </div>
    </div>
  );
}

function PricingVisual({
  kind,
  accent,
}: {
  kind: PricingVisualKind;
  accent: Accent;
}) {
  const colors = accentStyles[accent];
  const commonProps = {
    fill: "none",
    stroke: colors.main,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <div className="pricing-visual-shell" aria-hidden="true">
      <svg
        viewBox="0 0 180 120"
        role="img"
        focusable="false"
      >
        <defs>
          <linearGradient
            id={`pricing-gradient-${kind}`}
            x1="0"
            x2="1"
            y1="0"
            y2="1"
          >
            <stop offset="0%" stopColor={colors.main} stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.14" />
          </linearGradient>
          <filter id={`pricing-glow-${kind}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0.92  0 0 0 0 0.74  0 0 0 .7 0"
            />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect
          x="10"
          y="18"
          width="160"
          height="84"
          rx="24"
          fill="rgba(255,255,255,0.04)"
          stroke="rgba(255,255,255,0.12)"
        />

        {kind === 'smallLogo' ? (
          <>
            <path
              d="M70 34 58 44v48h64V44l-12-10-12 12H82L70 34Z"
              fill="rgba(255,255,255,0.06)"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="2"
            />
            <rect
              x="78"
              y="51"
              width="22"
              height="14"
              rx="5"
              fill={`url(#pricing-gradient-${kind})`}
              filter={`url(#pricing-glow-${kind})`}
            />
            <circle cx="38" cy="48" r="7" fill={colors.main} opacity="0.75" />
            <circle cx="38" cy="72" r="7" fill="#ffffff" opacity="0.34" />
            <path {...commonProps} d="M132 44h20M132 58h13M132 72h22" strokeWidth="3" opacity="0.7" />
          </>
        ) : null}

        {kind === 'largeArtwork' ? (
          <>
            <path
              d="M64 32 50 44v50h80V44l-14-12-14 14H78L64 32Z"
              fill="rgba(255,255,255,0.055)"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="2"
            />
            <rect
              x="72"
              y="53"
              width="38"
              height="30"
              rx="10"
              fill={`url(#pricing-gradient-${kind})`}
              filter={`url(#pricing-glow-${kind})`}
              opacity="0.92"
            />
            <path {...commonProps} d="M78 67h26M91 58v20" strokeWidth="3" />
            <path {...commonProps} d="M134 42c10 8 13 21 8 34M145 34c17 14 22 39 10 58" strokeWidth="2" opacity="0.55" />
          </>
        ) : null}

        {kind === 'uploadCheck' ? (
          <>
            <rect
              x="39"
              y="36"
              width="54"
              height="58"
              rx="12"
              fill="rgba(255,255,255,0.055)"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="2"
            />
            <path {...commonProps} d="M51 55h28M51 68h20M51 81h25" strokeWidth="3" opacity="0.75" />
            <path
              d="M104 61h30"
              stroke={colors.main}
              strokeWidth="3"
              strokeDasharray="4 7"
              strokeLinecap="round"
            />
            <circle
              cx="143"
              cy="61"
              r="20"
              fill={`url(#pricing-gradient-${kind})`}
              filter={`url(#pricing-glow-${kind})`}
            />
            <path d="m134 61 6 7 13-15" stroke="#06100d" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : null}

        {kind === 'studioReview' ? (
          <>
            <rect
              x="34"
              y="36"
              width="64"
              height="52"
              rx="16"
              fill="rgba(255,255,255,0.055)"
              stroke="rgba(255,255,255,0.24)"
              strokeWidth="2"
            />
            <path
              d="M48 51h36M48 63h27M48 75h33"
              stroke="rgba(255,255,255,0.46)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M111 73c13-19 15-38 8-45 24 8 34 27 27 49-5 16-19 22-35 20 9-7 11-15 0-24Z"
              fill={`url(#pricing-gradient-${kind})`}
              filter={`url(#pricing-glow-${kind})`}
            />
            <path {...commonProps} d="M121 72h25M134 59v27" strokeWidth="3" />
          </>
        ) : null}
      </svg>
    </div>
  );
}

type Accent = 'green' | 'cyan' | 'purple' | 'pink';
type HomepageCardVisualKind =
  | 'garment'
  | 'artwork'
  | 'fabric'
  | 'quote'
  | 'aiLogo'
  | 'fabricPreview'
  | 'cleanup'
  | 'price';

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
    main: '#7cf0d4',
    soft: 'rgba(124,240,212,0.13)',
    border: 'rgba(124,240,212,0.24)',
    glow: 'rgba(124,240,212,0.22)',
    icon: 'linear-gradient(135deg, rgba(124,240,212,0.30), rgba(0,215,255,0.14))',
    surface:
      'linear-gradient(145deg, rgba(7,18,16,0.82), rgba(4,8,9,0.90))',
  },
  pink: {
    main: '#18ff9a',
    soft: 'rgba(24,255,154,0.12)',
    border: 'rgba(24,255,154,0.22)',
    glow: 'rgba(24,255,154,0.22)',
    icon: 'linear-gradient(135deg, rgba(24,255,154,0.28), rgba(0,215,255,0.16))',
    surface:
      'linear-gradient(145deg, rgba(8,18,14,0.82), rgba(5,8,8,0.90))',
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
  visual: HomepageCardVisualKind;
}> {
  const copy = getLocalizedArray<{
    title: string;
    text: string;
  }>(locale, 'process');
  const meta = [
    { number: '01', icon: 'TEE', accent: 'green' as const, visual: 'garment' as const },
    { number: '02', icon: 'AI', accent: 'cyan' as const, visual: 'artwork' as const },
    { number: '03', icon: '3D', accent: 'purple' as const, visual: 'fabric' as const },
    { number: '04', icon: '€', accent: 'pink' as const, visual: 'quote' as const },
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
    { icon: 'AI', accent: 'green' as const, visual: 'aiLogo' as const },
    { icon: 'FAB', accent: 'cyan' as const, visual: 'fabricPreview' as const },
    { icon: 'PNG', accent: 'purple' as const, visual: 'cleanup' as const },
    { icon: '€', accent: 'pink' as const, visual: 'price' as const },
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

const toolSectionStyle: CSSProperties = {
  ...sectionStyle,
  padding: '124px 24px 144px',
  overflow: 'hidden',
};

const toolSectionInner: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  maxWidth: 1240,
  margin: '0 auto',
};

const toolGrid: CSSProperties = {
  maxWidth: 1180,
  margin: '54px auto 0',
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(235px, 1fr))',
  gap: 20,
  alignItems: 'stretch',
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
  minHeight: 438,
  padding: 32,
};

const stepCard: CSSProperties = {
  ...glassCard,
  minHeight: 440,
  padding: 32,
};

const cardVisualShell: CSSProperties = {
  width: '100%',
  borderRadius: 24,
  border: '1px solid rgba(255,255,255,0.10)',
  background:
    'linear-gradient(145deg, rgba(255,255,255,0.065), rgba(255,255,255,0.02))',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.08), 0 22px 60px rgba(0,0,0,0.22)',
};

const cardVisualSvg: CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%',
};

const stepTop: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 34,
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
  margin: '0 0 12px',
  fontSize: 20,
  lineHeight: 1.24,
};

const cardText: CSSProperties = {
  margin: 0,
  color: 'rgba(245,247,248,0.62)',
  lineHeight: 1.7,
};

const pricingPanel: CSSProperties = {
  ...glassCard,
  maxWidth: 1180,
  margin: '40px auto 0',
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
  borderTop: '1px solid rgba(185,255,222,0.12)',
  padding: '34px 24px',
  position: 'relative',
  zIndex: 1,
  background:
    'linear-gradient(180deg, rgba(0,11,10,0.62), rgba(0,4,5,0.92))',
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

const mobileMenuButton: CSSProperties = {
  display: 'none',
  minHeight: 44,
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 14,
  padding: '0 12px',
  background: 'rgba(255,255,255,0.055)',
  color: '#f5f7f8',
  font: 'inherit',
  fontSize: 13,
  fontWeight: 900,
  cursor: 'pointer',
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

const configuratorControlPanel: CSSProperties = {
  display: 'grid',
  gap: 12,
  padding: 16,
  borderRadius: 20,
  border: '1px solid rgba(124,240,212,0.18)',
  background:
    'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,200,255,0.045)), rgba(255,255,255,0.035)',
};

const placementSelector: CSSProperties = {
  display: 'grid',
  gap: 12,
};

const placementTabRow: CSSProperties = {
  display: 'flex',
  gap: 8,
  overflowX: 'auto',
  paddingBottom: 2,
};

function placementTabButton(active: boolean): CSSProperties {
  return {
    minHeight: 42,
    border: active
      ? '1px solid rgba(0,255,136,0.70)'
      : '1px solid rgba(255,255,255,0.12)',
    borderRadius: 999,
    padding: '0 15px',
    background: active
      ? 'linear-gradient(135deg, rgba(0,255,136,0.17), rgba(0,200,255,0.10))'
      : 'rgba(255,255,255,0.045)',
    color: active ? '#9dffc4' : 'rgba(245,247,248,0.72)',
    fontWeight: 900,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}

const placementChipGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(142px, 1fr))',
  gap: 10,
};

function placementChipButton(active: boolean): CSSProperties {
  return {
    minHeight: 68,
    display: 'grid',
    gap: 4,
    alignContent: 'center',
    border: active
      ? '1px solid rgba(0,255,136,0.72)'
      : '1px solid rgba(255,255,255,0.10)',
    borderRadius: 16,
    padding: '10px 12px',
    background: active
      ? 'linear-gradient(135deg, rgba(0,255,136,0.14), rgba(0,200,255,0.08))'
      : 'rgba(255,255,255,0.04)',
    color: '#f5f7f8',
    textAlign: 'left',
    cursor: 'pointer',
    boxShadow: active ? '0 0 24px rgba(0,255,136,0.12)' : 'none',
  };
}

const configuratorControlHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  color: 'rgba(245,247,248,0.72)',
  fontSize: 13,
};

const sliderLabel: CSSProperties = {
  display: 'grid',
  gap: 10,
  color: '#f5f7f8',
  fontSize: 13,
  fontWeight: 850,
};

const rangeInput: CSSProperties = {
  width: '100%',
  accentColor: '#00ff88',
};

const configuratorHint: CSSProperties = {
  margin: 0,
  color: 'rgba(245,247,248,0.62)',
  fontSize: 13,
  lineHeight: 1.45,
};

const configuratorWarning: CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: 1.45,
  fontWeight: 750,
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
