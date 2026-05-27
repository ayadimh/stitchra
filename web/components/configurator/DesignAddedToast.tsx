"use client";

type DesignAddedToastProps = {
  open: boolean;
  copy?: {
    ariaLabel: string;
    eyebrow: string;
    title: string;
    text: string;
    viewOnShirt: string;
    checkPrice: string;
    keepEditing: string;
  };
  onViewOnShirt: () => void;
  onCheckPrice: () => void;
  onKeepEditing: () => void;
};

export default function DesignAddedToast({
  open,
  copy,
  onViewOnShirt,
  onCheckPrice,
  onKeepEditing,
}: DesignAddedToastProps) {
  if (!open) {
    return null;
  }

  const labels = {
    ariaLabel: 'Design added',
    eyebrow: 'Design ready',
    title: 'Design added to your T-shirt',
    text: 'You can move it on the shirt, choose a preset placement, or check the price.',
    viewOnShirt: 'View on shirt',
    checkPrice: 'Check price',
    keepEditing: 'Keep editing',
    ...copy,
  };

  return (
    <aside
      className="design-added-toast"
      role="status"
      aria-live="polite"
      aria-label={labels.ariaLabel}
    >
      <div>
        <span>{labels.eyebrow}</span>
        <strong>{labels.title}</strong>
        <p>{labels.text}</p>
      </div>

      <div className="design-added-toast-actions">
        <button type="button" onClick={onViewOnShirt}>
          {labels.viewOnShirt}
        </button>
        <button type="button" onClick={onCheckPrice}>
          {labels.checkPrice}
        </button>
        <button type="button" onClick={onKeepEditing}>
          {labels.keepEditing}
        </button>
      </div>
    </aside>
  );
}
