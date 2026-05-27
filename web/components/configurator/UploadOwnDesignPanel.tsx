"use client";

import type { ChangeEvent } from 'react';

type UploadOwnDesignPanelProps = {
  fileName: string | null;
  canCleanBackground: boolean;
  isCleaningBackground: boolean;
  cleanupStatus: string;
  errorMessage?: string;
  copy?: {
    eyebrow: string;
    title: string;
    subtitle: string;
    chooseLogo: string;
    fileHint: string;
    ready: string;
    viewOnShirt: string;
    removeBackground: string;
    cleaning: string;
    maxSize: string;
  };
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCleanBackground: () => void;
  onViewOnShirt?: () => void;
};

const defaultCopy: NonNullable<UploadOwnDesignPanelProps['copy']> = {
  eyebrow: 'Upload path',
  title: 'Bring your own design',
  subtitle:
    'Upload PNG, JPG or SVG. We’ll preview it on the shirt and check whether it is suitable for embroidery.',
  chooseLogo: 'Choose logo',
  fileHint: 'PNG, JPG or SVG · max 10 MB',
  ready: 'Logo ready for preview',
  viewOnShirt: 'View on shirt',
  removeBackground: 'Remove background',
  cleaning: 'Cleaning...',
  maxSize: 'Max 10 MB',
};

export default function UploadOwnDesignPanel({
  fileName,
  canCleanBackground,
  isCleaningBackground,
  cleanupStatus,
  errorMessage,
  copy = defaultCopy,
  onFileChange,
  onCleanBackground,
  onViewOnShirt,
}: UploadOwnDesignPanelProps) {
  return (
    <section className="design-path-panel">
      <div className="design-path-header">
        <span>{copy.eyebrow}</span>
        <h3>{copy.title}</h3>
        <p>{copy.subtitle}</p>
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
        <span className="stitchra-upload-button">{copy.chooseLogo}</span>
        <span className="stitchra-upload-copy">
          {fileName ?? copy.fileHint}
        </span>
      </label>

      <div className="upload-trust-row" aria-label="Accepted logo file types">
        <span>PNG</span>
        <span>JPG</span>
        <span>SVG</span>
        <span>{copy.maxSize}</span>
      </div>

      {fileName && (
        <div className="upload-ready-row">
          <p className="upload-ready-status">{copy.ready}</p>
          {onViewOnShirt && (
            <button
              type="button"
              className="upload-view-button"
              onClick={onViewOnShirt}
            >
              {copy.viewOnShirt}
            </button>
          )}
          {canCleanBackground && (
            <button
              type="button"
              className="upload-clean-button"
              onClick={onCleanBackground}
              disabled={isCleaningBackground}
            >
              {isCleaningBackground ? copy.cleaning : copy.removeBackground}
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
