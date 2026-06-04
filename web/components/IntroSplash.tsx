'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import StitchraLogo from '@/components/brand/StitchraLogo';
import styles from './IntroSplash.module.css';

const INTRO_STORAGE_KEY = 'stitchra_intro_seen';

export default function IntroSplash() {
  const [visible, setVisible] = useState(true);
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
    try {
      if (window.sessionStorage.getItem(INTRO_STORAGE_KEY) === 'true') {
        setVisible(false);
        return;
      }
    } catch {
      // If storage is unavailable, show the intro for this page load.
    }

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
          <div className={styles.mannequin}>
            <div className={styles.head} />
            <div className={styles.neck} />
            <div className={styles.shirtStage}>
              <div className={styles.sleeveLeft} />
              <div className={styles.sleeveRight} />
              <div className={styles.shirtBody}>
                <div className={styles.chestLogo}>
                  <StitchraLogo compact markOnly monochrome size={44} />
                </div>
              </div>
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
            AI embroidery preview · clear quote · production-ready artwork
          </p>
        </div>
      </div>
    </section>
  );
}
