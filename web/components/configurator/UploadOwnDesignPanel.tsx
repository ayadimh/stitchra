"use client";

import type { ChangeEvent } from 'react';

type UploadOwnDesignPanelProps = {
  fileName: string | null;
  canCleanBackground: boolean;
  isCleaningBackground: boolean;
  cleanupStatus: string;
  errorMessage?: string;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCleanBackground: () => void;
  onViewOnShirt?: () => void;
};

export default function UploadOwnDesignPanel({
  fileName,
  canCleanBackground,
  isCleaningBackground,
  cleanupStatus,
  errorMessage,
  onFileChange,
  onCleanBackground,
  onViewOnShirt,
}: UploadOwnDesignPanelProps) {
  return (
    <section className="design-path-panel">
      <div className="design-path-header">
        <span>Upload path</span>
        <h3>Bring your own design</h3>
        <p>
          Upload PNG, JPG or SVG. We’ll preview it on the shirt and check whether it is suitable for embroidery.
        </p>
      </div>

      <label className="stitchra-upload-box">
        <input
          type="file"
          accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
          onChange={onFileChange}
        />
        <span className="stitchra-upload-icon" aria-hidden="true">
          <i />
        </span>
        <span className="stitchra-upload-button">Choose logo</span>
        <span className="stitchra-upload-copy">
          {fileName ?? 'PNG, JPG or SVG · max 10 MB'}
        </span>
      </label>

      <div className="upload-trust-row" aria-label="Accepted logo file types">
        <span>PNG</span>
        <span>JPG</span>
        <span>SVG</span>
        <span>Max 10 MB</span>
      </div>

      {fileName && (
        <div className="upload-ready-row">
          <p className="upload-ready-status">Logo ready for preview</p>
          {onViewOnShirt && (
            <button
              type="button"
              className="upload-view-button"
              onClick={onViewOnShirt}
            >
              View on shirt
            </button>
          )}
          {canCleanBackground && (
            <button
              type="button"
              className="upload-clean-button"
              onClick={onCleanBackground}
              disabled={isCleaningBackground}
            >
              {isCleaningBackground ? 'Cleaning...' : 'Remove background'}
            </button>
          )}
        </div>
      )}

      {cleanupStatus && (
        <p className="upload-cleanup-status">{cleanupStatus}</p>
      )}

      {errorMessage && (
        <p className="upload-error-message">{errorMessage}</p>
      )}
    </section>
  );
}
