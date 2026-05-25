"use client";

type DesignAddedToastProps = {
  open: boolean;
  onViewOnShirt: () => void;
  onCheckPrice: () => void;
  onKeepEditing: () => void;
};

export default function DesignAddedToast({
  open,
  onViewOnShirt,
  onCheckPrice,
  onKeepEditing,
}: DesignAddedToastProps) {
  if (!open) {
    return null;
  }

  return (
    <aside
      className="design-added-toast"
      role="status"
      aria-live="polite"
      aria-label="Design added"
    >
      <div>
        <span>Design ready</span>
        <strong>Design added to your T-shirt</strong>
        <p>
          You can move it on the shirt, choose a preset placement, or check the price.
        </p>
      </div>

      <div className="design-added-toast-actions">
        <button type="button" onClick={onViewOnShirt}>
          View on shirt
        </button>
        <button type="button" onClick={onCheckPrice}>
          Check price
        </button>
        <button type="button" onClick={onKeepEditing}>
          Keep editing
        </button>
      </div>
    </aside>
  );
}
