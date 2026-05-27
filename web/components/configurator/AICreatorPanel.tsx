"use client";

type AICreatorPanelProps = {
  prompt: string;
  selectedStyleHints: string[];
  isGenerating: boolean;
  hasGeneratedConcept: boolean;
  copy?: {
    eyebrow: string;
    title: string;
    subtitle: string;
    inputAria: string;
    placeholder: string;
    generating: string;
    generate: string;
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

const defaultCopy: NonNullable<AICreatorPanelProps['copy']> = {
  eyebrow: 'AI creator',
  title: 'Create with AI',
  subtitle:
    'Describe an original idea. Stitchra turns it into an embroidery-friendly concept for preview.',
  inputAria: 'Describe the AI artwork idea',
  placeholder:
    'Example: playful giraffe driving a tiny red car through space, clean patch logo, 4 colors',
  generating: 'Generating...',
  generate: 'Generate concept',
  intent: 'Intent',
  directionPrefix: 'Direction:',
  chooseDirection: 'Choose a style direction before generating.',
  previewNote:
    'AI concepts are previews. Final stitch-ready artwork is reviewed by Stitchra before production.',
  reviewNote: 'Review the concept below, then use it on the shirt.',
  providerCredit: 'AI concept generation powered by',
  privateDataNote: 'Do not enter private personal data in design prompts.',
  uploadInstead: 'Or upload your own logo instead.',
  styleHints: {},
};

export default function AICreatorPanel({
  prompt,
  selectedStyleHints,
  isGenerating,
  hasGeneratedConcept,
  copy = defaultCopy,
  onPromptChange,
  onToggleStyleHint,
  onGenerate,
  onSwitchToUpload,
}: AICreatorPanelProps) {
  return (
    <section className="design-path-panel design-path-panel-ai ai-concept-studio">
      <div className="design-path-header">
        <span>{copy.eyebrow}</span>
        <h3>{copy.title}</h3>
        <p>{copy.subtitle}</p>
      </div>

      <div className="designer-prompt-row">
        <input
          id="stitchra-ai-idea-input"
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          aria-label={copy.inputAria}
          placeholder={copy.placeholder}
        />

        <button
          id="stitchra-ai-generate-button"
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className="lux-button"
        >
          {isGenerating ? copy.generating : copy.generate}
        </button>
      </div>

      <div className="ai-style-selector">
        <div>
          <span>{copy.intent}</span>
          <p>
            {selectedStyleHints.length > 0
              ? `${copy.directionPrefix} ${selectedStyleHints
                  .map((styleHint) => copy.styleHints[styleHint] ?? styleHint)
                  .join(', ')}`
              : copy.chooseDirection}
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
                {copy.styleHints[styleHint] ?? styleHint}
              </button>
            );
          })}
        </div>
      </div>

      <p className="design-path-helper">
        {hasGeneratedConcept
          ? copy.reviewNote
          : copy.previewNote}
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

      <button
        type="button"
        className="design-path-link"
        onClick={onSwitchToUpload}
      >
        {copy.uploadInstead}
      </button>
    </section>
  );
}
