'use client';

import { useMemo, useState } from 'react';

export type AIConcept = {
  id: string;
  imageDataUrl: string;
  cleanedImageDataUrl?: string;
  cleanedAt?: number;
  filename: string;
  prompt: string;
  source?: string;
  seed?: number;
  variationHint?: string;
  variationIndex?: number;
  variationMode?: 'new' | 'refine' | 'same';
  imageHash?: string;
  createdAt?: number;
  accepted?: boolean;
};

export type AIConceptReadiness = {
  score: number;
  colorsTarget: number;
  contrastNote: string;
  detailNote: string;
  recommendation: string;
};

type AIConceptReviewCopy = {
  badge: string;
  title: string;
  subtitle: string;
  original: string;
  cleaned: string;
  fullPreviewAria: string;
  transparentReady: string;
  originalIdea: string;
  styleDirection: string;
  note: string;
  providerCredit: string;
  privateDataNote: string;
  readinessLabel: string;
  colorsTarget: string;
  designAdded: string;
  useThisDesign: string;
  cleaning: string;
  cleanBackground: string;
  generatingNew: string;
  generateAnother: string;
  suggestChanges: string;
  uploadInstead: string;
  variationHelper: string;
  refineDirection: string;
  safety: string;
  saferVersion: string;
  changeLabel: string;
  changePlaceholder: string;
  applyChanges: string;
  variation: string;
  added: string;
  modalAria: string;
  closePreviewAria: string;
  imageAlt: string;
  largeImageAlt: string;
  refinements: readonly string[];
};

type AIConceptReviewPanelProps = {
  concepts: AIConcept[];
  selectedConceptId: string | null;
  activeConceptId: string | null;
  styleHints: string[];
  readiness: AIConceptReadiness;
  isGenerating: boolean;
  isGeneratingVariation: boolean;
  isCleaningBackground: boolean;
  backgroundCleanupStatus: string;
  copy?: Partial<AIConceptReviewCopy>;
  onSelectConcept: (conceptId: string) => void;
  onUseConcept: (concept: AIConcept) => void;
  onCleanBackground: (concept: AIConcept) => void;
  onGenerateAnother: () => void;
  onApplyChanges: (changeRequest: string, concept: AIConcept) => void;
  onSwitchToUpload: () => void;
};

const REFINEMENT_SUGGESTIONS = [
  'Make it simpler',
  'Reduce colors',
  'Make it more playful',
  'Make it more premium',
  'Remove text',
  'Add outline',
] as const;

const SAFER_ORIGINAL_REQUEST =
  'Make the concept more original and avoid recognizable protected characters, brands or mascots.';

const defaultCopy: AIConceptReviewCopy = {
  badge: 'AI concept',
  title: 'Review your AI concept',
  subtitle: 'Check the design clearly before placing it on the T-shirt.',
  original: 'Original',
  cleaned: 'Cleaned',
  fullPreviewAria: 'Open AI concept full-size preview',
  transparentReady: 'Transparent PNG ready',
  originalIdea: 'Original idea',
  styleDirection: 'Style direction',
  note:
    'The T-shirt preview shows placement and size. This concept preview shows the artwork clearly. Final stitch-ready artwork is reviewed by Stitchra before production.',
  providerCredit: 'AI concept generation powered by',
  privateDataNote: 'Do not enter private personal data in design prompts.',
  readinessLabel: 'Embroidery-ready score',
  colorsTarget: 'Colors target',
  designAdded: 'Design added',
  useThisDesign: 'Use this design',
  cleaning: 'Cleaning...',
  cleanBackground: 'Clean background',
  generatingNew: 'Generating new direction...',
  generateAnother: 'Generate another direction',
  suggestChanges: 'Suggest changes',
  uploadInstead: 'Upload my own logo instead',
  variationHelper:
    'Generate another direction creates a different visual direction for the same idea.',
  refineDirection: 'Refine direction',
  safety:
    'Please make sure this concept does not resemble a protected brand, logo, character or celebrity. Stitchra may reject risky artwork before production.',
  saferVersion: 'Generate safer original version',
  changeLabel: 'Tell us what to change',
  changePlaceholder:
    'Example: make it more playful, fewer colors, bigger giraffe, remove text',
  applyChanges: 'Apply changes',
  variation: 'Variation',
  added: 'Added',
  modalAria: 'AI concept full-size preview',
  closePreviewAria: 'Close AI concept preview',
  imageAlt: 'Generated AI embroidery concept',
  largeImageAlt: 'Generated AI embroidery concept large preview',
  refinements: REFINEMENT_SUGGESTIONS,
};

export default function AIConceptReviewPanel({
  concepts,
  selectedConceptId,
  activeConceptId,
  styleHints,
  readiness,
  isGenerating,
  isGeneratingVariation,
  isCleaningBackground,
  backgroundCleanupStatus,
  copy: copyOverrides,
  onSelectConcept,
  onUseConcept,
  onCleanBackground,
  onGenerateAnother,
  onApplyChanges,
  onSwitchToUpload,
}: AIConceptReviewPanelProps) {
  const copy = { ...defaultCopy, ...copyOverrides };
  const [isSuggestingChanges, setIsSuggestingChanges] = useState(false);
  const [changeRequest, setChangeRequest] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewVariant, setPreviewVariant] =
    useState<'original' | 'cleaned'>('cleaned');
  const selectedConcept = useMemo(() => {
    return (
      concepts.find((concept) => concept.id === selectedConceptId) ??
      concepts[0] ??
      null
    );
  }, [concepts, selectedConceptId]);

  if (!selectedConcept) {
    return null;
  }

  const canApplyChanges = changeRequest.trim().length > 0 && !isGenerating;
  const isActiveConcept = activeConceptId === selectedConcept.id;
  const hasCleanedImage = Boolean(selectedConcept.cleanedImageDataUrl);
  const displayImage =
    hasCleanedImage && previewVariant === 'cleaned'
      ? selectedConcept.cleanedImageDataUrl ?? selectedConcept.imageDataUrl
      : selectedConcept.imageDataUrl;

  return (
    <section className="ai-concept-review" aria-labelledby="ai-concept-review-title">
      <div className="ai-concept-review-header">
        <span>{copy.badge}</span>
        <h3 id="ai-concept-review-title">{copy.title}</h3>
        <p>{copy.subtitle}</p>
      </div>

      {hasCleanedImage && (
        <div className="ai-concept-variant-toggle" aria-label="AI concept preview version">
          {(['original', 'cleaned'] as const).map((variant) => (
            <button
              key={variant}
              type="button"
              className={previewVariant === variant ? 'ai-concept-variant-active' : ''}
              onClick={() => setPreviewVariant(variant)}
            >
              {variant === 'original' ? copy.original : copy.cleaned}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        className="ai-concept-stage"
        onClick={() => setIsModalOpen(true)}
        aria-label={copy.fullPreviewAria}
      >
        {/* Native img keeps generated data URLs lightweight and immediate. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayImage}
          alt={copy.imageAlt}
          draggable={false}
        />
        <span>{hasCleanedImage ? copy.transparentReady : copy.badge}</span>
      </button>

      {hasCleanedImage && (
        <div className="ai-concept-comparison" aria-label="Background cleanup comparison">
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedConcept.imageDataUrl} alt="" draggable={false} />
            <figcaption>{copy.original}</figcaption>
          </figure>
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedConcept.cleanedImageDataUrl} alt="" draggable={false} />
            <figcaption>{copy.cleaned}</figcaption>
          </figure>
        </div>
      )}

      <div className="ai-concept-brief">
        <div>
          <span>{copy.originalIdea}</span>
          <p>{selectedConcept.prompt}</p>
        </div>

        {styleHints.length > 0 && (
          <div>
            <span>{copy.styleDirection}</span>
            <div className="ai-concept-style-list">
              {styleHints.map((styleHint) => (
                <b key={styleHint}>{styleHint}</b>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="ai-concept-note">
        {copy.note}
      </p>

      <p className="ai-provider-credit">
        {copy.providerCredit}{' '}
        <a
          href="https://pollinations.ai"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open pollinations.ai in a new tab"
        >
          pollinations.ai
        </a>
        . {copy.privateDataNote}
      </p>

      <div className="ai-readiness-box" aria-label="Embroidery readiness summary">
        <div>
          <span>{copy.readinessLabel}</span>
          <strong>{readiness.score}/100</strong>
        </div>
        <div>
          <span>{copy.colorsTarget}</span>
          <strong>{readiness.colorsTarget}</strong>
        </div>
        <p>{readiness.contrastNote}</p>
        <p>{readiness.detailNote}</p>
        <p>{readiness.recommendation}</p>
      </div>

      <div className="ai-concept-action-row">
        <button
          type="button"
          className="ai-concept-primary"
          onClick={() => onUseConcept(selectedConcept)}
        >
          {isActiveConcept ? copy.designAdded : copy.useThisDesign}
        </button>
        <button
          type="button"
          className="ai-concept-secondary"
          onClick={() => onCleanBackground(selectedConcept)}
          disabled={isCleaningBackground}
        >
          {isCleaningBackground ? copy.cleaning : copy.cleanBackground}
        </button>
        <button
          type="button"
          className="ai-concept-secondary"
          onClick={onGenerateAnother}
          disabled={isGenerating}
        >
          {isGeneratingVariation ? copy.generatingNew : copy.generateAnother}
        </button>
        <button
          type="button"
          className="ai-concept-secondary"
          onClick={() => setIsSuggestingChanges((current) => !current)}
        >
          {copy.suggestChanges}
        </button>
        <button
          type="button"
          className="ai-concept-link"
          onClick={onSwitchToUpload}
      >
          {copy.uploadInstead}
      </button>
      </div>

      <p className="ai-variation-helper">
        {copy.variationHelper}
      </p>

      <div className="ai-refinement-strip">
        <span>{copy.refineDirection}</span>
        <div className="ai-refinement-chip-row" aria-label="Suggested refinements">
          {copy.refinements.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setChangeRequest(suggestion);
                setIsSuggestingChanges(true);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="ai-output-safety-box">
        <p>
          {copy.safety}
        </p>
        <button
          type="button"
          className="ai-concept-link"
          onClick={() => onApplyChanges(SAFER_ORIGINAL_REQUEST, selectedConcept)}
          disabled={isGenerating}
        >
          {copy.saferVersion}
        </button>
      </div>

      {backgroundCleanupStatus && (
        <p className={hasCleanedImage ? 'ai-cleanup-status-success' : 'ai-cleanup-status'}>
          {backgroundCleanupStatus}
        </p>
      )}

      {isSuggestingChanges && (
        <div className="ai-concept-change-box">
          <label htmlFor="ai-concept-change-request">{copy.changeLabel}</label>
          <textarea
            id="ai-concept-change-request"
            value={changeRequest}
            onChange={(event) => setChangeRequest(event.target.value)}
            placeholder={copy.changePlaceholder}
            rows={3}
          />
          <button
            type="button"
            className="ai-concept-primary"
            disabled={!canApplyChanges}
            onClick={() => {
              const trimmedRequest = changeRequest.trim();
              if (!trimmedRequest) return;
              onApplyChanges(trimmedRequest, selectedConcept);
              setChangeRequest('');
            }}
          >
            {copy.applyChanges}
          </button>
        </div>
      )}

      {concepts.length > 1 && (
        <div className="ai-concept-history" aria-label="Generated concept history">
          {concepts.map((concept, index) => (
            <button
              key={concept.id}
              type="button"
              className={concept.id === selectedConcept.id ? 'ai-concept-thumb-active' : ''}
              onClick={() => onSelectConcept(concept.id)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={concept.cleanedImageDataUrl ?? concept.imageDataUrl}
                alt=""
                draggable={false}
              />
              <span>
                {copy.variation} {concept.variationIndex ?? index + 1}
                {concept.accepted ? ` · ${copy.added}` : ''}
              </span>
            </button>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div
          className="ai-concept-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={copy.modalAria}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="ai-concept-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="ai-concept-modal-close"
              onClick={() => setIsModalOpen(false)}
              aria-label={copy.closePreviewAria}
            >
              ×
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayImage}
              alt={copy.largeImageAlt}
              draggable={false}
            />
            <div className="ai-concept-action-row">
              <button
                type="button"
                className="ai-concept-primary"
                onClick={() => {
                  onUseConcept(selectedConcept);
                  setIsModalOpen(false);
                }}
              >
                {copy.useThisDesign}
              </button>
              <button
                type="button"
                className="ai-concept-secondary"
                onClick={onGenerateAnother}
                disabled={isGenerating}
              >
                {copy.generateAnother}
              </button>
              <button
                type="button"
                className="ai-concept-secondary"
                onClick={() => {
                  setIsSuggestingChanges(true);
                  setIsModalOpen(false);
                }}
              >
                {copy.suggestChanges}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
