"use client";

import type { ChangeEvent } from 'react';

type UploadOwnDesignPanelProps = {
  fileName: string | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export default function UploadOwnDesignPanel({
  fileName,
  onFileChange,
}: UploadOwnDesignPanelProps) {
  return (
    <section className="design-path-panel">
      <div className="design-path-header">
        <span>Bring your own design</span>
        <h3>Already have a logo?</h3>
        <p>
          Upload PNG, JPG or SVG. We&apos;ll preview it on the shirt and check whether it is suitable for embroidery.
        </p>
      </div>

      <label className="stitchra-upload-box">
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
        />
        <span className="stitchra-upload-icon" aria-hidden="true">
          <i />
        </span>
        <span className="stitchra-upload-button">Choose logo</span>
        <span className="stitchra-upload-copy">
          {fileName ?? 'PNG, JPG or SVG recommended'}
        </span>
      </label>

      {fileName && (
        <p className="upload-ready-status">Logo ready for preview</p>
      )}
    </section>
  );
}
