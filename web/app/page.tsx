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
          '"Avenir Next", Inter, "Helvetica Neue", Arial, sans-serif',
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
          minHeight: '100vh',
          padding: '132px 24px 96px',
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

            @keyframes heroMachineNeedle {
              0%, 100% { transform: translate3d(-50%, 0, 0); }
              45% { transform: translate3d(-50%, 11px, 0); }
            }

            @keyframes heroMachineThread {
              from { background-position: 0 0; }
              to { background-position: 80px 80px; }
            }

            @keyframes heroMachineLight {
              0%, 100% { transform: translateX(-34%) rotate(14deg); opacity: 0.15; }
              50% { transform: translateX(34%) rotate(14deg); opacity: 0.38; }
            }

            .hero-atelier {
              position: relative;
              max-width: 1320px;
              margin: 0 auto;
              display: grid;
              grid-template-columns: minmax(0, 0.88fr) minmax(420px, 1.12fr);
              gap: 56px;
              align-items: center;
            }

            .hero-copy-panel {
              position: relative;
              padding: clamp(30px, 4vw, 52px);
              border-radius: 30px;
              border: 1px solid rgba(255,255,255,0.10);
              background:
                radial-gradient(circle at 16% 18%, rgba(0,255,136,0.14), transparent 32%),
                radial-gradient(circle at 86% 86%, rgba(0,200,255,0.10), transparent 34%),
                linear-gradient(145deg, rgba(17,19,20,0.72), rgba(6,7,7,0.90) 58%, rgba(14,16,18,0.72));
              box-shadow:
                0 34px 110px rgba(0,0,0,0.48),
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
              margin-bottom: 24px;
              border: 1px solid rgba(213,255,223,0.22);
              border-radius: 999px;
              background: rgba(255,255,255,0.045);
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
              margin: 0 0 24px;
              font-size: clamp(54px, 7.2vw, 104px);
              line-height: 0.96;
              letter-spacing: -0.025em;
              font-weight: 920;
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
              margin: 0 0 34px;
              color: rgba(246,243,235,0.68);
              font-size: 18px;
              line-height: 1.7;
            }

            .hero-actions {
              display: flex;
              gap: 14px;
              flex-wrap: wrap;
              margin-bottom: 30px;
            }

            .hero-proof-strip {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 10px;
            }

            .hero-proof-item {
              min-height: 72px;
              padding: 14px;
              border-radius: 18px;
              border: 1px solid rgba(255,255,255,0.09);
              background: rgba(255,255,255,0.045);
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
              border-radius: 36px;
              background:
                linear-gradient(145deg, rgba(18,20,21,0.94), rgba(5,6,7,0.98) 58%, rgba(8,18,17,0.96));
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

            .hero-machine-frame {
              position: absolute;
              inset: 76px 42px 128px;
              overflow: hidden;
              border-radius: 30px;
              border: 1px solid rgba(255,255,255,0.12);
              background:
                linear-gradient(145deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02)),
                rgba(5,7,8,0.72);
              box-shadow:
                0 34px 90px rgba(0,0,0,0.52),
                inset 0 1px 0 rgba(255,255,255,0.12);
              transform: rotateX(var(--hero-rotate-x)) rotateY(var(--hero-rotate-y));
              transform-style: preserve-3d;
              transition: transform 180ms ease-out;
              z-index: 2;
              animation: heroMachineFloat 7s ease-in-out infinite;
            }

            .hero-machine-photo {
              position: absolute;
              inset: 18px;
              overflow: hidden;
              border-radius: 24px;
              background-image:
                linear-gradient(180deg, rgba(5,6,8,0.04) 0%, rgba(5,6,8,0.28) 58%, rgba(5,6,8,0.88) 100%),
                radial-gradient(circle at 30% 18%, rgba(255,255,255,0.75), transparent 18%),
                url('/stitchra-machine-hero.jpg'),
                linear-gradient(145deg, #f7f8f2 0%, #d7dad5 48%, #626a70 100%);
              background-size: cover;
              background-position: center 42%;
              box-shadow:
                inset 0 0 0 1px rgba(255,255,255,0.08),
                inset 0 -80px 120px rgba(0,0,0,0.70);
            }

            .hero-machine-photo::before {
              content: "";
              position: absolute;
              inset: 0;
              background:
                linear-gradient(112deg, rgba(255,255,255,0.34), transparent 21%, transparent 66%, rgba(0,200,255,0.10));
              mix-blend-mode: overlay;
              animation: heroMachineLight 9s ease-in-out infinite;
              pointer-events: none;
            }

            .hero-machine-photo::after {
              content: "";
              position: absolute;
              inset: 0;
              background:
                radial-gradient(circle at var(--hero-light-x) var(--hero-light-y), rgba(255,255,255,0.18), transparent 28%),
                radial-gradient(circle at 68% 70%, rgba(0,255,136,0.16), transparent 30%),
                linear-gradient(rgba(255,255,255,0.026) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.020) 1px, transparent 1px);
              background-size: auto, auto, 42px 42px, 42px 42px;
              pointer-events: none;
            }

            .hero-machine-fallback {
              position: absolute;
              inset: 18px;
              border-radius: 24px;
              overflow: hidden;
              display: none;
              opacity: 0;
              pointer-events: none;
            }

            .hero-machine-head {
              position: absolute;
              left: 44%;
              top: 16%;
              width: 50%;
              height: 34%;
              border-radius: 46% 46% 28% 28%;
              background:
                radial-gradient(circle at 32% 28%, rgba(255,255,255,0.52), transparent 10%),
                linear-gradient(145deg, rgba(247,250,247,0.82), rgba(165,174,176,0.92) 56%, rgba(31,40,43,0.84));
              filter: blur(0.2px);
              transform: rotate(-7deg);
              box-shadow: 0 28px 72px rgba(0,0,0,0.34);
            }

            .hero-machine-arm {
              position: absolute;
              left: 31%;
              top: 32%;
              width: 13%;
              height: 48%;
              border-radius: 999px;
              background:
                linear-gradient(180deg, rgba(25,29,31,0.30), rgba(8,10,11,0.86));
              transform: rotate(6deg);
              box-shadow: 0 18px 36px rgba(0,0,0,0.32);
            }

            .hero-machine-needle {
              position: absolute;
              left: 48%;
              top: 40%;
              width: 12px;
              height: 172px;
              transform: translateX(-50%);
              background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(125,139,147,0.72), rgba(0,0,0,0.82));
              border-radius: 999px;
              box-shadow: 0 0 24px rgba(0,200,255,0.18);
              animation: heroMachineNeedle 1.8s ease-in-out infinite;
            }

            .hero-machine-hoop {
              position: absolute;
              left: 29%;
              bottom: 20%;
              width: 40%;
              height: 18%;
              border: 2px solid rgba(0,255,136,0.44);
              border-radius: 50%;
              background:
                repeating-linear-gradient(45deg, rgba(0,255,136,0.11) 0 2px, transparent 2px 10px);
              box-shadow:
                0 0 34px rgba(0,255,136,0.24),
                inset 0 0 28px rgba(0,200,255,0.12);
              animation: heroMachineThread 8s linear infinite;
            }

            .hero-ai-badge,
            .hero-machine-toolbar,
            .hero-placement-callout {
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

            .hero-machine-toolbar {
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
              left: 28px;
              right: 28px;
              bottom: 24px;
              z-index: 4;
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 12px;
            }

            .hero-spec-card {
              padding: 14px 12px;
              border: 1px solid rgba(255,255,255,0.09);
              border-radius: 16px;
              background: rgba(5,6,6,0.48);
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
              }

              .hero-preview-card {
                min-height: 640px;
              }

              .hero-machine-frame {
                inset: 82px 24px 124px;
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

              .hero-machine-frame {
                inset: 88px 16px 130px;
                border-radius: 24px;
              }

              .hero-ai-badge {
                left: 20px;
                right: 20px;
                top: 20px;
              }

              .hero-machine-toolbar {
                top: 72px;
                left: 20px;
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
              .hero-machine-frame,
              .hero-machine-photo::before,
              .hero-machine-needle,
              .hero-machine-hoop {
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
              AI EMBROIDERY STUDIO
            </div>

            <h1 className="hero-title">
              Design.
              <br />
              Preview.
              <span className="hero-title-accent">
                Stitch.
              </span>
            </h1>

            <p className="hero-subcopy">
              Create custom embroidered T-shirts with AI. Upload your logo, preview it on a shirt, and get a clear price before production.
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
                href="#designer"
                className="lux-button"
                style={secondaryButton}
              >
                See 3D Preview
              </a>
            </div>

            <div className="hero-proof-strip">
              <div className="hero-proof-item">
                <div className="hero-proof-label">
                  Placement
                </div>
                <div className="hero-proof-value">
                  {preset.label}
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
                  Output
                </div>
                <div className="hero-proof-value">
                  Clear price
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
            <div className="hero-machine-toolbar">
              <span className="hero-window-dot" />
              <span className="hero-window-dot" />
              <span className="hero-window-dot" />
              Production studio
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
                  AI Generated
                </div>
                <div
                  style={{
                    color: 'rgba(245,247,248,0.56)',
                    fontSize: 12,
                  }}
                >
                  Logo ready for stitching
                </div>
              </div>
            </div>

            <div className="hero-machine-frame">
              <div className="hero-machine-photo" />

              <div className="hero-machine-fallback">
                <div className="hero-machine-head" />
                <div className="hero-machine-arm" />
                <div className="hero-machine-needle" />
                <div className="hero-machine-hoop" />
              </div>

              <div className="hero-placement-callout">
                <div className="hero-callout-icon">👕</div>
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
            </div>

            <div className="hero-spec-grid">
              {[
                ['Ready to Stitch', preview ? 'Logo loaded' : 'AI artwork'],
                ['Instant Quote', estimate ? `€${estimate.price_eur}` : 'From €10'],
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
          padding: '80px 24px 120px',
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
                Choose T-shirt color
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
                  placeholder="minimal green badge for a small brand"
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
          title="From idea to stitched tee"
          text="Four clear steps. No design skills needed. Good for creators, students and small brands."
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
          eyebrow="Powerful features"
          title="Everything you need to sell custom embroidery"
          text="Create, preview and price custom T-shirts before production. Clear enough for customers, fast enough for your shop."
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
              Built for real embroidery work
            </h2>

            <p style={sectionText}>
              Stitchra is designed for real orders: chest logos, small brand badges, student merch and clean streetwear drops.
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

          <div
            className="glow-card production-photo-card"
            onPointerMove={setGlowPosition}
            onPointerLeave={resetGlowPosition}
          >
            <Image
              src="/stitchra-machine-hero.jpg"
              alt="Embroidery machine stitching a design"
              fill
              sizes="(max-width: 900px) 100vw, 560px"
              style={{
                objectFit: 'cover',
              }}
            />
            <div className="production-photo-overlay" />
            <div className="production-photo-badge">
              <strong>Production studio</strong>
              <span>Machine-ready artwork</span>
            </div>
          </div>
        </div>
      </section>

      <section id="gallery" style={sectionStyle}>
        <SectionHeader
          eyebrow="Gallery"
          title="Styles for modern creators"
          text="Pick a direction, then let the AI create a first concept. Keep it simple, bold and embroidery-friendly."
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
          title="Know the price before production"
          text="The estimate is based on real production factors: stitches, colors and coverage."
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
          title="Simple answers before you order"
          text="The goal is clear: no confusion, no long messages, no surprise costs."
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
            Create your first custom embroidered T-shirt
          </h2>

          <p style={ctaText}>
            Upload a logo or write an idea. Preview it on the shirt and get a clear price in seconds.
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
              href="https://commons.wikimedia.org/wiki/File:Brother_Innov-is_V7_machine,_embroidering.jpg"
              target="_blank"
              rel="noreferrer"
              style={footerLink}
            >
              Photo: Rwendland / CC BY-SA 4.0
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
                border:
                  '1px solid rgba(124,240,212,0.96)',
                borderRadius: 18,
                display: 'grid',
                placeItems: 'center',
                overflow: 'hidden',
                boxShadow:
                  '0 0 28px rgba(124,240,212,0.58), 0 0 80px rgba(0,200,255,0.18), inset 0 0 26px rgba(124,240,212,0.14)',
                background: preview
                  ? 'transparent'
                  : 'linear-gradient(135deg, rgba(124,240,212,0.13), rgba(0,0,0,0.08))',
                animation:
                  'stitchraGlow 3.2s ease-in-out infinite',
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
                    inset: 4,
                    borderRadius: 14,
                    overflow: 'hidden',
                    isolation: 'isolate',
                    background: 'transparent',
                    WebkitMaskImage:
                      'radial-gradient(ellipse at center, black 64%, rgba(0,0,0,0.84) 78%, transparent 100%)',
                    maskImage:
                      'radial-gradient(ellipse at center, black 64%, rgba(0,0,0,0.84) 78%, transparent 100%)',
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
                      opacity: isWhite ? 0.9 : 0.86,
                      padding: 6,
                      filter: isWhite
                        ? 'contrast(1.18) saturate(1.08) brightness(1.03) drop-shadow(0 1px 3px rgba(0,0,0,0.24))'
                        : 'contrast(1.65) saturate(1.25) brightness(0.82) drop-shadow(0 0 14px rgba(124,240,212,0.50))',
                      background: 'transparent',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage:
                        'repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0 1px, transparent 1px 5px), repeating-linear-gradient(0deg, rgba(0,0,0,0.14) 0 1px, transparent 1px 6px)',
                      mixBlendMode: isWhite
                        ? 'multiply'
                        : 'screen',
                      opacity: isWhite ? 0.18 : 0.16,
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
        .glow-card {
          --glow-x: 50%;
          --glow-y: 50%;
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
          inset: -34px;
          pointer-events: none;
          z-index: -1;
          opacity: 0;
          background:
            radial-gradient(circle at var(--glow-x) var(--glow-y), rgba(0,255,136,0.36), rgba(0,212,255,0.22) 25%, rgba(255,56,212,0.13) 46%, transparent 68%);
          filter: blur(28px);
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
          transform: translateY(-4px);
          border-color: rgba(124,240,212,0.34) !important;
          box-shadow:
            0 34px 105px rgba(0,0,0,0.52),
            inset 0 1px 0 rgba(255,255,255,0.12) !important;
        }

        .glow-card:hover::before {
          opacity: 0.78;
        }

        .glow-card > * {
          position: relative;
          z-index: 1;
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
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(420px, 1.1fr);
          gap: 34px;
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
          min-height: 520px;
          overflow: hidden !important;
          border-radius: 34px;
          border: 1px solid rgba(0,215,255,0.20);
          background: rgba(255,255,255,0.04);
          box-shadow:
            0 44px 130px rgba(0,0,0,0.52),
            inset 0 1px 0 rgba(255,255,255,0.10);
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
          .production-layout {
            grid-template-columns: 1fr;
          }

          .production-photo-card {
            min-height: 420px;
          }

          .faq-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
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
          'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
        backgroundSize: '96px 96px',
        maskImage:
          'linear-gradient(to bottom, black, transparent 86%)',
      }}
    />
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
        border: `1px solid ${colors.border}`,
        background: colors.surface,
      }}
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
        border: `1px solid ${colors.border}`,
        background: colors.surface,
      }}
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
        border: `1px solid ${colors.border}`,
        background: colors.surface,
      }}
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
      'radial-gradient(circle at 18% 22%, rgba(0,255,136,0.16), transparent 34%), rgba(5,9,10,0.78)',
  },
  cyan: {
    main: '#00d7ff',
    soft: 'rgba(0,215,255,0.14)',
    border: 'rgba(0,215,255,0.22)',
    glow: 'rgba(0,215,255,0.24)',
    icon: 'linear-gradient(135deg, rgba(0,215,255,0.30), rgba(70,120,255,0.16))',
    surface:
      'radial-gradient(circle at 28% 16%, rgba(0,215,255,0.14), transparent 36%), rgba(5,9,12,0.78)',
  },
  purple: {
    main: '#a879ff',
    soft: 'rgba(168,121,255,0.14)',
    border: 'rgba(168,121,255,0.24)',
    glow: 'rgba(168,121,255,0.24)',
    icon: 'linear-gradient(135deg, rgba(168,121,255,0.32), rgba(255,40,214,0.14))',
    surface:
      'radial-gradient(circle at 22% 24%, rgba(168,121,255,0.15), transparent 34%), rgba(8,7,12,0.78)',
  },
  pink: {
    main: '#ff28d6',
    soft: 'rgba(255,40,214,0.13)',
    border: 'rgba(255,40,214,0.22)',
    glow: 'rgba(255,40,214,0.24)',
    icon: 'linear-gradient(135deg, rgba(255,40,214,0.34), rgba(255,206,0,0.16))',
    surface:
      'radial-gradient(circle at 22% 24%, rgba(255,40,214,0.14), transparent 34%), rgba(10,7,10,0.78)',
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
    title: 'Choose your shirt',
    text: 'Pick black or white, choose placement and start with a clean T-shirt preview.',
    accent: 'green',
  },
  {
    number: '02',
    icon: 'AI',
    title: 'Create a logo',
    text: 'Describe your idea in simple words or upload your own artwork.',
    accent: 'cyan',
  },
  {
    number: '03',
    icon: '3D',
    title: 'Preview it',
    text: 'See the design on the chest before you spend money on production.',
    accent: 'purple',
  },
  {
    number: '04',
    icon: '€',
    title: 'Get the price',
    text: 'Check stitches, colors and cost so customers can decide fast.',
    accent: 'pink',
  },
];

const features = [
  {
    icon: 'AI',
    title: 'AI Logo Generator',
    text: 'Type a short idea and get a clean logo direction for embroidery.',
    footer: 'Instant concept',
    accent: 'green' as const,
  },
  {
    icon: '3D',
    title: 'Real T-shirt Preview',
    text: 'Place the logo on a dark or light shirt and see it before ordering.',
    footer: 'Chest mockup',
    accent: 'cyan' as const,
  },
  {
    icon: 'PNG',
    title: 'Logo Cleanup',
    text: 'Uploaded logos are analyzed and converted into a cleaner transparent preview.',
    footer: 'Better upload',
    accent: 'purple' as const,
  },
  {
    icon: '€',
    title: 'Instant Pricing',
    text: 'Show a clear quote based on stitches, colors and coverage.',
    footer: 'No surprise cost',
    accent: 'pink' as const,
  },
];

const galleryItems: Array<{
  title: string;
  text: string;
  accent: Accent;
}> = [
  {
    title: 'Monogram',
    text: 'Clean initials for small chest branding.',
    accent: 'green',
  },
  {
    title: 'Streetwear',
    text: 'Bold marks for drops, clubs and creator merch.',
    accent: 'cyan',
  },
  {
    title: 'Badge',
    text: 'Round patches and simple symbol logos.',
    accent: 'purple',
  },
  {
    title: 'Minimal',
    text: 'Low-detail artwork that stitches cleanly.',
    accent: 'pink',
  },
];

const craftStats = [
  { value: '60s', label: 'Fast first concept' },
  { value: '500+', label: 'Thread color options' },
  { value: '3-5 days', label: 'Typical production' },
  { value: '100%', label: 'Preview before order' },
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
  borderRadius: 32,
  background:
    'linear-gradient(145deg,rgba(11,18,22,0.82),rgba(7,10,12,0.92))',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 40px 120px rgba(0,0,0,0.42)',
  backdropFilter: 'blur(22px)',
};

const glassCard: CSSProperties = {
  ...heroCard,
  padding: 28,
  borderRadius: 28,
};

const sectionStyle: CSSProperties = {
  padding: '94px 24px',
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
  fontSize: 'clamp(32px, 5vw, 54px)',
  lineHeight: 1.05,
  letterSpacing: '-0.03em',
  margin: '0 0 14px',
  fontWeight: 900,
};

const sectionText: CSSProperties = {
  margin: 0,
  color: 'rgba(245,247,248,0.66)',
  fontSize: 16,
  lineHeight: 1.7,
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
  minHeight: 220,
};

const stepCard: CSSProperties = {
  ...glassCard,
  minHeight: 280,
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
