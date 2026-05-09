'use client';

import Image from 'next/image';
import type {
  CSSProperties,
  PointerEvent,
  ReactNode,
} from 'react';
import { useMemo, useState } from 'react';

const API =
  process.env.NEXT_PUBLIC_API_URL ??
  'https://stitchra-production.up.railway.app';

type Estimate = {
  stitches: number;
  colors: number;
  coverage: number;
  price_eur: number;
  width_mm: number;
  height_mm: number;
};

type LogoAnalysis = {
  processed_png: string;
  colors_count: number;
  dominant_colors: Array<{
    hex: string;
    rgb: number[];
    percentage: number;
  }>;
  contrast_score: number;
  embroidery_ready: boolean;
  warnings: string[];
  recommendations: string[];
};

type Placement = 'left' | 'center';
type TeeColor = 'black' | 'white';

const placementPresets = {
  left: {
    label: 'Left chest',
    size: '90 × 60 mm',
  },
  center: {
    label: 'Center front',
    size: '250 × 200 mm',
  },
} as const;

async function dataUrlToFile(
  dataUrl: string,
  originalName: string
) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const baseName =
    originalName.replace(/\.[^/.]+$/, '') ||
    'logo';

  return new File(
    [blob],
    `${baseName}-processed.png`,
    {
      type: 'image/png',
    }
  );
}

export default function Home() {
  const [placement, setPlacement] = useState<Placement>('left');
  const [teeColor, setTeeColor] = useState<TeeColor>('black');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [logoAnalysis, setLogoAnalysis] =
    useState<LogoAnalysis | null>(null);

  const [logoPrompt, setLogoPrompt] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const bg = useMemo(
    () =>
      `
      radial-gradient(circle at 15% 20%, rgba(0,255,136,0.16), transparent 25%),
      radial-gradient(circle at 85% 10%, rgba(0,200,255,0.14), transparent 28%),
      radial-gradient(circle at 50% 100%, rgba(255,0,200,0.11), transparent 35%),
      radial-gradient(circle at 78% 70%, rgba(0,255,240,0.08), transparent 30%),
      #050607
    `,
    []
  );

  const preset = placementPresets[placement];

  const onFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0] ?? null;

    setFile(selectedFile);
    setEstimate(null);
    setLogoAnalysis(null);
    setStatus('');
    setError('');

    if (!selectedFile) {
      setPreview(null);
      return;
    }

    setPreview(URL.createObjectURL(selectedFile));
    setIsAnalyzing(true);
    setStatus('Analyzing logo...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('tee_color', teeColor);

      const response = await fetch(`${API}/analyze_logo`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        setStatus(
          'Logo uploaded — automatic cleanup unavailable.'
        );
        return;
      }

      const analysis =
        (await response.json()) as LogoAnalysis;
      const processedFile = await dataUrlToFile(
        analysis.processed_png,
        selectedFile.name
      );

      setFile(processedFile);
      setPreview(analysis.processed_png);
      setLogoAnalysis(analysis);
      setStatus(
        analysis.embroidery_ready
          ? 'Logo cleaned and embroidery-ready.'
          : 'Logo cleaned — review the recommendations.'
      );
    } catch {
      setStatus(
        'Logo uploaded — automatic cleanup unavailable.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateLogo = async () => {
    setError('');
    setStatus('');

    if (!logoPrompt.trim()) {
      setError('Describe your logo first.');
      return;
    }

    setIsGenerating(true);

    try {
      const fd = new FormData();
      fd.append('prompt', logoPrompt);

      const res = await fetch(`${API}/generate_logo`, {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        setError('Generator failed.');
        return;
      }

      const blob = await res.blob();

      const generatedFile = new File([blob], 'logo.png', {
        type: 'image/png',
      });

      setFile(generatedFile);
      setPreview(URL.createObjectURL(blob));
      setLogoAnalysis(null);

      setStatus('AI logo generated.');
    } catch {
      setError('Network error.');
    } finally {
      setIsGenerating(false);
    }
  };

  const estimatePrice = async () => {
    setError('');
    setStatus('');

    if (!file) {
      setError('Upload a logo first.');
      return;
    }

    setIsEstimating(true);

    try {
      const fd = new FormData();

      fd.append('file', file);

      fd.append(
        'width_mm',
        placement === 'left' ? '90' : '250'
      );

      fd.append(
        'height_mm',
        placement === 'left' ? '60' : '200'
      );

      fd.append('colors', '3');

      const res = await fetch(`${API}/estimate`, {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        setError('Estimator failed.');
        return;
      }

      const data = await res.json();

      setEstimate(data);

      setStatus('Quote ready.');
    } catch {
      setError('Network error.');
    } finally {
      setIsEstimating(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: bg,
        color: '#f5f7f8',
        fontFamily:
          'var(--font-geist-sans), Inter, "Avenir Next", "Helvetica Neue", Arial, sans-serif',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <BackgroundEffects />
      <GlobalVisualStyles />

      <Header />

      <section
        id="hero"
        style={{
          minHeight: '100svh',
          padding: '124px 24px 90px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <style>
          {`
            @keyframes heroAtelierFloat {
              0%, 100% { transform: translate3d(0, 0, 0); }
              50% { transform: translate3d(0, -10px, 0); }
            }

            @keyframes heroAtelierBreath {
              0%, 100% { transform: translateX(-50%) translateZ(62px) scale3d(1, 1, 1); filter: brightness(1); }
              50% { transform: translateX(-50%) translateZ(62px) scale3d(1.008, 1.006, 1); filter: brightness(1.035); }
            }

            @keyframes heroAtelierSheen {
              0%, 100% { opacity: 0.18; transform: translateX(-34px) skewX(-10deg); }
              50% { opacity: 0.36; transform: translateX(36px) skewX(-10deg); }
            }

            @keyframes heroAtelierThread {
              from { background-position: 0 0; }
              to { background-position: 64px 64px; }
            }

            @keyframes heroAtelierPulse {
              0%, 100% { box-shadow: 0 0 18px rgba(177,255,202,0.28), 0 0 58px rgba(177,255,202,0.10), inset 0 0 22px rgba(255,255,255,0.08); }
              50% { box-shadow: 0 0 26px rgba(177,255,202,0.38), 0 0 72px rgba(177,255,202,0.14), inset 0 0 28px rgba(255,255,255,0.11); }
            }

            @keyframes heroMachineFloat {
              0%, 100% { transform: translate3d(0, 0, 0) rotateX(0deg); }
              50% { transform: translate3d(0, -12px, 0) rotateX(1.2deg); }
            }

            .hero-atelier {
              position: relative;
              max-width: 1360px;
              margin: 0 auto;
              display: grid;
              grid-template-columns: minmax(0, 0.84fr) minmax(460px, 1.16fr);
              gap: 64px;
              align-items: center;
            }

            .hero-copy-panel {
              position: relative;
              padding: clamp(34px, 4.4vw, 58px);
              border-radius: 34px;
              border: 1px solid rgba(185,255,204,0.12);
              background:
                radial-gradient(circle at 4% 20%, rgba(0,255,136,0.13), transparent 30%),
                radial-gradient(circle at 94% 72%, rgba(0,200,255,0.10), transparent 31%),
                linear-gradient(145deg, rgba(18,21,22,0.70), rgba(4,6,7,0.94) 58%, rgba(13,15,18,0.78));
              box-shadow:
                0 42px 130px rgba(0,0,0,0.54),
                0 0 0 1px rgba(255,255,255,0.015),
                inset 0 1px 0 rgba(255,255,255,0.08);
              backdrop-filter: blur(24px);
            }

            .hero-copy-panel::before {
              content: "";
              position: absolute;
              inset: 1px;
              border-radius: inherit;
              pointer-events: none;
              background:
                linear-gradient(120deg, rgba(255,255,255,0.14), transparent 24%, transparent 68%, rgba(0,200,255,0.10));
              opacity: 0.65;
            }

            .hero-copy-panel > * {
              position: relative;
              z-index: 1;
            }

            .hero-kicker {
              display: inline-flex;
              align-items: center;
              gap: 10px;
              padding: 9px 13px;
              margin-bottom: 26px;
              border: 1px solid rgba(213,255,223,0.22);
              border-radius: 999px;
              background: rgba(185,255,204,0.06);
              color: rgba(214,255,229,0.88);
              font-size: 11px;
              font-weight: 750;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .hero-kicker-dot {
              width: 7px;
              height: 7px;
              border-radius: 999px;
              background: #b9ffcc;
              box-shadow: 0 0 18px rgba(185,255,204,0.72);
            }

            .hero-title {
              max-width: 720px;
              margin: 0 0 26px;
              font-size: clamp(58px, 7.4vw, 108px);
              line-height: 0.91;
              letter-spacing: -0.045em;
              font-weight: 950;
              color: #f6f3eb;
            }

            .hero-title-accent {
              display: block;
              color: transparent;
              background: linear-gradient(90deg, #00ff88, #00d7ff 58%, #d36bff);
              -webkit-background-clip: text;
              background-clip: text;
              text-shadow: 0 0 34px rgba(0,255,136,0.20);
            }

            .hero-subcopy {
              max-width: 620px;
              margin: 0 0 36px;
              color: rgba(246,243,235,0.70);
              font-size: clamp(17px, 1.35vw, 20px);
              line-height: 1.68;
            }

            .hero-actions {
              display: flex;
              gap: 14px;
              flex-wrap: wrap;
              margin-bottom: 32px;
            }

            .hero-proof-strip {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 10px;
            }

            .hero-proof-item {
              min-height: 72px;
              padding: 15px;
              border-radius: 20px;
              border: 1px solid rgba(255,255,255,0.09);
              background:
                linear-gradient(145deg, rgba(255,255,255,0.065), rgba(255,255,255,0.025));
              box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
            }

            .hero-proof-label {
              margin-bottom: 6px;
              color: rgba(246,243,235,0.48);
              font-size: 11px;
              letter-spacing: 0.09em;
              text-transform: uppercase;
            }

            .hero-proof-value {
              color: rgba(246,243,235,0.88);
              font-size: 14px;
              font-weight: 720;
            }

            .hero-preview-card {
              --hero-rotate-x: 0deg;
              --hero-rotate-y: 0deg;
              --hero-shift-x: 0px;
              --hero-shift-y: 0px;
              --hero-light-x: 46%;
              --hero-light-y: 18%;
              position: relative;
              min-height: 692px;
              overflow: visible;
              border: 1px solid rgba(255,255,255,0.11);
              border-radius: 38px;
              background:
                radial-gradient(circle at 64% 22%, rgba(0,255,136,0.10), transparent 24%),
                linear-gradient(145deg, rgba(17,19,20,0.96), rgba(5,6,7,0.98) 58%, rgba(7,17,18,0.97));
              box-shadow:
                0 50px 150px rgba(0,0,0,0.68),
                inset 0 1px 0 rgba(255,255,255,0.09);
              isolation: isolate;
              perspective: 1200px;
              transition:
                border-color 220ms ease,
                box-shadow 220ms ease,
                background 220ms ease;
            }

            .hero-preview-card:hover {
              border-color: rgba(226,255,235,0.22);
              box-shadow:
                0 58px 165px rgba(0,0,0,0.72),
                inset 0 1px 0 rgba(255,255,255,0.11);
            }

            .hero-preview-card::before {
              content: "";
              position: absolute;
              inset: -32px;
              background:
                radial-gradient(circle at var(--hero-light-x) var(--hero-light-y), rgba(0,255,136,0.28), transparent 30%),
                radial-gradient(circle at 74% 74%, rgba(0,200,255,0.16), transparent 36%),
                radial-gradient(circle at 20% 82%, rgba(255,55,212,0.11), transparent 35%);
              filter: blur(26px);
              opacity: 0.78;
              transform: translate3d(var(--hero-shift-x), var(--hero-shift-y), 0);
              transition: transform 160ms ease-out;
              pointer-events: none;
              z-index: -1;
            }

            .hero-preview-card::after {
              content: "";
              position: absolute;
              inset: 0;
              border-radius: inherit;
              background:
                linear-gradient(120deg, rgba(255,255,255,0.10), transparent 22%, transparent 62%, rgba(0,255,136,0.08)),
                linear-gradient(rgba(255,255,255,0.026) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.026) 1px, transparent 1px);
              background-size: auto, 50px 50px, 50px 50px;
              mask-image: radial-gradient(circle at 52% 45%, black, transparent 78%);
              opacity: 0.82;
              pointer-events: none;
              z-index: 0;
            }

            .hero-editorial-stage {
              position: absolute;
              inset: 78px 34px 138px;
              display: grid;
              grid-template-columns: minmax(0, 1fr) 188px;
              gap: 16px;
              transform: rotateX(var(--hero-rotate-x)) rotateY(var(--hero-rotate-y));
              transform-style: preserve-3d;
              transition: transform 180ms ease-out;
              z-index: 2;
              animation: heroMachineFloat 7s ease-in-out infinite;
            }

            .hero-photo-panel,
            .hero-mini-photo-card,
            .hero-fabric-note {
              position: relative;
              overflow: hidden;
              border: 1px solid rgba(255,255,255,0.12);
              background: rgba(255,255,255,0.045);
              box-shadow:
                0 34px 95px rgba(0,0,0,0.50),
                inset 0 1px 0 rgba(255,255,255,0.11);
            }

            .hero-photo-panel {
              grid-row: 1 / span 2;
              min-height: 452px;
              border-radius: 30px;
            }

            .hero-photo-panel::before,
            .hero-mini-photo-card::before {
              content: "";
              position: absolute;
              inset: 0;
              z-index: 1;
              pointer-events: none;
              background:
                linear-gradient(180deg, rgba(2,3,4,0.00), rgba(2,3,4,0.28) 44%, rgba(2,3,4,0.86)),
                radial-gradient(circle at var(--hero-light-x) var(--hero-light-y), rgba(255,255,255,0.23), transparent 30%),
                radial-gradient(circle at 76% 76%, rgba(0,255,136,0.16), transparent 32%);
            }

            .hero-photo-panel::after,
            .hero-mini-photo-card::after {
              content: "";
              position: absolute;
              inset: 0;
              z-index: 2;
              pointer-events: none;
              background:
                linear-gradient(rgba(255,255,255,0.030) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
              background-size: 42px 42px;
              mix-blend-mode: overlay;
              opacity: 0.72;
            }

            .hero-photo-image {
              filter: saturate(0.88) contrast(1.08) brightness(0.78);
              transform: scale(1.04);
            }

            .hero-photo-caption {
              position: absolute;
              left: 22px;
              right: 22px;
              bottom: 22px;
              z-index: 4;
              padding: 18px;
              border-radius: 20px;
              border: 1px solid rgba(255,255,255,0.13);
              background: rgba(3,5,6,0.68);
              backdrop-filter: blur(18px);
              box-shadow: 0 18px 58px rgba(0,0,0,0.36);
            }

            .hero-photo-caption span,
            .hero-fabric-note span {
              display: block;
              margin-bottom: 6px;
              color: #00d7ff;
              font-size: 11px;
              font-weight: 860;
              letter-spacing: 0.12em;
              text-transform: uppercase;
            }

            .hero-photo-caption strong,
            .hero-fabric-note strong {
              display: block;
              color: #f6f3eb;
              font-size: 18px;
              line-height: 1.24;
            }

            .hero-preview-logo {
              position: absolute;
              top: 26px;
              right: 24px;
              z-index: 4;
              width: 96px;
              height: 66px;
              border-radius: 18px;
              border: 1px solid rgba(185,255,204,0.32);
              background: rgba(2,5,5,0.42);
              box-shadow:
                0 0 40px rgba(0,255,136,0.18),
                inset 0 0 24px rgba(0,255,136,0.07);
              backdrop-filter: blur(10px);
              overflow: hidden;
            }

            .hero-preview-logo::after {
              content: "";
              position: absolute;
              inset: 0;
              background:
                repeating-linear-gradient(90deg, rgba(255,255,255,0.14) 0 1px, transparent 1px 5px);
              opacity: 0.16;
              pointer-events: none;
              mix-blend-mode: screen;
            }

            .hero-side-stack {
              display: grid;
              grid-template-rows: 1fr 1fr;
              gap: 16px;
            }

            .hero-mini-photo-card {
              min-height: 218px;
              border-radius: 26px;
            }

            .hero-mini-photo-card .hero-mini-copy {
              position: absolute;
              left: 16px;
              right: 16px;
              bottom: 16px;
              z-index: 4;
            }

            .hero-mini-photo-card span {
              color: #00ff88;
              font-size: 11px;
              font-weight: 860;
              letter-spacing: 0.12em;
              text-transform: uppercase;
            }

            .hero-mini-photo-card strong {
              display: block;
              margin-top: 6px;
              color: #f6f3eb;
              font-size: 16px;
              line-height: 1.24;
            }

            .hero-fabric-note {
              grid-column: 1 / -1;
              min-height: 86px;
              padding: 18px 20px;
              border-radius: 22px;
              background:
                radial-gradient(circle at 18% 20%, rgba(0,255,136,0.12), transparent 34%),
                radial-gradient(circle at 82% 74%, rgba(0,215,255,0.12), transparent 34%),
                rgba(255,255,255,0.045);
            }

            .hero-fabric-note strong {
              font-size: 15px;
            }


            .hero-ai-badge,
            .hero-studio-toolbar,
            .hero-placement-callout,
            .hero-floating-quote {
              position: absolute;
              z-index: 5;
              border: 1px solid rgba(255,255,255,0.12);
              background: rgba(6,7,8,0.68);
              box-shadow: 0 22px 68px rgba(0,0,0,0.42);
              backdrop-filter: blur(18px);
            }

            .hero-ai-badge {
              top: 28px;
              right: 28px;
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 12px 14px;
              border-radius: 18px;
            }

            .hero-ai-icon {
              width: 36px;
              height: 36px;
              display: grid;
              place-items: center;
              border-radius: 13px;
              background: linear-gradient(135deg, #00ff88, #00c8ff 58%, #ff28d6);
              color: #04100a;
              font-weight: 900;
            }

            .hero-studio-toolbar {
              top: 28px;
              left: 28px;
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 10px 12px;
              border-radius: 999px;
              color: rgba(245,247,248,0.72);
              font-size: 12px;
              font-weight: 760;
            }

            .hero-window-dot {
              width: 9px;
              height: 9px;
              border-radius: 999px;
              background: #00ff88;
              box-shadow: 0 0 16px currentColor;
            }

            .hero-window-dot:nth-child(2) {
              background: #00c8ff;
            }

            .hero-window-dot:nth-child(3) {
              background: #ff28d6;
            }

            .hero-placement-callout {
              left: 50%;
              bottom: 32px;
              transform: translateX(-50%);
              min-width: 292px;
              display: flex;
              align-items: center;
              gap: 13px;
              padding: 14px 16px;
              border-radius: 20px;
            }

            .hero-floating-quote {
              right: 30px;
              bottom: 90px;
              display: grid;
              gap: 2px;
              padding: 13px 15px;
              border-radius: 18px;
              color: rgba(245,247,248,0.76);
            }

            .hero-floating-quote strong {
              color: #00ff88;
              font-size: 19px;
            }

            .hero-callout-icon {
              width: 44px;
              height: 44px;
              display: grid;
              place-items: center;
              border-radius: 15px;
              background: linear-gradient(135deg, rgba(0,255,136,0.94), rgba(0,200,255,0.94));
              color: #04100a;
              font-weight: 950;
            }

            .hero-stage {
              position: absolute;
              left: 50%;
              top: 74px;
              width: min(452px, 88%);
              height: 536px;
              transform: translateX(-50%) rotateX(var(--hero-rotate-x)) rotateY(var(--hero-rotate-y));
              transform-style: preserve-3d;
              transition: transform 180ms ease-out;
              z-index: 2;
            }

            .hero-float {
              position: absolute;
              inset: 0;
              animation: heroAtelierFloat 7s ease-in-out infinite;
              transform-style: preserve-3d;
            }

            .hero-sleeve-left,
            .hero-sleeve-right {
              position: absolute;
              top: 126px;
              width: 130px;
              height: 258px;
              box-shadow:
                inset 18px 22px 32px rgba(255,255,255,0.07),
                inset -24px -32px 48px rgba(0,0,0,0.48),
                0 32px 72px rgba(0,0,0,0.44);
            }

            .hero-sleeve-left {
              left: 16px;
              border-radius: 54px 22px 44px 70px;
              clip-path: polygon(42% 0, 100% 15%, 78% 100%, 18% 91%, 0 24%);
              transform: rotate(6deg) translateZ(18px);
            }

            .hero-sleeve-right {
              right: 16px;
              border-radius: 22px 54px 70px 44px;
              clip-path: polygon(0 15%, 58% 0, 100% 24%, 82% 91%, 22% 100%);
              transform: rotate(-6deg) translateZ(18px);
            }

            .hero-shirt-body {
              position: absolute;
              left: 50%;
              top: 62px;
              width: 344px;
              height: 448px;
              overflow: hidden;
              border-radius: 94px 94px 42px 42px / 88px 88px 34px 34px;
              clip-path: polygon(17% 0, 35% 0, 42% 12%, 58% 12%, 65% 0, 83% 0, 98% 22%, 87% 100%, 13% 100%, 2% 22%);
              animation: heroAtelierBreath 6.4s ease-in-out infinite;
            }

            .hero-shirt-body::before {
              content: "";
              position: absolute;
              inset: 0;
              background-image:
                linear-gradient(104deg, transparent 0%, rgba(255,255,255,0.15) 17%, transparent 32%),
                repeating-linear-gradient(90deg, rgba(255,255,255,0.032) 0 1px, transparent 1px 8px),
                repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 10px);
              animation: heroAtelierSheen 9s ease-in-out infinite;
              pointer-events: none;
            }

            .hero-shirt-body::after {
              content: "";
              position: absolute;
              inset: 0;
              background: radial-gradient(circle at 36% 20%, rgba(255,255,255,0.18), transparent 24%), radial-gradient(circle at 78% 78%, rgba(0,0,0,0.34), transparent 38%);
              pointer-events: none;
            }

            .hero-collar {
              position: absolute;
              left: 50%;
              top: 0;
              width: 112px;
              height: 64px;
              transform: translateX(-50%);
              border-radius: 0 0 999px 999px;
              background: linear-gradient(180deg, rgba(0,0,0,0.78), rgba(0,0,0,0.36));
              box-shadow:
                0 10px 24px rgba(0,0,0,0.40),
                inset 0 -9px 16px rgba(255,255,255,0.05);
            }

            .hero-placement-box {
              position: absolute;
              transform: translateX(-50%);
              display: grid;
              place-items: center;
              overflow: hidden;
              border: 1px solid rgba(185,255,204,0.78);
              border-radius: 16px;
              background: linear-gradient(135deg, rgba(185,255,204,0.10), rgba(0,0,0,0.10));
              animation: heroAtelierPulse 3.8s ease-in-out infinite;
              z-index: 2;
            }

            .hero-placement-box.has-logo {
              background: transparent;
            }

            .hero-placement-box::before {
              content: "";
              position: absolute;
              inset: 0;
              background-image: linear-gradient(45deg, rgba(185,255,204,0.14) 25%, transparent 25%, transparent 50%, rgba(185,255,204,0.14) 50%, rgba(185,255,204,0.14) 75%, transparent 75%, transparent);
              background-size: 16px 16px;
              animation: heroAtelierThread 8s linear infinite;
              opacity: 0.22;
              pointer-events: none;
              z-index: 0;
            }

            .hero-placement-box.has-logo::before {
              opacity: 0.10;
            }

            .hero-status-pill,
            .hero-material-pill {
              position: absolute;
              z-index: 4;
              display: inline-flex;
              align-items: center;
              gap: 10px;
              border: 1px solid rgba(255,255,255,0.10);
              background: rgba(5,6,6,0.56);
              color: rgba(246,243,235,0.76);
              box-shadow: 0 18px 48px rgba(0,0,0,0.34);
              backdrop-filter: blur(16px);
            }

            .hero-status-pill {
              top: 22px;
              right: 22px;
              padding: 10px 15px;
              border-radius: 16px;
              font-size: 13px;
            }

            .hero-material-pill {
              top: 22px;
              left: 22px;
              padding: 10px 14px;
              border-radius: 999px;
              font-size: 13px;
            }

            .hero-swatch {
              width: 14px;
              height: 14px;
              border-radius: 50%;
            }

            .hero-spec-grid {
              position: absolute;
              left: 34px;
              right: 34px;
              bottom: 26px;
              z-index: 4;
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 12px;
            }

            .hero-spec-card {
              padding: 14px 12px;
              border: 1px solid rgba(255,255,255,0.10);
              border-radius: 18px;
              background:
                linear-gradient(145deg, rgba(255,255,255,0.070), rgba(255,255,255,0.030));
              text-align: center;
              backdrop-filter: blur(14px);
            }

            .hero-spec-label {
              margin-bottom: 4px;
              color: rgba(246,243,235,0.48);
              font-size: 11px;
            }

            .hero-spec-value {
              color: #f6f3eb;
              font-size: 13px;
              font-weight: 760;
            }

            @media (max-width: 980px) {
              .hero-atelier {
                grid-template-columns: 1fr;
                gap: 34px;
              }

              .hero-preview-card {
                min-height: 640px;
              }

              .hero-editorial-stage {
                inset: 84px 24px 132px;
              }
            }

            @media (max-width: 560px) {
              .hero-copy-panel {
                padding: 28px;
                border-radius: 24px;
              }

              .hero-title {
                font-size: clamp(42px, 13vw, 58px);
              }

              .hero-proof-strip,
              .hero-spec-grid {
                grid-template-columns: 1fr;
              }

              .hero-preview-card {
                min-height: 600px;
                border-radius: 28px;
              }

              .hero-status-pill {
                left: 22px;
                right: auto;
                top: 70px;
              }

              .hero-editorial-stage {
                inset: 92px 16px 138px;
                grid-template-columns: 1fr;
              }

              .hero-photo-panel {
                min-height: 292px;
                grid-row: auto;
              }

              .hero-side-stack,
              .hero-fabric-note {
                display: none;
              }

              .hero-ai-badge {
                left: 20px;
                right: 20px;
                top: 20px;
              }

              .hero-studio-toolbar {
                top: 72px;
                left: 20px;
              }

              .hero-floating-quote {
                display: none;
              }

              .hero-placement-callout {
                min-width: 0;
                width: calc(100% - 40px);
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .hero-float,
              .hero-shirt-body,
              .hero-shirt-body::before,
              .hero-placement-box,
              .hero-placement-box::before,
              .hero-editorial-stage {
                animation: none;
              }
            }
          `}
        </style>

        <div
          className="hero-atelier"
        >
          <div className="hero-copy-panel">
            <div className="hero-kicker">
              <span className="hero-kicker-dot" />
              AI embroidery atelier
            </div>

            <h1 className="hero-title">
              Design.
              <br />
              Preview.
              <span className="hero-title-accent">
                Stitch it right.
              </span>
            </h1>

            <p className="hero-subcopy">
              Turn a logo idea into a premium embroidered T-shirt. See the fabric, placement and price before the first stitch is made.
            </p>

            <div className="hero-actions">
              <a
                href="#designer"
                className="lux-button"
                style={primaryButton}
              >
                Start Designing →
              </a>

              <a
                href="#craft"
                className="lux-button"
                style={secondaryButton}
              >
                See Craft Quality
              </a>
            </div>

            <div className="hero-proof-strip">
              <div className="hero-proof-item">
                <div className="hero-proof-label">
                  Studio
                </div>
                <div className="hero-proof-value">
                  Premium finish
                </div>
              </div>

              <div className="hero-proof-item">
                <div className="hero-proof-label">
                  Artwork
                </div>
                <div className="hero-proof-value">
                  {preview ? 'Logo ready' : 'AI or upload'}
                </div>
              </div>

              <div className="hero-proof-item">
                <div className="hero-proof-label">
                  Quote
                </div>
                <div className="hero-proof-value">
                  Clear before production
                </div>
              </div>
            </div>
          </div>

          <div
            className="hero-preview-card"
            onPointerMove={(event) => {
              const rect =
                event.currentTarget.getBoundingClientRect();
              const x =
                (event.clientX - rect.left) /
                  rect.width -
                0.5;
              const y =
                (event.clientY - rect.top) /
                  rect.height -
                0.5;

              event.currentTarget.style.setProperty(
                '--hero-rotate-x',
                `${y * -4}deg`
              );
              event.currentTarget.style.setProperty(
                '--hero-rotate-y',
                `${x * 6}deg`
              );
              event.currentTarget.style.setProperty(
                '--hero-shift-x',
                `${x * -10}px`
              );
              event.currentTarget.style.setProperty(
                '--hero-shift-y',
                `${y * -9}px`
              );
              event.currentTarget.style.setProperty(
                '--hero-light-x',
                `${46 + x * 16}%`
              );
              event.currentTarget.style.setProperty(
                '--hero-light-y',
                `${18 + y * 12}%`
              );
            }}
            onPointerLeave={(event) => {
              event.currentTarget.style.setProperty(
                '--hero-rotate-x',
                '0deg'
              );
              event.currentTarget.style.setProperty(
                '--hero-rotate-y',
                '0deg'
              );
              event.currentTarget.style.setProperty(
                '--hero-shift-x',
                '0px'
              );
              event.currentTarget.style.setProperty(
                '--hero-shift-y',
                '0px'
              );
              event.currentTarget.style.setProperty(
                '--hero-light-x',
                '46%'
              );
              event.currentTarget.style.setProperty(
                '--hero-light-y',
                '18%'
              );
            }}
            style={
              {
                '--hero-rotate-x': '0deg',
                '--hero-rotate-y': '0deg',
                '--hero-shift-x': '0px',
                '--hero-shift-y': '0px',
                '--hero-light-x': '46%',
                '--hero-light-y': '18%',
              } as CSSProperties
            }
          >
            <div className="hero-studio-toolbar">
              <span className="hero-window-dot" />
              <span className="hero-window-dot" />
              <span className="hero-window-dot" />
              Textile studio
            </div>

            <div className="hero-ai-badge">
              <div className="hero-ai-icon">AI</div>
              <div>
                <div
                  style={{
                    color: '#f5f7f8',
                    fontWeight: 860,
                    marginBottom: 2,
                  }}
                >
                  Artwork ready
                </div>
                <div
                  style={{
                    color: 'rgba(245,247,248,0.56)',
                    fontSize: 12,
                  }}
                >
                  Clean preview for production
                </div>
              </div>
            </div>

            <div className="hero-editorial-stage">
              <div className="hero-photo-panel">
                <Image
                  src="/stitchra-needle-macro.jpg"
                  alt="Macro view of embroidery needles and fabric"
                  fill
                  priority
                  sizes="(max-width: 980px) 90vw, 560px"
                  className="hero-photo-image"
                  style={{
                    objectFit: 'cover',
                    objectPosition: 'center',
                  }}
                />

                {preview ? (
                  <div className="hero-preview-logo">
                    <Image
                      src={preview}
                      alt="Current logo preview"
                      fill
                      unoptimized
                      style={{
                        objectFit: 'contain',
                        padding: 9,
                        filter:
                          'contrast(1.18) saturate(1.18) drop-shadow(0 0 12px rgba(0,255,136,0.24))',
                      }}
                    />
                  </div>
                ) : null}

                <div className="hero-photo-caption">
                  <span>Macro production view</span>
                  <strong>
                    Needle, thread and fabric detail before the order starts.
                  </strong>
                </div>
              </div>

              <div className="hero-side-stack">
                <div className="hero-mini-photo-card">
                  <Image
                    src="/stitchra-stitching-detail.jpg"
                    alt="Close-up stitching detail on fabric"
                    fill
                    sizes="188px"
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center',
                    }}
                  />
                  <div className="hero-mini-copy">
                    <span>Stitch finish</span>
                    <strong>Clean edges and readable details.</strong>
                  </div>
                </div>

                <div className="hero-mini-photo-card">
                  <Image
                    src="/stitchra-thread-spools.jpg"
                    alt="Premium colorful embroidery thread"
                    fill
                    sizes="188px"
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center',
                    }}
                  />
                  <div className="hero-mini-copy">
                    <span>Thread palette</span>
                    <strong>Color directions for every idea.</strong>
                  </div>
                </div>
              </div>

              <div className="hero-fabric-note">
                <span>Fashion-tech workflow</span>
                <strong>
                  Create the idea, check the chest placement and quote with confidence.
                </strong>
              </div>
            </div>

            <div className="hero-placement-callout">
              <div className="hero-callout-icon">TEE</div>
              <div>
                <div
                  style={{
                    color: '#f5f7f8',
                    fontWeight: 860,
                  }}
                >
                  Chest Placement
                </div>
                <div
                  style={{
                    color: 'rgba(245,247,248,0.58)',
                    fontSize: 13,
                    marginTop: 3,
                  }}
                >
                  {preset.size} · live preview
                </div>
              </div>
            </div>

            <div className="hero-floating-quote">
              <span>Instant quote</span>
              <strong>{estimate ? `€${estimate.price_eur}` : '€22'}</strong>
            </div>

            <div className="hero-spec-grid">
              {[
                ['Artwork', preview ? 'Logo loaded' : 'AI-ready'],
                ['Colors', estimate ? String(estimate.colors) : 'Auto'],
                ['Stitches', estimate ? estimate.stitches.toLocaleString() : '12,450'],
              ].map(([labelText, value]) => (
                <div
                  key={labelText}
                  className="hero-spec-card"
                >
                  <div className="hero-spec-label">
                    {labelText}
                  </div>
                  <div className="hero-spec-value">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="designer"
        style={{
          padding: '96px 24px 128px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(380px,1fr))',
            gap: 32,
          }}
        >
          <HoverCard style={glassCard}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(3,minmax(0,1fr))',
                gap: 12,
                marginBottom: 22,
              }}
            >
              <Stat
                label="Production"
                value="Ready to Stitch"
              />

              <Stat
                label="Pricing"
                value="Clear Price"
              />

              <Stat
                label="Preview"
                value="Live Mockup"
              />
            </div>

            <div
              style={{
                display: 'grid',
                gap: 16,
              }}
            >
              <label style={label}>
                Choose placement
              </label>

              <select
                value={placement}
                onChange={(e) =>
                  setPlacement(
                    e.target.value ===
                      'center'
                      ? 'center'
                      : 'left'
                  )
                }
                style={input}
              >
                <option value="left">
                  Left chest
                </option>

                <option value="center">
                  Center front
                </option>
              </select>

              <label style={label}>
                Choose shirt color
              </label>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(2,minmax(0,1fr))',
                  gap: 12,
                }}
              >
                {(['black', 'white'] as const).map(
                  (color) => {
                    const active =
                      teeColor === color;

                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          setTeeColor(color)
                        }
                        style={{
                          minHeight: 54,
                          borderRadius: 16,
                          border: active
                            ? '1px solid rgba(0,255,136,0.78)'
                            : '1px solid rgba(255,255,255,0.12)',
                          background: active
                            ? 'rgba(0,255,136,0.12)'
                            : 'rgba(255,255,255,0.045)',
                          color: '#f5f7f8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 10,
                          fontWeight: 850,
                          cursor: 'pointer',
                        }}
                      >
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background:
                              color === 'black'
                                ? '#050607'
                                : '#f5f1e8',
                            border:
                              color === 'black'
                                ? '1px solid rgba(255,255,255,0.22)'
                                : '1px solid rgba(0,0,0,0.18)',
                            boxShadow: active
                              ? '0 0 18px rgba(0,255,136,0.35)'
                              : 'none',
                          }}
                        />
                        {color === 'black'
                          ? 'Black tee'
                          : 'White tee'}
                      </button>
                    );
                  }
                )}
              </div>

              <label style={label}>
                Upload your logo
              </label>

              <input
                className="stitchra-file-input"
                type="file"
                accept="image/*"
                onChange={onFile}
                style={{
                  color: '#fff',
                }}
              />

              <label style={label}>
                Create with AI
              </label>

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <input
                  value={logoPrompt}
                  onChange={(e) =>
                    setLogoPrompt(
                      e.target.value
                    )
                  }
                  aria-label="Logo idea prompt"
                  placeholder="minimal badge for a coffee brand"
                  style={{
                    ...input,
                    flex: 1,
                  }}
                />

                <button
                  onClick={generateLogo}
                  disabled={isGenerating}
                  className="lux-button"
                  style={{
                    ...primaryButton,
                    border: 'none',
                    minWidth: 180,
                  }}
                >
                  {isGenerating
                    ? 'Generating...'
                    : 'Generate'}
                </button>
              </div>

              <button
                onClick={estimatePrice}
                disabled={isEstimating || isAnalyzing}
                className="lux-button"
                style={{
                  ...primaryButton,
                  border: 'none',
                  width: '100%',
                }}
              >
                {isAnalyzing
                  ? 'Preparing logo...'
                  : isEstimating
                    ? 'Calculating...'
                    : 'Get instant price'}
              </button>

              {(status || error) && (
                <div
                  style={{
                    fontSize: 14,
                    color: error
                      ? '#ffb4b4'
                      : '#9dffc4',
                  }}
                >
                  {error || status}
                </div>
              )}

              {logoAnalysis && !error && (
                <div
                  style={{
                    display: 'grid',
                    gap: 8,
                    padding: 14,
                    borderRadius: 18,
                    border:
                      '1px solid rgba(255,255,255,0.10)',
                    background:
                      'rgba(255,255,255,0.045)',
                    color: 'rgba(245,247,248,0.78)',
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}
                  >
                    <strong
                      style={{
                        color:
                          logoAnalysis.embroidery_ready
                            ? '#9dffc4'
                            : '#ffe083',
                      }}
                    >
                      {logoAnalysis.embroidery_ready
                        ? 'Embroidery-ready'
                        : 'Needs review'}
                    </strong>
                    <span>
                      {logoAnalysis.colors_count} colors
                    </span>
                    <span>
                      Contrast {logoAnalysis.contrast_score}
                      /100
                    </span>
                  </div>

                  {logoAnalysis.warnings.length > 0 && (
                    <div>
                      {logoAnalysis.warnings
                        .slice(0, 2)
                        .join(' ')}
                    </div>
                  )}
                </div>
              )}

              {estimate && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit,minmax(120px,1fr))',
                    gap: 12,
                    marginTop: 12,
                  }}
                >
                  <Metric
                    label="Stitches"
                    value={estimate.stitches.toLocaleString()}
                  />

                  <Metric
                    label="Colors"
                    value={estimate.colors}
                  />

                  <Metric
                    label="Coverage"
                    value={`${(
                      estimate.coverage *
                      100
                    ).toFixed(1)}%`}
                  />

                  <Metric
                    label="Price"
                    value={`€${estimate.price_eur}`}
                  />
                </div>
              )}
            </div>
          </HoverCard>

          <DesignerPreview
            preview={preview}
            preset={preset}
            teeColor={teeColor}
          />
        </div>
      </section>

      <section id="how" style={sectionStyle}>
        <SectionHeader
          eyebrow="Simple process"
          title="From idea to finished piece"
          text="A calm flow for creators, students, clubs and small brands. Start with an idea, preview the shirt and quote before production."
        />

        <div style={fourGrid}>
          {processSteps.map((step) => (
            <StepCard
              key={step.number}
              number={step.number}
              icon={step.icon}
              title={step.title}
              text={step.text}
              accent={step.accent}
            />
          ))}
        </div>
      </section>

      <section id="features" style={sectionStyle}>
        <SectionHeader
          eyebrow="Studio tools"
          title="Everything feels ready to produce"
          text="AI design, logo cleanup, shirt preview and pricing in one premium embroidery workspace."
        />

        <div style={fourGrid}>
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              text={feature.text}
              accent={feature.accent}
              footer={feature.footer}
            />
          ))}
        </div>
      </section>

      <section id="craft" style={sectionStyle}>
        <div className="production-layout">
          <div>
            <div style={sectionEyebrow}>
              Craft quality
            </div>

            <h2 style={sectionTitle}>
              Built around fabric, thread and finish
            </h2>

            <p style={sectionText}>
              Premium embroidery starts before production. Stitchra helps customers understand how a logo will feel on cotton, how many colors it needs and whether the design is ready to stitch.
            </p>

            <div className="production-stat-grid">
              {craftStats.map((stat) => (
                <div
                  key={stat.label}
                  className="glow-card production-stat-card"
                  onPointerMove={setGlowPosition}
                  onPointerLeave={resetGlowPosition}
                >
                  <span>{stat.value}</span>
                  <small>{stat.label}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="production-bento">
            <div
              className="glow-card production-photo-card production-photo-main"
              onPointerMove={setGlowPosition}
              onPointerLeave={resetGlowPosition}
            >
              <Image
                src="/stitchra-stitching-detail.jpg"
                alt="Close-up of detailed stitching and texture"
                fill
                sizes="(max-width: 900px) 100vw, 620px"
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
              />
              <div className="production-photo-overlay" />
              <div className="production-photo-badge">
                <strong>Stitch detail</strong>
                <span>Readable artwork, clean texture</span>
              </div>
            </div>

            <div
              className="glow-card production-mini-card production-thread-card"
              onPointerMove={setGlowPosition}
              onPointerLeave={resetGlowPosition}
            >
              <Image
                src="/stitchra-needle-macro.jpg"
                alt="Macro embroidery needle detail"
                fill
                sizes="(max-width: 900px) 100vw, 300px"
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
              />
              <div className="production-photo-overlay" />
              <div className="production-mini-copy">
                <span>Needle detail</span>
                <strong>Industrial precision, close-up.</strong>
              </div>
            </div>

            <div
              className="glow-card production-mini-card production-proof-card"
              onPointerMove={setGlowPosition}
              onPointerLeave={resetGlowPosition}
            >
              <div className="proof-card-orbit" />
              <span>Material story</span>
              <strong>Use fabric and thread cues to build trust before checkout.</strong>
            </div>
          </div>
        </div>
      </section>

      <section id="gallery" style={sectionStyle}>
        <SectionHeader
          eyebrow="Gallery"
          title="Made for modern streetwear"
          text="Clean visual directions for brand badges, small chest logos, team drops and minimal creator merch."
        />

        <div style={galleryGrid}>
          {galleryItems.map((item) => (
            <GalleryCard
              key={item.title}
              title={item.title}
              text={item.text}
              accent={item.accent}
            />
          ))}
        </div>
      </section>

      <section id="pricing" style={sectionStyle}>
        <SectionHeader
          eyebrow="Clear pricing"
          title="Know the cost before stitching"
          text="No surprise messages. The estimate is based on stitches, colors and coverage."
        />

        <div
          className="glow-card"
          onPointerMove={setGlowPosition}
          onPointerLeave={resetGlowPosition}
          style={pricingPanel}
        >
          <div style={priceGrid}>
            <PriceBlock label="Base setup" value="€3.50" />
            <PriceBlock label="Per 1k stitches" value="€1.00" />
            <PriceBlock label="Color fee" value="€0.75" />
            <PriceBlock label="Minimum order" value="€10" highlight />
          </div>

          <div className="pricing-example">
            <div>
              <strong>Example quote</strong>
              <span>Small chest logo, 12k stitches, 3 colors</span>
            </div>
            <strong>{estimate ? `€${estimate.price_eur}` : '€22'}</strong>
          </div>

          <a
            href="#designer"
            className="lux-button"
            style={wideButton}
          >
            Get instant price →
          </a>
        </div>
      </section>

      <section id="faq" style={sectionStyle}>
        <SectionHeader
          eyebrow="FAQ"
          title="Simple answers before production"
          text="Clear for international creators and small teams before they place an order."
        />

        <div className="faq-grid">
          {faqItems.map((item) => (
            <div
              key={item.question}
              className="glow-card faq-card"
              onPointerMove={setGlowPosition}
              onPointerLeave={resetGlowPosition}
            >
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={ctaSection}>
        <div
          className="glow-card final-cta-card"
          onPointerMove={setGlowPosition}
          onPointerLeave={resetGlowPosition}
        >
          <div style={sectionEyebrow}>
            Ready
          </div>

          <h2 style={ctaTitle}>
            Ready to create your first stitched piece?
          </h2>

          <p style={ctaText}>
            Upload a logo or write an idea. See it on fabric and get a clear price before production.
          </p>

          <a
            href="#designer"
            className="lux-button"
            style={primaryButton}
          >
            Start Designing →
          </a>
        </div>
      </section>

      <footer style={footerStyle}>
        <div style={footerInner}>
          <a
            href="#hero"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: 'rgba(245,247,248,0.66)',
              textDecoration: 'none',
            }}
          >
            <Image
              src="/stitchra-mark.svg"
              alt=""
              width={34}
              height={34}
            />
            <span><strong style={{ color: '#f5f7f8' }}>Stitchra</strong> · AI embroidery studio</span>
          </a>

          <div style={footerLinks}>
            <a href="#how" style={footerLink}>How it works</a>
            <a href="#features" style={footerLink}>Features</a>
            <a href="#pricing" style={footerLink}>Pricing</a>
            <a href="#faq" style={footerLink}>FAQ</a>
            <span>© 2026 Stitchra</span>
            <a
              href="https://commons.wikimedia.org/wiki/File:Colorful_thread_spools_(Unsplash).jpg"
              target="_blank"
              rel="noreferrer"
              style={footerLink}
            >
              Thread photo: Wikimedia Commons
            </a>
            <a
              href="https://commons.wikimedia.org/wiki/File:Macro_sewing_machine_needles.jpg"
              target="_blank"
              rel="noreferrer"
              style={footerLink}
            >
              Needle photo: Wikimedia Commons
            </a>
            <a
              href="https://commons.wikimedia.org/wiki/File:Sequin_stitching-16986196536.jpg"
              target="_blank"
              rel="noreferrer"
              style={footerLink}
            >
              Stitch photo: Wikimedia Commons
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Header() {
  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 50,
        backdropFilter: 'blur(22px)',
        background:
          'rgba(0,0,0,0.35)',
        borderBottom:
          '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <nav
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          height: 86,
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            'space-between',
          padding: '0 24px',
        }}
      >
        <a
          href="#hero"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            textDecoration: 'none',
          }}
        >
          <Image
            src="/stitchra-mark.svg"
            alt="Stitchra"
            width={58}
            height={58}
            style={{
              width: 58,
              height: 58,
              borderRadius: 20,
              boxShadow:
                '0 0 45px rgba(0,255,136,0.35)',
            }}
            priority
          />

          <div>
            <Image
              src="/stitchra-wordmark.svg"
              alt="Stitchra AI embroidery platform"
              width={188}
              height={48}
              style={{
                display: 'block',
                width: 188,
                height: 'auto',
                filter:
                  'drop-shadow(0 0 18px rgba(0,255,136,0.20))',
              }}
              priority
            />
          </div>
        </a>

        <div
          className="header-links"
          style={{
            display: 'flex',
            gap: 26,
            alignItems: 'center',
          }}
        >
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={navLink}
            >
              {item.label}
            </a>
          ))}

          <a
            href="#designer"
            className="lux-button"
            style={primaryButton}
          >
            Start Designing →
          </a>
        </div>
      </nav>
    </header>
  );
}

function MannequinPreview({
  preview,
  preset,
  teeColor,
}: {
  preview: string | null;
  preset: {
    label: string;
    size: string;
  };
  teeColor: TeeColor;
}) {
  const [mouse, setMouse] = useState({
    x: 0,
    y: 0,
    active: false,
  });

  const isWhite = teeColor === 'white';
  const rotateX = mouse.active ? mouse.y * -5 : 0;
  const rotateY = mouse.active ? mouse.x * 7 : 0;
  const lightX = mouse.active ? 50 + mouse.x * 18 : 50;
  const lightY = mouse.active ? 30 + mouse.y * 12 : 30;
  const placementLeft =
    preset.label === 'Center front' ? '50%' : '60%';
  const placementTop =
    preset.label === 'Center front' ? 190 : 128;
  const placementWidth =
    preset.label === 'Center front' ? 190 : 112;
  const placementHeight =
    preset.label === 'Center front' ? 148 : 72;
  const shirtSurface = isWhite
    ? 'radial-gradient(circle at 38% 18%, rgba(255,255,255,0.92), transparent 18%), linear-gradient(145deg,#fffdf7 0%,#dedbd2 46%,#f7f3ea 100%)'
    : 'radial-gradient(circle at 38% 18%, rgba(255,255,255,0.12), transparent 18%), linear-gradient(145deg,#101719 0%,#111514 45%,#030404 100%)';
  const sleeveSurface = isWhite
    ? 'linear-gradient(145deg,#fbf7ec,#d6d2c8 54%,#f5f1e8)'
    : 'linear-gradient(145deg,#0b1011,#18201f 55%,#030404)';
  const seamColor = isWhite
    ? 'rgba(35,31,26,0.14)'
    : 'rgba(255,255,255,0.10)';
  const logoBlend: CSSProperties['mixBlendMode'] = isWhite
    ? 'multiply'
    : 'screen';
  const placementBorder = preview
    ? '1px solid rgba(124,240,212,0.30)'
    : '1px solid rgba(124,240,212,0.86)';
  const placementGlow = preview
    ? '0 0 18px rgba(124,240,212,0.22), 0 0 58px rgba(0,200,255,0.10), inset 0 0 16px rgba(124,240,212,0.08)'
    : '0 0 28px rgba(124,240,212,0.58), 0 0 80px rgba(0,200,255,0.18), inset 0 0 26px rgba(124,240,212,0.14)';

  return (
    <div
      onMouseMove={(event) => {
        const rect =
          event.currentTarget.getBoundingClientRect();
        const x =
          (event.clientX - rect.left) / rect.width - 0.5;
        const y =
          (event.clientY - rect.top) / rect.height - 0.5;

        setMouse({
          x,
          y,
          active: true,
        });
      }}
      onMouseLeave={() =>
        setMouse({
          x: 0,
          y: 0,
          active: false,
        })
      }
      style={{
        position: 'relative',
        minHeight: 650,
        borderRadius: 36,
        overflow: 'hidden',
        background:
          `radial-gradient(circle at ${lightX}% ${lightY}%, rgba(124,240,212,0.20), transparent 18%), linear-gradient(145deg,rgba(3,5,7,0.98),rgba(8,15,17,0.94) 48%,rgba(2,3,5,0.98))`,
        border:
          '1px solid rgba(255,255,255,0.10)',
        boxShadow:
          '0 44px 130px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.08)',
        isolation: 'isolate',
        perspective: 1100,
        transition:
          'background 180ms ease, box-shadow 180ms ease',
      }}
    >
      <style>
        {`
          @keyframes stitchraTorsoFloat {
            0%, 100% { transform: translate3d(0, 0, 0); }
            50% { transform: translate3d(0, -14px, 0); }
          }

          @keyframes stitchraBreath {
            0%, 100% { transform: translateX(-50%) translateZ(58px) scale3d(1, 1, 1); filter: brightness(1); }
            50% { transform: translateX(-50%) translateZ(58px) scale3d(1.015, 1.008, 1); filter: brightness(1.045); }
          }

          @keyframes stitchraGlow {
            0%, 100% { opacity: 0.52; transform: scale(1); }
            50% { opacity: 0.92; transform: scale(1.045); }
          }

          @keyframes stitchraThread {
            0% { background-position: 0 0; }
            100% { background-position: 72px 72px; }
          }

          @keyframes stitchraFabric {
            0% { opacity: 0.26; transform: translateX(-10px); }
            50% { opacity: 0.38; transform: translateX(10px); }
            100% { opacity: 0.26; transform: translateX(-10px); }
          }
        `}
      </style>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage:
            'radial-gradient(circle at 50% 45%, black, transparent 78%)',
          transform:
            `translate3d(${mouse.x * -10}px, ${mouse.y * -10}px, 0)`,
          transition: 'transform 120ms ease',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: '14% 5% 7%',
          background:
            'radial-gradient(ellipse at center, rgba(124,240,212,0.20), transparent 55%)',
          filter: 'blur(28px)',
          opacity: 0.72,
          animation:
            'stitchraGlow 4.6s ease-in-out infinite',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          padding: '10px 16px',
          borderRadius: 16,
          background:
            'rgba(0,0,0,0.45)',
          border:
            '1px solid rgba(255,255,255,0.08)',
          fontSize: 13,
          zIndex: 4,
          boxShadow:
            '0 18px 45px rgba(0,0,0,0.32)',
        }}
      >
        T-shirt chest · {preset.label} · {preset.size}
      </div>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 72,
          transform:
            `translateX(-50%) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          width: 420,
          height: 520,
          transformStyle: 'preserve-3d',
          transition:
            'transform 140ms ease-out',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            animation:
              'stitchraTorsoFloat 6s ease-in-out infinite',
            transformStyle: 'preserve-3d',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 10,
              transform:
                'translateX(-50%) translateZ(-42px)',
              width: 320,
              height: 58,
              borderRadius: '50%',
              background:
                'radial-gradient(ellipse at center, rgba(0,0,0,0.66), transparent 68%)',
              filter: 'blur(12px)',
              opacity: 0.9,
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: 20,
              top: 122,
              width: 128,
              height: 255,
              borderRadius:
                '52px 22px 44px 68px',
              background: sleeveSurface,
              clipPath:
                'polygon(42% 0, 100% 15%, 78% 100%, 18% 91%, 0 24%)',
              boxShadow:
                'inset 18px 22px 32px rgba(255,255,255,0.08), inset -24px -30px 46px rgba(0,0,0,0.42), 0 34px 70px rgba(0,0,0,0.42)',
              transform:
                'rotate(7deg) translateZ(18px)',
            }}
          />

          <div
            style={{
              position: 'absolute',
              right: 20,
              top: 122,
              width: 128,
              height: 255,
              borderRadius:
                '22px 52px 68px 44px',
              background: sleeveSurface,
              clipPath:
                'polygon(0 15%, 58% 0, 100% 24%, 82% 91%, 22% 100%)',
              boxShadow:
                'inset 18px 22px 32px rgba(255,255,255,0.08), inset -24px -30px 46px rgba(0,0,0,0.42), 0 34px 70px rgba(0,0,0,0.42)',
              transform:
                'rotate(-7deg) translateZ(18px)',
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 62,
              transform:
                'translateX(-50%) translateZ(58px)',
              width: 340,
              height: 440,
              borderRadius:
                '92px 92px 42px 42px / 86px 86px 34px 34px',
              background: shirtSurface,
              clipPath:
                'polygon(17% 0, 35% 0, 42% 12%, 58% 12%, 65% 0, 83% 0, 98% 22%, 87% 100%, 13% 100%, 2% 22%)',
              boxShadow: isWhite
                ? 'inset 24px 22px 38px rgba(255,255,255,0.70), inset -36px -42px 60px rgba(120,112,98,0.34), 0 56px 115px rgba(0,0,0,0.48), 0 0 74px rgba(124,240,212,0.13)'
                : 'inset 24px 22px 42px rgba(255,255,255,0.055), inset -38px -48px 66px rgba(0,0,0,0.66), 0 56px 115px rgba(0,0,0,0.58), 0 0 78px rgba(124,240,212,0.13)',
              animation:
                'stitchraBreath 5.8s ease-in-out infinite',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage:
                  'linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.18) 18%, transparent 34%), repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 7px), repeating-linear-gradient(0deg, rgba(0,0,0,0.035) 0 1px, transparent 1px 9px)',
                opacity: isWhite ? 0.44 : 0.26,
                animation:
                  'stitchraFabric 8s ease-in-out infinite',
                pointerEvents: 'none',
              }}
            />

            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                transform: 'translateX(-50%)',
                width: 112,
                height: 64,
                borderRadius:
                  '0 0 999px 999px',
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0.72), rgba(0,0,0,0.34))',
                boxShadow:
                  '0 10px 24px rgba(0,0,0,0.38), inset 0 -9px 16px rgba(255,255,255,0.05)',
              }}
            />

            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: 46,
                transform: 'translateX(-50%)',
                width: 152,
                height: 1,
                background: seamColor,
                boxShadow: `0 22px 0 ${seamColor}`,
              }}
            />

            <div
              style={{
                position: 'absolute',
                left: placementLeft,
                top: placementTop,
                transform: 'translateX(-50%)',
                width: placementWidth,
                height: placementHeight,
                border: placementBorder,
                borderRadius: 18,
                display: 'grid',
                placeItems: 'center',
                overflow: 'hidden',
                boxShadow: placementGlow,
                background: preview
                  ? 'transparent'
                  : 'linear-gradient(135deg, rgba(124,240,212,0.13), rgba(0,0,0,0.08))',
                animation:
                  preview
                    ? 'none'
                    : 'stitchraGlow 3.2s ease-in-out infinite',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage:
                    'linear-gradient(45deg, rgba(124,240,212,0.18) 25%, transparent 25%, transparent 50%, rgba(124,240,212,0.18) 50%, rgba(124,240,212,0.18) 75%, transparent 75%, transparent)',
                  backgroundSize: '18px 18px',
                  opacity: preview
                    ? isWhite
                      ? 0.1
                      : 0.12
                    : isWhite
                      ? 0.24
                      : 0.34,
                  animation:
                    'stitchraThread 7s linear infinite',
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              />

              {preview ? (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 14,
                    overflow: 'hidden',
                    isolation: 'isolate',
                    background: 'transparent',
                    WebkitMaskImage:
                      'radial-gradient(ellipse at center, black 68%, rgba(0,0,0,0.86) 82%, transparent 100%)',
                    maskImage:
                      'radial-gradient(ellipse at center, black 68%, rgba(0,0,0,0.86) 82%, transparent 100%)',
                    zIndex: 1,
                  }}
                >
                  <Image
                    src={preview}
                    alt="logo"
                    fill
                    unoptimized
                    style={{
                      objectFit: 'contain',
                      mixBlendMode: logoBlend,
                      opacity: isWhite ? 0.86 : 0.82,
                      padding: 7,
                      filter: isWhite
                        ? 'contrast(1.18) saturate(0.95) brightness(0.98) drop-shadow(0 1px 2px rgba(0,0,0,0.20))'
                        : 'contrast(1.55) saturate(1.20) brightness(0.78) drop-shadow(0 0 10px rgba(124,240,212,0.36))',
                      background: 'transparent',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage:
                        'repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0 1px, transparent 1px 5px), repeating-linear-gradient(0deg, rgba(0,0,0,0.13) 0 1px, transparent 1px 6px)',
                      mixBlendMode: isWhite
                        ? 'multiply'
                        : 'screen',
                      opacity: isWhite ? 0.22 : 0.14,
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage:
                        'repeating-linear-gradient(-18deg, rgba(124,240,212,0.16) 0 1px, transparent 1px 7px)',
                      mixBlendMode: isWhite
                        ? 'multiply'
                        : 'screen',
                      opacity: isWhite ? 0.14 : 0.22,
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              ) : (
                <span
                  style={{
                    color: isWhite
                      ? 'rgba(8,12,14,0.48)'
                      : 'rgba(224,255,244,0.72)',
                    fontSize: 13,
                    fontWeight: 850,
                    letterSpacing: 0,
                    textTransform: 'uppercase',
                    zIndex: 1,
                  }}
                >
                  Logo
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: -2,
              transform:
                'translateX(-50%) translateZ(40px)',
              width: 285,
              height: 30,
              borderRadius: '50%',
              background:
                'linear-gradient(90deg, transparent, rgba(124,240,212,0.24), transparent)',
              filter: 'blur(20px)',
              opacity: 0.8,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function DesignerPreview({
  preview,
  preset,
  teeColor,
}: {
  preview: string | null;
  preset: {
    label: string;
    size: string;
  };
  teeColor: TeeColor;
}) {
  return (
    <MannequinPreview
      preview={preview}
      preset={preset}
      teeColor={teeColor}
    />
  );
}

function setGlowPosition<T extends HTMLElement>(
  event: PointerEvent<T>
) {
  const rect =
    event.currentTarget.getBoundingClientRect();
  const x =
    ((event.clientX - rect.left) / rect.width) * 100;
  const y =
    ((event.clientY - rect.top) / rect.height) * 100;

  event.currentTarget.style.setProperty(
    '--glow-x',
    `${x}%`
  );
  event.currentTarget.style.setProperty(
    '--glow-y',
    `${y}%`
  );
}

function resetGlowPosition<T extends HTMLElement>(
  event: PointerEvent<T>
) {
  event.currentTarget.style.setProperty(
    '--glow-x',
    '50%'
  );
  event.currentTarget.style.setProperty(
    '--glow-y',
    '50%'
  );
}

function GlobalVisualStyles() {
  return (
    <style>
      {`
        html {
          scroll-behavior: smooth;
          scroll-padding-top: 104px;
        }

        ::selection {
          background: rgba(0,255,136,0.26);
          color: #ffffff;
        }

        button,
        input,
        select {
          font: inherit;
        }

        a:focus-visible,
        button:focus-visible,
        input:focus-visible,
        select:focus-visible {
          outline: 2px solid rgba(0,215,255,0.78);
          outline-offset: 4px;
        }

        .stitchra-file-input {
          min-height: 52px;
          width: 100%;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.045);
          color: rgba(245,247,248,0.78);
        }

        .stitchra-file-input::file-selector-button {
          margin-right: 14px;
          min-height: 30px;
          padding: 0 14px;
          border: 0;
          border-radius: 10px;
          background: linear-gradient(135deg, #f7fff9, #dff7ff);
          color: #06100a;
          font-weight: 850;
          cursor: pointer;
        }

        .glow-card {
          --glow-x: 50%;
          --glow-y: 50%;
          --card-glow: rgba(0,255,136,0.18);
          position: relative;
          overflow: visible !important;
          isolation: isolate;
          transition:
            transform 220ms ease,
            border-color 220ms ease,
            box-shadow 220ms ease,
            background 220ms ease;
        }

        .glow-card::before {
          content: "";
          position: absolute;
          inset: -42px;
          pointer-events: none;
          z-index: -1;
          opacity: 0;
          background:
            radial-gradient(circle at var(--glow-x) var(--glow-y), var(--card-glow), rgba(0,212,255,0.16) 30%, rgba(255,56,212,0.10) 50%, transparent 70%);
          filter: blur(42px);
          transform: translateZ(0);
          transition:
            opacity 220ms ease,
            filter 220ms ease;
        }

        .glow-card::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          border-radius: inherit;
          padding: 1px;
          background:
            linear-gradient(135deg, rgba(255,255,255,0.10), transparent 28%, rgba(0,200,255,0.10));
          opacity: 0.34;
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }

        .glow-card:hover {
          transform: translateY(-6px);
          border-color: rgba(124,240,212,0.34) !important;
          box-shadow:
            0 34px 105px rgba(0,0,0,0.52),
            inset 0 1px 0 rgba(255,255,255,0.12) !important;
        }

        .glow-card:hover::before {
          opacity: 0.52;
        }

        .glow-card > :not(img) {
          position: relative;
          z-index: 1;
        }

        .glow-card > img {
          z-index: 0;
        }

        .lux-button {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          transition:
            transform 180ms ease,
            box-shadow 180ms ease,
            filter 180ms ease;
        }

        .lux-button::before {
          content: "";
          position: absolute;
          inset: -45%;
          pointer-events: none;
          z-index: 0;
          opacity: 0;
          background:
            radial-gradient(circle, rgba(255,255,255,0.70), rgba(0,255,136,0.35) 24%, rgba(0,200,255,0.18) 42%, transparent 64%);
          transform: translateX(-25%);
          transition:
            opacity 180ms ease,
            transform 260ms ease;
          mix-blend-mode: soft-light;
        }

        .lux-button:hover {
          transform: translateY(-2px);
          filter: saturate(1.18);
          box-shadow:
            0 22px 64px rgba(0,255,136,0.22),
            0 18px 54px rgba(0,200,255,0.18);
        }

        .lux-button:hover::before {
          opacity: 1;
          transform: translateX(18%);
        }

        .production-layout {
          max-width: 1220px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(420px, 1.1fr);
          gap: 42px;
          align-items: center;
        }

        .production-stat-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 32px;
        }

        .production-stat-card {
          min-height: 116px;
          padding: 22px;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.10);
          background:
            radial-gradient(circle at 24% 18%, rgba(0,255,136,0.13), transparent 34%),
            rgba(255,255,255,0.04);
        }

        .production-stat-card span {
          display: block;
          color: #f5f7f8;
          font-size: 30px;
          font-weight: 950;
          letter-spacing: 0;
        }

        .production-stat-card small {
          display: block;
          margin-top: 8px;
          color: rgba(245,247,248,0.58);
          font-size: 13px;
          line-height: 1.45;
        }

        .production-photo-card {
          position: relative;
          overflow: hidden !important;
          border-radius: 34px;
          border: 1px solid rgba(0,215,255,0.20);
          background: rgba(255,255,255,0.04);
          box-shadow:
            0 44px 130px rgba(0,0,0,0.52),
            inset 0 1px 0 rgba(255,255,255,0.10);
        }

        .production-bento {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          grid-template-rows: 270px 230px;
          gap: 16px;
        }

        .production-photo-main {
          min-height: 520px;
          grid-row: 1 / span 2;
        }

        .production-mini-card {
          position: relative;
          overflow: hidden !important;
          border-radius: 28px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.04);
          box-shadow:
            0 30px 90px rgba(0,0,0,0.42),
            inset 0 1px 0 rgba(255,255,255,0.09);
        }

        .production-thread-card {
          --card-glow: rgba(0,215,255,0.26);
        }

        .production-proof-card {
          --card-glow: rgba(255,40,214,0.22);
          padding: 26px;
          display: grid;
          align-content: end;
          gap: 10px;
          background:
            radial-gradient(circle at 70% 18%, rgba(255,40,214,0.16), transparent 32%),
            radial-gradient(circle at 22% 82%, rgba(0,255,136,0.12), transparent 34%),
            rgba(255,255,255,0.04);
        }

        .proof-card-orbit {
          position: absolute;
          top: 24px;
          right: 24px;
          width: 82px;
          height: 82px;
          border-radius: 50%;
          border: 1px solid rgba(124,240,212,0.30);
          box-shadow: 0 0 45px rgba(124,240,212,0.16);
        }

        .production-mini-card span,
        .production-proof-card span {
          color: #00d7ff;
          font-size: 12px;
          font-weight: 850;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .production-mini-card strong,
        .production-proof-card strong {
          display: block;
          color: #f5f7f8;
          font-size: 22px;
          line-height: 1.15;
        }

        .production-mini-copy {
          position: absolute;
          left: 22px;
          right: 22px;
          bottom: 22px;
          z-index: 2;
          display: grid;
          gap: 6px;
        }

        .production-photo-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.74)),
            radial-gradient(circle at 70% 18%, rgba(0,215,255,0.18), transparent 34%),
            radial-gradient(circle at 28% 82%, rgba(0,255,136,0.16), transparent 34%);
          pointer-events: none;
          z-index: 1;
        }

        .production-photo-badge {
          position: absolute;
          left: 24px;
          right: 24px;
          bottom: 24px;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: center;
          padding: 18px 20px;
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(5,6,7,0.72);
          backdrop-filter: blur(18px);
        }

        .production-photo-badge strong {
          color: #f5f7f8;
          font-size: 18px;
        }

        .production-photo-badge span {
          color: rgba(245,247,248,0.60);
          font-size: 13px;
        }

        .gallery-card {
          min-height: 260px;
          padding: 30px;
          border-radius: 28px;
          display: grid;
          align-content: space-between;
          overflow: hidden !important;
        }

        .gallery-card::before {
          opacity: 0.34;
        }

        .gallery-mark {
          width: 78px;
          height: 78px;
          display: grid;
          place-items: center;
          border-radius: 26px;
          border: 1px solid rgba(255,255,255,0.12);
        }

        .gallery-mark span {
          font-size: 30px;
          line-height: 1;
        }

        .pricing-example {
          margin-top: 18px;
          padding: 18px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.09);
          background:
            linear-gradient(90deg, rgba(0,255,136,0.10), rgba(0,215,255,0.08), rgba(255,40,214,0.08));
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: center;
        }

        .pricing-example strong {
          color: #f5f7f8;
          font-size: 18px;
        }

        .pricing-example span {
          display: block;
          margin-top: 4px;
          color: rgba(245,247,248,0.58);
          font-size: 13px;
        }

        .faq-grid {
          max-width: 980px;
          margin: 40px auto 0;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .faq-card {
          min-height: 174px;
          padding: 26px;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.04);
        }

        .faq-card h3 {
          margin: 0 0 12px;
          color: #f5f7f8;
          font-size: 18px;
        }

        .faq-card p {
          margin: 0;
          color: rgba(245,247,248,0.62);
          line-height: 1.65;
        }

        .final-cta-card {
          max-width: 980px;
          margin: 0 auto;
          padding: clamp(34px, 5vw, 58px);
          text-align: center;
          border-radius: 36px;
          border: 1px solid rgba(0,255,136,0.22);
          background:
            radial-gradient(circle at 22% 10%, rgba(0,255,136,0.18), transparent 34%),
            radial-gradient(circle at 82% 84%, rgba(0,215,255,0.16), transparent 34%),
            rgba(255,255,255,0.04);
          box-shadow:
            0 44px 130px rgba(0,0,0,0.46),
            inset 0 1px 0 rgba(255,255,255,0.10);
        }

        @media (max-width: 900px) {
          .header-links a:not(.lux-button) {
            display: none !important;
          }

          .production-layout {
            grid-template-columns: 1fr;
          }

          .production-bento {
            grid-template-columns: 1fr;
            grid-template-rows: auto;
          }

          .production-photo-card,
          .production-photo-main {
            min-height: 420px;
            grid-row: auto;
          }

          .production-mini-card {
            min-height: 240px;
          }

          .faq-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .header-links .lux-button {
            min-height: 44px !important;
            padding: 0 14px !important;
            font-size: 13px !important;
          }

          .production-stat-grid {
            grid-template-columns: 1fr;
          }

          .pricing-example {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}
    </style>
  );
}

function BackgroundEffects() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.026) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.026) 1px, transparent 1px)',
        backgroundSize: '96px 96px',
        maskImage:
          'linear-gradient(to bottom, black, transparent 86%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '10% -8% auto',
          height: 520,
          background:
            'radial-gradient(circle at 25% 35%, rgba(0,255,136,0.13), transparent 28%), radial-gradient(circle at 80% 26%, rgba(0,215,255,0.12), transparent 30%), radial-gradient(circle at 50% 82%, rgba(255,40,214,0.08), transparent 32%)',
          filter: 'blur(10px)',
        }}
      />
    </div>
  );
}

function HoverCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      className="glow-card"
      onPointerMove={setGlowPosition}
      onPointerLeave={resetGlowPosition}
      style={{
        transition:
          'transform 180ms ease, border-color 180ms ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={statCard}>
      <div style={statLabel}>{label}</div>
      <div style={statValue}>{value}</div>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div style={metricCard}>
      <div style={statLabel}>{label}</div>
      <div style={statValue}>{value}</div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div style={sectionHeader}>
      <div style={sectionEyebrow}>
        {eyebrow}
      </div>

      <h2 style={sectionTitle}>
        {title}
      </h2>

      <p style={sectionText}>
        {text}
      </p>
    </div>
  );
}

function StepCard({
  number,
  icon,
  title,
  text,
  accent = 'green',
}: {
  number: string;
  icon: string;
  title: string;
  text: string;
  accent?: Accent;
}) {
  const colors = accentStyles[accent];

  return (
    <div
      className="glow-card"
      onPointerMove={setGlowPosition}
      onPointerLeave={resetGlowPosition}
      style={{
        ...stepCard,
        '--card-glow': colors.glow,
        border: `1px solid ${colors.border}`,
        background: colors.surface,
      } as CSSProperties}
    >
      <div style={stepTop}>
        <div
          style={{
            ...stepNumber,
            background: colors.soft,
            color: colors.main,
            boxShadow: `0 0 34px ${colors.glow}`,
          }}
        >
          {number}
        </div>

        <div
          style={{
            ...iconBox,
            background: colors.icon,
            color: colors.main,
          }}
        >
          {icon}
        </div>
      </div>

      <h3 style={cardTitle}>
        {title}
      </h3>

      <p style={cardText}>
        {text}
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
  accent,
  footer,
}: {
  icon: string;
  title: string;
  text: string;
  accent: Accent;
  footer: string;
}) {
  const colors = accentStyles[accent];

  return (
    <div
      className="glow-card"
      onPointerMove={setGlowPosition}
      onPointerLeave={resetGlowPosition}
      style={{
        ...featureCard,
        '--card-glow': colors.glow,
        border: `1px solid ${colors.border}`,
        background: colors.surface,
      } as CSSProperties}
    >
      <div
        style={{
          ...iconBox,
          width: 62,
          height: 62,
          borderRadius: 20,
          background: colors.icon,
          color: colors.main,
        }}
      >
        {icon}
      </div>

      <h3 style={cardTitle}>
        {title}
      </h3>

      <p style={cardText}>
        {text}
      </p>

      <div
        style={{
          marginTop: 22,
          paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          color: colors.main,
          fontSize: 13,
          fontWeight: 850,
        }}
      >
        {footer}
      </div>
    </div>
  );
}

function GalleryCard({
  title,
  text,
  accent,
}: {
  title: string;
  text: string;
  accent: Accent;
}) {
  const colors = accentStyles[accent];

  return (
    <div
      className="glow-card gallery-card"
      onPointerMove={setGlowPosition}
      onPointerLeave={resetGlowPosition}
      style={{
        '--card-glow': colors.glow,
        border: `1px solid ${colors.border}`,
        background: colors.surface,
      } as CSSProperties}
    >
      <div
        className="gallery-mark"
        style={{
          background: colors.icon,
          boxShadow: `0 0 42px ${colors.glow}`,
        }}
      >
        <span style={{ color: colors.main }}>✦</span>
      </div>

      <div>
        <h3 style={cardTitle}>{title}</h3>
        <p style={cardText}>{text}</p>
      </div>
    </div>
  );
}

function PriceBlock({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="glow-card"
      onPointerMove={setGlowPosition}
      onPointerLeave={resetGlowPosition}
      style={{
        ...priceBlock,
        border: highlight
          ? '1px solid rgba(0,255,136,0.34)'
          : priceBlock.border,
        background: highlight
          ? 'rgba(0,255,136,0.13)'
          : priceBlock.background,
      }}
    >
      <div style={priceLabel}>
        {label}
      </div>

      <div
        style={{
          ...priceValue,
          color: highlight ? '#00ff88' : priceValue.color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

type Accent = 'green' | 'cyan' | 'purple' | 'pink';

const accentStyles: Record<
  Accent,
  {
    main: string;
    soft: string;
    border: string;
    glow: string;
    icon: string;
    surface: string;
  }
> = {
  green: {
    main: '#00ff88',
    soft: 'rgba(0,255,136,0.13)',
    border: 'rgba(0,255,136,0.26)',
    glow: 'rgba(0,255,136,0.26)',
    icon: 'linear-gradient(135deg, rgba(0,255,136,0.30), rgba(0,200,160,0.12))',
    surface:
      'linear-gradient(145deg, rgba(10,17,16,0.82), rgba(4,7,8,0.90))',
  },
  cyan: {
    main: '#00d7ff',
    soft: 'rgba(0,215,255,0.14)',
    border: 'rgba(0,215,255,0.22)',
    glow: 'rgba(0,215,255,0.24)',
    icon: 'linear-gradient(135deg, rgba(0,215,255,0.30), rgba(70,120,255,0.16))',
    surface:
      'linear-gradient(145deg, rgba(7,14,18,0.82), rgba(4,7,10,0.90))',
  },
  purple: {
    main: '#a879ff',
    soft: 'rgba(168,121,255,0.14)',
    border: 'rgba(168,121,255,0.24)',
    glow: 'rgba(168,121,255,0.24)',
    icon: 'linear-gradient(135deg, rgba(168,121,255,0.32), rgba(255,40,214,0.14))',
    surface:
      'linear-gradient(145deg, rgba(12,10,18,0.82), rgba(6,6,10,0.90))',
  },
  pink: {
    main: '#ff28d6',
    soft: 'rgba(255,40,214,0.13)',
    border: 'rgba(255,40,214,0.22)',
    glow: 'rgba(255,40,214,0.24)',
    icon: 'linear-gradient(135deg, rgba(255,40,214,0.34), rgba(255,206,0,0.16))',
    surface:
      'linear-gradient(145deg, rgba(16,8,14,0.82), rgba(7,6,9,0.90))',
  },
};

const navItems = [
  { label: 'How It Works', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Features', href: '#features' },
  { label: 'FAQ', href: '#faq' },
];

const processSteps: Array<{
  number: string;
  icon: string;
  title: string;
  text: string;
  accent: Accent;
}> = [
  {
    number: '01',
    icon: 'TEE',
    title: 'Choose the garment',
    text: 'Start with a dark or light tee and choose the placement that fits the brand.',
    accent: 'green',
  },
  {
    number: '02',
    icon: 'AI',
    title: 'Shape the artwork',
    text: 'Write a simple idea or upload a customer logo and prepare it for embroidery.',
    accent: 'cyan',
  },
  {
    number: '03',
    icon: '3D',
    title: 'See it on fabric',
    text: 'Check the logo on the chest with fabric texture, shadow and real placement size.',
    accent: 'purple',
  },
  {
    number: '04',
    icon: '€',
    title: 'Quote with confidence',
    text: 'Show stitches, colors and cost before the first sample is made.',
    accent: 'pink',
  },
];

const features = [
  {
    icon: 'AI',
    title: 'AI logo direction',
    text: 'Type a short idea and create a clean first concept for embroidery.',
    footer: 'Fast idea',
    accent: 'green' as const,
  },
  {
    icon: 'FAB',
    title: 'Fabric-aware preview',
    text: 'Blend the logo into the shirt with texture, shadow and natural contrast.',
    footer: 'Natural look',
    accent: 'cyan' as const,
  },
  {
    icon: 'PNG',
    title: 'Logo cleanup',
    text: 'Remove simple backgrounds and crop extra space for a cleaner preview.',
    footer: 'Cleaner file',
    accent: 'purple' as const,
  },
  {
    icon: '€',
    title: 'Instant quote',
    text: 'Estimate price from stitch count, color count and logo coverage.',
    footer: 'Clear cost',
    accent: 'pink' as const,
  },
];

const galleryItems: Array<{
  title: string;
  text: string;
  accent: Accent;
}> = [
  {
    title: 'Quiet monograms',
    text: 'Clean initials for small chest branding, student clubs and makers.',
    accent: 'green',
  },
  {
    title: 'Streetwear marks',
    text: 'Bold symbols for creator drops, local labels and launch pieces.',
    accent: 'cyan',
  },
  {
    title: 'Patch badges',
    text: 'Badge-style artwork that stays readable when stitched.',
    accent: 'purple',
  },
  {
    title: 'Minimal graphics',
    text: 'Low-detail artwork with a premium, quiet fashion look.',
    accent: 'pink',
  },
];

const craftStats = [
  { value: '60s', label: 'First concept direction' },
  { value: '500+', label: 'Thread color possibilities' },
  { value: '3-5 days', label: 'Typical production window' },
  { value: '100%', label: 'Preview before production' },
];

const faqItems = [
  {
    question: 'Can I upload my own logo?',
    answer:
      'Yes. Upload a logo, remove simple backgrounds, preview it on the shirt and get an instant price.',
  },
  {
    question: 'Can AI create a logo idea?',
    answer:
      'Yes. Write a simple prompt like “minimal green logo for a coffee brand” and generate a first concept.',
  },
  {
    question: 'Is the price final?',
    answer:
      'It is a clear estimate based on stitch count, colors and coverage. Final production can be confirmed before payment.',
  },
  {
    question: 'Who is this for?',
    answer:
      'Small brands, students, creators, teams and shops that need fast custom T-shirt quotes.',
  },
];

const heroCard: CSSProperties = {
  padding: 48,
  borderRadius: 34,
  background:
    'linear-gradient(145deg,rgba(12,17,19,0.82),rgba(5,8,10,0.94))',
  border: '1px solid rgba(255,255,255,0.095)',
  boxShadow:
    '0 42px 130px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.08)',
  backdropFilter: 'blur(22px)',
};

const glassCard: CSSProperties = {
  ...heroCard,
  padding: 28,
  borderRadius: 28,
};

const sectionStyle: CSSProperties = {
  padding: '112px 24px',
  position: 'relative',
  zIndex: 1,
};

const sectionHeader: CSSProperties = {
  maxWidth: 760,
  margin: '0 auto',
  textAlign: 'center',
};

const sectionEyebrow: CSSProperties = {
  color: '#00ff88',
  fontSize: 12,
  fontWeight: 850,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  marginBottom: 10,
};

const sectionTitle: CSSProperties = {
  fontSize: 'clamp(36px, 5.4vw, 70px)',
  lineHeight: 0.98,
  letterSpacing: '-0.045em',
  margin: '0 0 14px',
  fontWeight: 950,
};

const sectionText: CSSProperties = {
  margin: 0,
  color: 'rgba(245,247,248,0.66)',
  fontSize: 17,
  lineHeight: 1.68,
};

const fourGrid: CSSProperties = {
  maxWidth: 1180,
  margin: '40px auto 0',
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 18,
};

const galleryGrid: CSSProperties = {
  maxWidth: 1180,
  margin: '40px auto 0',
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 18,
};

const featureCard: CSSProperties = {
  ...glassCard,
  minHeight: 252,
};

const stepCard: CSSProperties = {
  ...glassCard,
  minHeight: 300,
};

const stepTop: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 30,
};

const stepNumber: CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 14,
  background: 'rgba(0,255,136,0.13)',
  color: '#00ff88',
  display: 'grid',
  placeItems: 'center',
  fontSize: 22,
  fontWeight: 900,
};

const iconBox: CSSProperties = {
  width: 54,
  height: 54,
  borderRadius: 17,
  background:
    'linear-gradient(135deg, rgba(0,255,136,0.28), rgba(0,196,255,0.18))',
  border: '1px solid rgba(185,255,204,0.16)',
  boxShadow:
    '0 14px 36px rgba(0,0,0,0.30), 0 0 28px rgba(0,255,136,0.10)',
  display: 'grid',
  placeItems: 'center',
  fontSize: 14,
  fontWeight: 900,
  letterSpacing: '0.01em',
};

const cardTitle: CSSProperties = {
  margin: '18px 0 10px',
  fontSize: 20,
};

const cardText: CSSProperties = {
  margin: 0,
  color: 'rgba(245,247,248,0.62)',
  lineHeight: 1.65,
};

const pricingPanel: CSSProperties = {
  ...glassCard,
  maxWidth: 860,
  margin: '40px auto 0',
};

const priceGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 14,
};

const priceBlock: CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(255,255,255,0.08)',
  textAlign: 'center',
};

const priceLabel: CSSProperties = {
  color: 'rgba(245,247,248,0.58)',
  fontSize: 13,
  marginBottom: 6,
};

const priceValue: CSSProperties = {
  fontSize: 28,
  fontWeight: 900,
  color: '#f5f7f8',
};

const ctaSection: CSSProperties = {
  padding: '92px 24px 120px',
  position: 'relative',
  zIndex: 1,
};

const ctaTitle: CSSProperties = {
  fontSize: 'clamp(32px, 5vw, 62px)',
  lineHeight: 1.02,
  margin: '0 0 16px',
  letterSpacing: '-0.03em',
  fontWeight: 900,
};

const ctaText: CSSProperties = {
  color: 'rgba(245,247,248,0.72)',
  fontSize: 17,
  marginBottom: 24,
};

const footerStyle: CSSProperties = {
  borderTop: '1px solid rgba(255,255,255,0.08)',
  padding: '34px 24px',
  position: 'relative',
  zIndex: 1,
  background: 'rgba(0,0,0,0.18)',
};

const footerInner: CSSProperties = {
  maxWidth: 1180,
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  flexWrap: 'wrap',
  color: 'rgba(245,247,248,0.66)',
  fontSize: 14,
};

const footerLinks: CSSProperties = {
  display: 'flex',
  gap: 18,
  flexWrap: 'wrap',
};

const primaryButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 52,
  padding: '0 22px',
  borderRadius: 16,
  color: '#06100a',
  background: 'linear-gradient(135deg,#00ff88,#00c8ff)',
  textDecoration: 'none',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 18px 50px rgba(0,200,255,0.2)',
};

const wideButton: CSSProperties = {
  ...primaryButton,
  display: 'flex',
  width: '100%',
  marginTop: 20,
};

const secondaryButton: CSSProperties = {
  ...primaryButton,
  color: '#f5f7f8',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.14)',
  boxShadow: 'none',
};

const navLink: CSSProperties = {
  padding: '8px 10px',
  borderRadius: 12,
  color: 'rgba(255,255,255,0.74)',
  fontSize: 14,
  cursor: 'pointer',
  textDecoration: 'none',
  fontWeight: 650,
};

const footerLink: CSSProperties = {
  color: 'rgba(245,247,248,0.66)',
  textDecoration: 'none',
};

const input: CSSProperties = {
  minHeight: 52,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.05)',
  color: '#f5f7f8',
  padding: '0 16px',
  outline: 'none',
  width: '100%',
};

const label: CSSProperties = {
  color: 'rgba(255,255,255,0.72)',
  fontSize: 14,
  fontWeight: 800,
};

const statCard: CSSProperties = {
  padding: 16,
  minHeight: 88,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.045)',
};

const metricCard: CSSProperties = {
  ...statCard,
  minHeight: 76,
};

const statLabel: CSSProperties = {
  color: 'rgba(255,255,255,0.55)',
  fontSize: 12,
  marginBottom: 6,
};

const statValue: CSSProperties = {
  color: '#f5f7f8',
  fontSize: 18,
  fontWeight: 900,
};
