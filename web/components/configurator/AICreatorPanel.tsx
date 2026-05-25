"use client";

type AICreatorPanelProps = {
  prompt: string;
  isGenerating: boolean;
  hasGeneratedConcept: boolean;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  onSwitchToUpload: () => void;
};

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

      <div className="designer-prompt-row">
        <input
          id="stitchra-ai-idea-input"
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          aria-label="Describe the AI artwork idea"
          placeholder="Example: school Eid al-Adha badge with crescent, lantern and bold text"
        />

        <button
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
        AI concepts are previews. Final stitch-ready artwork is reviewed by Stitchra before production.
      </p>

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
