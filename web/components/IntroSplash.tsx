'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import StitchraLogo from '@/components/brand/StitchraLogo';
import styles from './IntroSplash.module.css';

const INTRO_STORAGE_KEY = 'stitchra_intro_seen';
const SHIRT_MOCKUP_SRC = '/mockups/shirts/shirt-front-black.png';

function shouldShowIntro() {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.sessionStorage.getItem(INTRO_STORAGE_KEY) !== 'true';
  } catch {
    return true;
  }
}

export default function IntroSplash() {
  const [visible, setVisible] = useState(() => shouldShowIntro());
  const enterButtonRef = useRef<HTMLButtonElement | null>(null);

  const dismiss = useCallback(() => {
    try {
      window.sessionStorage.setItem(INTRO_STORAGE_KEY, 'true');
    } catch {
      // Storage can be unavailable in strict browser privacy modes.
    }

    setVisible(false);
  }, []);

  useEffect(() => {
    enterButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dismiss, visible]);

  if (!visible) {
    return null;
  }

  return (
    <section
      className={styles.overlay}
      aria-label="Stitchra intro"
      role="dialog"
      aria-modal="true"
      onClick={dismiss}
    >
      <div className={styles.panel} onClick={(event) => event.stopPropagation()}>
        <div className={styles.visual} aria-hidden="true">
          <div className={styles.shirtPreview}>
            <div className={styles.shirtHalo} />
            <div className={styles.shirtFrame}>
              <Image
                src={SHIRT_MOCKUP_SRC}
                alt=""
                width={520}
                height={620}
                priority
                sizes="(max-width: 760px) 72vw, 420px"
                className={styles.shirtImage}
              />
              <div className={styles.chestLogo}>
                <StitchraLogo compact markOnly monochrome size={48} />
              </div>
            </div>
            <div className={styles.previewPlate}>
              <span>premium stitched finish</span>
              <strong>clear price before stitching</strong>
            </div>
            <div className={styles.shadow} />
          </div>
        </div>

        <div className={styles.copy}>
          <div className={styles.brand}>
            <StitchraLogo compact size={44} showSubtitle={false} />
          </div>
          <p className={styles.badge}>STITCHRA</p>
          <h1>Your logo, ready to be stitched.</h1>
          <p className={styles.subline}>
            Preview the finish before the first stitch is made.
          </p>
          <button
            ref={enterButtonRef}
            type="button"
            className={styles.enterButton}
            onClick={dismiss}
          >
            Enter Stitchra
          </button>
          <p className={styles.detailLine}>
            artwork preview · clean embroidery result · ready for production
          </p>
        </div>
      </div>
    </section>
  );
}
