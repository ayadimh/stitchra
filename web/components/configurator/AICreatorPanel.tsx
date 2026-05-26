"use client";

type AICreatorPanelProps = {
  prompt: string;
  selectedStyleHints: string[];
  isGenerating: boolean;
  hasGeneratedConcept: boolean;
  onPromptChange: (value: string) => void;
  onToggleStyleHint: (value: string) => void;
  onGenerate: () => void;
  onSwitchToUpload: () => void;
};

const STYLE_HINTS = [
  'Badge',
  'Minimal',
  'Kids',
  'Club',
  'Event',
  'Streetwear',
  'Business',
  'Vintage',
];

export default function AICreatorPanel({
  prompt,
  selectedStyleHints,
  isGenerating,
  hasGeneratedConcept,
  onPromptChange,
  onToggleStyleHint,
  onGenerate,
  onSwitchToUpload,
}: AICreatorPanelProps) {
  return (
    <section className="design-path-panel design-path-panel-ai ai-concept-studio">
      <div className="design-path-header">
        <span>AI creator</span>
        <h3>Create with AI</h3>
        <p>
          Describe an original idea. Stitchra turns it into an embroidery-friendly concept for preview.
        </p>
      </div>

      <div className="designer-prompt-row">
        <input
          id="stitchra-ai-idea-input"
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          aria-label="Describe the AI artwork idea"
          placeholder="Example: playful giraffe driving a tiny red car through space, clean patch logo, 4 colors"
        />

        <button
          id="stitchra-ai-generate-button"
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className="lux-button"
        >
          {isGenerating ? 'Generating...' : 'Generate concept'}
        </button>
      </div>

      <div className="ai-style-selector">
        <div>
          <span>Intent</span>
          <p>
            {selectedStyleHints.length > 0
              ? `Direction: ${selectedStyleHints.join(', ')}`
              : 'Choose a style direction before generating.'}
          </p>
        </div>

        <div className="ai-style-chip-row" aria-label="AI concept style hints">
          {STYLE_HINTS.map((styleHint) => {
            const active = selectedStyleHints.includes(styleHint);

            return (
              <button
                key={styleHint}
                type="button"
                className={active ? 'ai-style-chip-active' : ''}
                onClick={() => onToggleStyleHint(styleHint)}
                aria-pressed={active}
              >
                {styleHint}
              </button>
            );
          })}
        </div>
      </div>

      <p className="design-path-helper">
        {hasGeneratedConcept
          ? 'Review the concept below, then use it on the shirt.'
          : 'AI concepts are previews. Final stitch-ready artwork is reviewed by Stitchra before production.'}
      </p>

      <p className="ai-provider-credit">
        AI concept generation powered by{' '}
        <a
          href="https://pollinations.ai"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open pollinations.ai in a new tab"
        >
          pollinations.ai
        </a>
        . Do not enter private personal data in design prompts.
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
