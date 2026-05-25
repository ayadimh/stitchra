"use client";

export type DesignStartMode = 'choice' | 'upload' | 'ai';

type DesignStartOptionsProps = {
  selectedMode: DesignStartMode;
  onSelectMode: (mode: Exclude<DesignStartMode, 'choice'>) => void;
};

export default function DesignStartOptions({
  selectedMode,
  onSelectMode,
}: DesignStartOptionsProps) {
  return (
    <section className="design-start-panel" aria-labelledby="design-start-title">
      <div className="design-start-header">
        <span>Design start</span>
        <h2 id="design-start-title">How do you want to start?</h2>
        <p>
          Upload your own logo or create an embroidery-friendly concept with AI.
        </p>
      </div>

      <div className="design-start-grid">
        <button
          type="button"
          className={`design-start-card ${
            selectedMode === 'upload' ? 'design-start-card-active' : ''
          }`}
          onClick={() => onSelectMode('upload')}
        >
          <span className="design-start-visual design-start-visual-upload" aria-hidden="true">
            <i />
          </span>
          <strong>Bring your own design</strong>
          <p>
            Upload your logo and preview it on the T-shirt before requesting a quote.
          </p>
          <small>Upload logo</small>
        </button>

        <button
          type="button"
          className={`design-start-card ${
            selectedMode === 'ai' ? 'design-start-card-active' : ''
          }`}
          onClick={() => onSelectMode('ai')}
        >
          <span className="design-start-visual design-start-visual-ai" aria-hidden="true">
            <i />
          </span>
          <strong>Create with AI</strong>
          <p>
            Describe an original idea and Stitchra creates an embroidery-friendly concept for preview.
          </p>
          <small>Generate concept</small>
        </button>
      </div>
    </section>
  );
}
