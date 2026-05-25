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
};

export type AIConceptReadiness = {
  score: number;
  colorsTarget: number;
  contrastNote: string;
  detailNote: string;
  recommendation: string;
};

type AIConceptReviewPanelProps = {
  concepts: AIConcept[];
  selectedConceptId: string | null;
  activeConceptId: string | null;
  styleHints: string[];
  readiness: AIConceptReadiness;
  isGenerating: boolean;
  isCleaningBackground: boolean;
  backgroundCleanupStatus: string;
  onSelectConcept: (conceptId: string) => void;
  onUseConcept: (concept: AIConcept) => void;
  onCleanBackground: (concept: AIConcept) => void;
  onGenerateAnother: () => void;
  onApplyChanges: (changeRequest: string, concept: AIConcept) => void;
  onSwitchToUpload: () => void;
};

export default function AIConceptReviewPanel({
  concepts,
  selectedConceptId,
  activeConceptId,
  styleHints,
  readiness,
  isGenerating,
  isCleaningBackground,
  backgroundCleanupStatus,
  onSelectConcept,
  onUseConcept,
  onCleanBackground,
  onGenerateAnother,
  onApplyChanges,
  onSwitchToUpload,
}: AIConceptReviewPanelProps) {
  const [isSuggestingChanges, setIsSuggestingChanges] = useState(false);
  const [changeRequest, setChangeRequest] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const displayImage =
    selectedConcept.cleanedImageDataUrl ?? selectedConcept.imageDataUrl;
  const hasCleanedImage = Boolean(selectedConcept.cleanedImageDataUrl);

  return (
    <section className="ai-concept-review" aria-labelledby="ai-concept-review-title">
      <div className="ai-concept-review-header">
        <span>AI concept</span>
        <h3 id="ai-concept-review-title">Review your AI concept</h3>
        <p>Check the design clearly before placing it on the T-shirt.</p>
      </div>

      <button
        type="button"
        className="ai-concept-stage"
        onClick={() => setIsModalOpen(true)}
        aria-label="Open AI concept full-size preview"
      >
        {/* Native img keeps generated data URLs lightweight and immediate. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayImage}
          alt="Generated AI embroidery concept"
          draggable={false}
        />
        <span>{hasCleanedImage ? 'Transparent PNG ready' : 'AI concept'}</span>
      </button>

      {hasCleanedImage && (
        <div className="ai-concept-comparison" aria-label="Background cleanup comparison">
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedConcept.imageDataUrl} alt="" draggable={false} />
            <figcaption>Original</figcaption>
          </figure>
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedConcept.cleanedImageDataUrl} alt="" draggable={false} />
            <figcaption>Cleaned</figcaption>
          </figure>
        </div>
      )}

      <div className="ai-concept-brief">
        <div>
          <span>Original idea</span>
          <p>{selectedConcept.prompt}</p>
        </div>

        {styleHints.length > 0 && (
          <div>
            <span>Style direction</span>
            <div className="ai-concept-style-list">
              {styleHints.map((styleHint) => (
                <b key={styleHint}>{styleHint}</b>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="ai-concept-note">
        The T-shirt preview shows placement and size. This concept preview shows the artwork clearly.
        Final stitch-ready artwork is reviewed by Stitchra before production.
      </p>

      <p className="ai-provider-credit">
        AI concept generation powered by{' '}
        <a
          href="https://pollinations.ai"
          target="_blank"
          rel="noopener noreferrer"
        >
          pollinations.ai
        </a>
      </p>

      <div className="ai-readiness-box" aria-label="Embroidery readiness summary">
        <div>
          <span>Embroidery-ready score</span>
          <strong>{readiness.score}/100</strong>
        </div>
        <div>
          <span>Colors target</span>
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
          {isActiveConcept ? 'Design added' : 'Use this design'}
        </button>
        <button
          type="button"
          className="ai-concept-secondary"
          onClick={() => onCleanBackground(selectedConcept)}
          disabled={isCleaningBackground}
        >
          {isCleaningBackground ? 'Cleaning...' : 'Clean background'}
        </button>
        <button
          type="button"
          className="ai-concept-secondary"
          onClick={onGenerateAnother}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate another'}
        </button>
        <button
          type="button"
          className="ai-concept-secondary"
          onClick={() => setIsSuggestingChanges((current) => !current)}
        >
          Suggest changes
        </button>
        <button
          type="button"
          className="ai-concept-link"
          onClick={onSwitchToUpload}
        >
          Upload my own logo instead
        </button>
      </div>

      {backgroundCleanupStatus && (
        <p className={hasCleanedImage ? 'ai-cleanup-status-success' : 'ai-cleanup-status'}>
          {backgroundCleanupStatus}
        </p>
      )}

      {isSuggestingChanges && (
        <div className="ai-concept-change-box">
          <label htmlFor="ai-concept-change-request">Tell us what to change</label>
          <textarea
            id="ai-concept-change-request"
            value={changeRequest}
            onChange={(event) => setChangeRequest(event.target.value)}
            placeholder="Example: make it more playful, fewer colors, bigger giraffe, remove text"
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
            Apply changes
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
              <span>Concept {index + 1}</span>
            </button>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div
          className="ai-concept-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="AI concept full-size preview"
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
              aria-label="Close AI concept preview"
            >
              ×
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayImage}
              alt="Generated AI embroidery concept large preview"
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
                Use this design
              </button>
              <button
                type="button"
                className="ai-concept-secondary"
                onClick={onGenerateAnother}
                disabled={isGenerating}
              >
                Generate another
              </button>
              <button
                type="button"
                className="ai-concept-secondary"
                onClick={() => {
                  setIsSuggestingChanges(true);
                  setIsModalOpen(false);
                }}
              >
                Suggest changes
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
