'use client';

type DraftRecoveryBannerProps = {
  lastSavedAt: number | null;
  saveStatus: string;
  imageNeedsUpload: boolean;
  copy?: {
    ariaLabel: string;
    savedDraft: string;
    restoredSettings: string;
    restoredDesign: string;
    imageNeedsUploadText: string;
    readyText: string;
    continue: string;
    startNew: string;
  };
  onContinue: () => void;
  onStartNew: () => void;
};

export default function DraftRecoveryBanner({
  saveStatus,
  imageNeedsUpload,
  copy,
  onContinue,
  onStartNew,
}: DraftRecoveryBannerProps) {
  const labels = {
    ariaLabel: 'Restored design draft',
    savedDraft: 'Saved draft',
    restoredSettings: 'Restored your settings',
    restoredDesign: 'Restored your last design',
    imageNeedsUploadText:
      'We restored your settings, but the image needs to be uploaded again.',
    readyText:
      'Your shirt color, placement, logo and AI concept history are ready to continue.',
    continue: 'Continue',
    startNew: 'Start new design',
    ...copy,
  };

  return (
    <section className="draft-recovery-banner" aria-label={labels.ariaLabel}>
      <div>
        <span>{labels.savedDraft}</span>
        <strong>
          {imageNeedsUpload
            ? labels.restoredSettings
            : labels.restoredDesign}
        </strong>
        <p>
          {imageNeedsUpload
            ? labels.imageNeedsUploadText
            : labels.readyText}
        </p>
      </div>

      <div className="draft-recovery-actions">
        {saveStatus && <small>{saveStatus}</small>}
        <button type="button" onClick={onContinue}>
          {labels.continue}
        </button>
        <button type="button" onClick={onStartNew}>
          {labels.startNew}
        </button>
      </div>
    </section>
  );
}
