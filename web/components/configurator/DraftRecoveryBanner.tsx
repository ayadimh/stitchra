'use client';

type DraftRecoveryBannerProps = {
  lastSavedAt: number | null;
  saveStatus: string;
  imageNeedsUpload: boolean;
  onContinue: () => void;
  onStartNew: () => void;
};

function formatSavedTime(value: number | null) {
  if (!value) {
    return 'Saved draft';
  }

  try {
    return `Saved ${new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))}`;
  } catch {
    return 'Saved draft';
  }
}

export default function DraftRecoveryBanner({
  lastSavedAt,
  saveStatus,
  imageNeedsUpload,
  onContinue,
  onStartNew,
}: DraftRecoveryBannerProps) {
  return (
    <section className="draft-recovery-banner" aria-label="Restored design draft">
      <div>
        <span>{formatSavedTime(lastSavedAt)}</span>
        <strong>
          {imageNeedsUpload
            ? 'Restored your settings'
            : 'Restored your last design'}
        </strong>
        <p>
          {imageNeedsUpload
            ? 'We restored your settings, but the image needs to be uploaded again.'
            : 'Your shirt color, placement, logo and AI concept history are ready to continue.'}
        </p>
      </div>

      <div className="draft-recovery-actions">
        {saveStatus && <small>{saveStatus}</small>}
        <button type="button" onClick={onContinue}>
          Continue
        </button>
        <button type="button" onClick={onStartNew}>
          Start new design
        </button>
      </div>
    </section>
  );
}
