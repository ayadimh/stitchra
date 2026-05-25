"use client";

type AICreatorPanelProps = {
  prompt: string;
  isGenerating: boolean;
  hasGeneratedConcept: boolean;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  onSwitchToUpload: () => void;
};

const IDEA_SUGGESTIONS = [
  'school Eid al-Adha badge with crescent and lantern',
  'minimal green coffee brand logo',
  'retro gaming club badge with lightning',
  'cute giraffe driving a tiny car through space',
];

export default function AICreatorPanel({
  prompt,
  isGenerating,
  hasGeneratedConcept,
  onPromptChange,
  onGenerate,
  onSwitchToUpload,
}: AICreatorPanelProps) {
  return (
    <section className="design-path-panel design-path-panel-ai">
      <div className="design-path-header">
        <span>Create with AI</span>
        <h3>Need an idea?</h3>
        <p>
          Describe an original idea. We&apos;ll create an embroidery-friendly concept for preview.
        </p>
      </div>

      <div className="ai-idea-chip-row" aria-label="Example AI artwork ideas">
        {IDEA_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onPromptChange(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="designer-prompt-row">
        <input
          id="stitchra-ai-idea-input"
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          aria-label="Describe the AI artwork idea"
          placeholder="Example: cute giraffe driving a tiny car through space, patch logo for kids, 4 colors"
        />

        <button
          id="stitchra-ai-generate-button"
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className="lux-button"
        >
          {isGenerating
            ? 'Generating...'
            : hasGeneratedConcept
              ? 'Regenerate'
              : 'Generate concept'}
        </button>
      </div>

      <p className="design-path-helper">
        {hasGeneratedConcept
          ? 'AI concept generated. Final stitch-ready artwork is reviewed by Stitchra.'
          : 'AI concepts are previews. Final stitch-ready artwork is reviewed by Stitchra before production.'}
      </p>

      {hasGeneratedConcept && (
        <div className="ai-concept-status">
          <span>AI concept</span>
          <strong>Use this on the shirt</strong>
        </div>
      )}

      <button
        type="button"
        className="design-path-link"
        onClick={onSwitchToUpload}
      >
        Or upload your own logo instead.
      </button>
    </section>
  );
}
