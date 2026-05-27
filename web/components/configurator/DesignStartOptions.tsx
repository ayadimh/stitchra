"use client";

export type DesignStartMode = 'choice' | 'upload' | 'ai';

type DesignStartOptionsProps = {
  selectedMode: DesignStartMode;
  onSelectMode: (mode: Exclude<DesignStartMode, 'choice'>) => void;
  copy?: {
    eyebrow: string;
    title: string;
    subtitle: string;
    uploadTitle: string;
    uploadText: string;
    uploadCta: string;
    aiTitle: string;
    aiText: string;
    aiCta: string;
  };
};

const defaultCopy: NonNullable<DesignStartOptionsProps['copy']> = {
  eyebrow: 'Design start',
  title: 'How do you want to start?',
  subtitle: 'Upload your own logo or create an embroidery-friendly concept with AI.',
  uploadTitle: 'Bring your own design',
  uploadText:
    'Upload your logo and see it live on the T-shirt before requesting a quote.',
  uploadCta: 'Upload logo',
  aiTitle: 'Create with AI',
  aiText:
    'Describe an original idea and Stitchra creates an embroidery-friendly concept for preview.',
  aiCta: 'Generate concept',
};

export default function DesignStartOptions({
  selectedMode,
  onSelectMode,
  copy = defaultCopy,
}: DesignStartOptionsProps) {
  return (
    <section className="design-start-panel" aria-labelledby="design-start-title">
      <div className="design-start-header">
        <span>{copy.eyebrow}</span>
        <h2 id="design-start-title">{copy.title}</h2>
        <p>{copy.subtitle}</p>
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
            <b>PNG</b>
            <b>JPG</b>
            <b>SVG</b>
          </span>
          <strong>{copy.uploadTitle}</strong>
          <p>{copy.uploadText}</p>
          <small>{copy.uploadCta}</small>
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
            <b>AI</b>
          </span>
          <strong>{copy.aiTitle}</strong>
          <p>{copy.aiText}</p>
          <small>{copy.aiCta}</small>
        </button>
      </div>
    </section>
  );
}
