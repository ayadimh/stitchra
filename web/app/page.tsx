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

export default function Home() {
  const [placement, setPlacement] = useState<Placement>('left');
  const [teeColor, setTeeColor] = useState<TeeColor>('black');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [estimate, setEstimate] = useState<Estimate | null>(null);

  const [logoPrompt, setLogoPrompt] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);

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

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;

    setFile(f);
    setEstimate(null);

    if (f) {
      setPreview(URL.createObjectURL(f));
    }

    setStatus('');
    setError('');
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
          display: 'grid',
          placeItems: 'center',
          padding: '120px 24px 80px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 1280,
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(380px,1fr))',
            gap: 42,
            alignItems: 'center',
          }}
        >
          <HoverCard style={heroCard}>
            <div style={badge}>
              <span style={badgeDot} />
              AI EMBROIDERY STUDIO
            </div>

            <h1
              style={{
                fontSize:
                  'clamp(46px,7vw,86px)',
                lineHeight: 0.94,
                letterSpacing: '-0.04em',
                margin: '0 0 22px',
                fontWeight: 900,
              }}
            >
              Turn your idea into
              <span
                style={{
                  display: 'block',
                  color: '#00ff88',
                  textShadow:
                    '0 0 25px rgba(0,255,136,0.35)',
                }}
              >
                real embroidery
              </span>
            </h1>

            <p
              style={{
                fontSize: 18,
                lineHeight: 1.7,
                color:
                  'rgba(245,247,248,0.70)',
                marginBottom: 32,
                maxWidth: 620,
              }}
            >
              Create a logo with AI, upload your own design and preview it on a premium front-chest T-shirt mockup. See the embroidery placement and get a clear price before production starts.
            </p>

            <div
              style={{
                display: 'flex',
                gap: 16,
                flexWrap: 'wrap',
                marginBottom: 28,
              }}
            >
              <a
                href="#designer"
                className="lux-button"
                style={primaryButton}
              >
                Start Designing →
              </a>

              <a
                href="#how"
                className="lux-button"
                style={secondaryButton}
              >
                How It Works
              </a>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 16,
                alignItems: 'center',
                flexWrap: 'wrap',
                color:
                  'rgba(255,255,255,0.72)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                }}
              >
                {['S', 'M', 'A'].map(
                  (letter, i) => (
                    <div
                      key={letter}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 999,
                        marginLeft: i ? -8 : 0,
                        display: 'grid',
                        placeItems: 'center',
                        background:
                          i === 0
                            ? '#00ff88'
                            : i === 1
                            ? '#00d4ff'
                            : '#ff38d4',
                        color: '#06100a',
                        fontWeight: 900,
                        border:
                          '2px solid #050607',
                      }}
                    >
                      {letter}
                    </div>
                  )
                )}
              </div>

              <span>
                For creators, brands and custom embroidery orders
              </span>
            </div>
          </HoverCard>

          <div
            className="hero-premium-card"
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
                `${y * -5}deg`
              );
              event.currentTarget.style.setProperty(
                '--hero-rotate-y',
                `${x * 7}deg`
              );
              event.currentTarget.style.setProperty(
                '--hero-shift-x',
                `${x * -14}px`
              );
              event.currentTarget.style.setProperty(
                '--hero-shift-y',
                `${y * -12}px`
              );
              event.currentTarget.style.setProperty(
                '--hero-light-x',
                `${50 + x * 18}%`
              );
              event.currentTarget.style.setProperty(
                '--hero-light-y',
                `${30 + y * 14}%`
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
                '50%'
              );
              event.currentTarget.style.setProperty(
                '--hero-light-y',
                '30%'
              );
            }}
            style={
              {
                '--hero-rotate-x': '0deg',
                '--hero-rotate-y': '0deg',
                '--hero-shift-x': '0px',
                '--hero-shift-y': '0px',
                '--hero-light-x': '50%',
                '--hero-light-y': '30%',
              } as CSSProperties
            }
          >
            <style>
              {`
                @keyframes heroTorsoFloat {
                  0%, 100% { transform: translate3d(0, 0, 0); }
                  50% { transform: translate3d(0, -16px, 0); }
                }

                @keyframes heroFabricBreath {
                  0%, 100% { transform: translateX(-50%) translateZ(64px) scale3d(1, 1, 1); filter: brightness(1); }
                  50% { transform: translateX(-50%) translateZ(64px) scale3d(1.016, 1.01, 1); filter: brightness(1.055); }
                }

                @keyframes heroPlacementGlow {
                  0%, 100% { box-shadow: 0 0 28px rgba(124,240,212,0.52), 0 0 76px rgba(0,200,255,0.18), inset 0 0 24px rgba(124,240,212,0.12); }
                  50% { box-shadow: 0 0 42px rgba(124,240,212,0.78), 0 0 110px rgba(0,200,255,0.28), inset 0 0 36px rgba(124,240,212,0.18); }
                }

                @keyframes heroThreadMove {
                  from { background-position: 0 0; }
                  to { background-position: 72px 72px; }
                }

                @keyframes heroGlossSweep {
                  0%, 100% { opacity: 0.18; transform: translateX(-28px); }
                  50% { opacity: 0.42; transform: translateX(28px); }
                }

                .hero-premium-card {
                  position: relative;
                  min-height: 650px;
                  border-radius: 38px;
                  overflow: hidden;
                  border: 1px solid rgba(255,255,255,0.10);
                  background:
                    radial-gradient(circle at var(--hero-light-x) var(--hero-light-y), rgba(124,240,212,0.24), transparent 20%),
                    radial-gradient(circle at 72% 78%, rgba(0,196,255,0.10), transparent 30%),
                    linear-gradient(145deg, rgba(3,5,7,0.98), rgba(10,18,20,0.94) 48%, rgba(2,3,5,0.98));
                  box-shadow: 0 44px 130px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.08);
                  isolation: isolate;
                  perspective: 1200px;
                  transition: background 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
                }

                .hero-premium-card:hover {
                  border-color: rgba(124,240,212,0.26);
                  box-shadow: 0 54px 150px rgba(0,0,0,0.68), 0 0 72px rgba(0,255,136,0.10), inset 0 1px 0 rgba(255,255,255,0.10);
                }

                .hero-premium-grid {
                  position: absolute;
                  inset: 0;
                  background-image:
                    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
                  background-size: 44px 44px;
                  mask-image: radial-gradient(circle at 50% 45%, black, transparent 78%);
                  transform: translate3d(var(--hero-shift-x), var(--hero-shift-y), 0);
                  transition: transform 120ms ease;
                }

                .hero-stage {
                  position: absolute;
                  left: 50%;
                  top: 72px;
                  width: min(440px, 88%);
                  height: 520px;
                  transform: translateX(-50%) rotateX(var(--hero-rotate-x)) rotateY(var(--hero-rotate-y));
                  transform-style: preserve-3d;
                  transition: transform 150ms ease-out;
                }

                .hero-float {
                  position: absolute;
                  inset: 0;
                  animation: heroTorsoFloat 6s ease-in-out infinite;
                  transform-style: preserve-3d;
                }

                .hero-sleeve-left,
                .hero-sleeve-right {
                  position: absolute;
                  top: 122px;
                  width: 128px;
                  height: 255px;
                  box-shadow: inset 18px 22px 32px rgba(255,255,255,0.08), inset -24px -30px 46px rgba(0,0,0,0.42), 0 34px 70px rgba(0,0,0,0.42);
                }

                .hero-sleeve-left {
                  left: 14px;
                  border-radius: 52px 22px 44px 68px;
                  clip-path: polygon(42% 0, 100% 15%, 78% 100%, 18% 91%, 0 24%);
                  transform: rotate(7deg) translateZ(18px);
                }

                .hero-sleeve-right {
                  right: 14px;
                  border-radius: 22px 52px 68px 44px;
                  clip-path: polygon(0 15%, 58% 0, 100% 24%, 82% 91%, 22% 100%);
                  transform: rotate(-7deg) translateZ(18px);
                }

                .hero-shirt-body {
                  position: absolute;
                  left: 50%;
                  top: 62px;
                  width: 340px;
                  height: 440px;
                  border-radius: 92px 92px 42px 42px / 86px 86px 34px 34px;
                  clip-path: polygon(17% 0, 35% 0, 42% 12%, 58% 12%, 65% 0, 83% 0, 98% 22%, 87% 100%, 13% 100%, 2% 22%);
                  overflow: hidden;
                  animation: heroFabricBreath 5.8s ease-in-out infinite;
                }

                .hero-shirt-body::before {
                  content: "";
                  position: absolute;
                  inset: 0;
                  background-image:
                    linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.18) 18%, transparent 34%),
                    repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 7px),
                    repeating-linear-gradient(0deg, rgba(0,0,0,0.035) 0 1px, transparent 1px 9px);
                  animation: heroGlossSweep 8s ease-in-out infinite;
                  pointer-events: none;
                }

                .hero-collar {
                  position: absolute;
                  left: 50%;
                  top: 0;
                  transform: translateX(-50%);
                  width: 112px;
                  height: 64px;
                  border-radius: 0 0 999px 999px;
                  background: linear-gradient(180deg, rgba(0,0,0,0.72), rgba(0,0,0,0.34));
                  box-shadow: 0 10px 24px rgba(0,0,0,0.38), inset 0 -9px 16px rgba(255,255,255,0.05);
                }

                .hero-placement-box {
                  position: absolute;
                  transform: translateX(-50%);
                  border: 1px solid rgba(124,240,212,0.96);
                  border-radius: 18px;
                  display: grid;
                  place-items: center;
                  overflow: hidden;
                  background: linear-gradient(135deg, rgba(124,240,212,0.13), rgba(0,0,0,0.08));
                  animation: heroPlacementGlow 3.2s ease-in-out infinite;
                }

                .hero-placement-box::before {
                  content: "";
                  position: absolute;
                  inset: 0;
                  background-image: linear-gradient(45deg, rgba(124,240,212,0.18) 25%, transparent 25%, transparent 50%, rgba(124,240,212,0.18) 50%, rgba(124,240,212,0.18) 75%, transparent 75%, transparent);
                  background-size: 18px 18px;
                  animation: heroThreadMove 7s linear infinite;
                  opacity: 0.28;
                }
              `}
            </style>

            <div className="hero-premium-grid" />

            <div
              style={{
                position: 'absolute',
                inset: '14% 5% 7%',
                background:
                  'radial-gradient(ellipse at center, rgba(124,240,212,0.20), transparent 55%)',
                filter: 'blur(30px)',
                opacity: 0.72,
              }}
            />

            <div
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                padding: '10px 16px',
                borderRadius: 16,
                background: 'rgba(0,0,0,0.45)',
                border:
                  '1px solid rgba(255,255,255,0.08)',
                fontSize: 13,
                zIndex: 4,
                boxShadow:
                  '0 18px 45px rgba(0,0,0,0.32)',
              }}
            >
              Premium chest mockup · {preset.label} · {preset.size}
            </div>

            <div
              style={{
                position: 'absolute',
                top: 22,
                left: 22,
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: 999,
                background:
                  'rgba(255,255,255,0.055)',
                border:
                  '1px solid rgba(255,255,255,0.09)',
                color: 'rgba(245,247,248,0.76)',
                fontSize: 13,
                zIndex: 4,
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background:
                    teeColor === 'white'
                      ? '#f5f1e8'
                      : '#050607',
                  border:
                    teeColor === 'white'
                      ? '1px solid rgba(0,0,0,0.18)'
                      : '1px solid rgba(255,255,255,0.20)',
                }}
              />
              {teeColor === 'white'
                ? 'White tee'
                : 'Black tee'}
            </div>

            <div className="hero-stage">
              <div className="hero-float">
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
                      'radial-gradient(ellipse at center, rgba(0,0,0,0.68), transparent 68%)',
                    filter: 'blur(12px)',
                    opacity: 0.9,
                  }}
                />

                <div
                  className="hero-sleeve-left"
                  style={{
                    background:
                      teeColor === 'white'
                        ? 'linear-gradient(145deg,#fbf7ec,#d6d2c8 54%,#f5f1e8)'
                        : 'linear-gradient(145deg,#0b1011,#18201f 55%,#030404)',
                  }}
                />

                <div
                  className="hero-sleeve-right"
                  style={{
                    background:
                      teeColor === 'white'
                        ? 'linear-gradient(145deg,#fbf7ec,#d6d2c8 54%,#f5f1e8)'
                        : 'linear-gradient(145deg,#0b1011,#18201f 55%,#030404)',
                  }}
                />

                <div
                  className="hero-shirt-body"
                  style={{
                    background:
                      teeColor === 'white'
                        ? 'radial-gradient(circle at 38% 18%, rgba(255,255,255,0.92), transparent 18%), linear-gradient(145deg,#fffdf7 0%,#dedbd2 46%,#f7f3ea 100%)'
                        : 'radial-gradient(circle at 38% 18%, rgba(255,255,255,0.12), transparent 18%), linear-gradient(145deg,#101719 0%,#111514 45%,#030404 100%)',
                    boxShadow:
                      teeColor === 'white'
                        ? 'inset 24px 22px 38px rgba(255,255,255,0.70), inset -36px -42px 60px rgba(120,112,98,0.34), 0 56px 115px rgba(0,0,0,0.48), 0 0 74px rgba(124,240,212,0.13)'
                        : 'inset 24px 22px 42px rgba(255,255,255,0.055), inset -38px -48px 66px rgba(0,0,0,0.66), 0 56px 115px rgba(0,0,0,0.58), 0 0 78px rgba(124,240,212,0.13)',
                  }}
                >
                  <div className="hero-collar" />

                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: 46,
                      transform: 'translateX(-50%)',
                      width: 152,
                      height: 1,
                      background:
                        teeColor === 'white'
                          ? 'rgba(35,31,26,0.14)'
                          : 'rgba(255,255,255,0.10)',
                      boxShadow:
                        teeColor === 'white'
                          ? '0 22px 0 rgba(35,31,26,0.14)'
                          : '0 22px 0 rgba(255,255,255,0.10)',
                    }}
                  />

                  <div
                    className="hero-placement-box"
                    style={{
                      left:
                        preset.label === 'Center front'
                          ? '50%'
                          : '60%',
                      top:
                        preset.label === 'Center front'
                          ? 190
                          : 128,
                      width:
                        preset.label === 'Center front'
                          ? 190
                          : 112,
                      height:
                        preset.label === 'Center front'
                          ? 148
                          : 72,
                    }}
                  >
                    {preview ? (
                      <Image
                        src={preview}
                        alt="Logo preview"
                        fill
                        unoptimized
                        style={{
                          objectFit: 'contain',
                          mixBlendMode:
                            teeColor === 'white'
                              ? 'multiply'
                              : 'screen',
                          padding: 8,
                          filter:
                            teeColor === 'white'
                              ? 'drop-shadow(0 0 8px rgba(0,0,0,0.18))'
                              : 'drop-shadow(0 0 16px rgba(124,240,212,0.55))',
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          color:
                            teeColor === 'white'
                              ? 'rgba(8,12,14,0.48)'
                              : 'rgba(224,255,244,0.72)',
                          fontSize: 13,
                          fontWeight: 850,
                          letterSpacing: 0,
                          textTransform:
                            'uppercase',
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

            <div
              style={{
                position: 'absolute',
                left: 28,
                right: 28,
                bottom: 24,
                display: 'grid',
                gridTemplateColumns:
                  'repeat(3,minmax(0,1fr))',
                gap: 12,
                zIndex: 4,
              }}
            >
              {[
                ['Finish', 'Gloss cotton'],
                ['Placement', preset.label],
                ['Artwork', preview ? 'Live logo' : 'Ready'],
              ].map(([labelText, value]) => (
                <div
                  key={labelText}
                  style={{
                    padding: '14px 12px',
                    borderRadius: 16,
                    background:
                      'rgba(0,0,0,0.34)',
                    border:
                      '1px solid rgba(255,255,255,0.08)',
                    textAlign: 'center',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div
                    style={{
                      color:
                        'rgba(245,247,248,0.52)',
                      fontSize: 11,
                      marginBottom: 4,
                    }}
                  >
                    {labelText}
                  </div>
                  <div
                    style={{
                      color: '#f5f7f8',
                      fontSize: 13,
                      fontWeight: 850,
                    }}
                  >
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
                Placement
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
                T-shirt color
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
                Create a logo with AI
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
                  placeholder="simple green logo for my brand"
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
                disabled={isEstimating}
                className="lux-button"
                style={{
                  ...primaryButton,
                  border: 'none',
                  width: '100%',
                }}
              >
                {isEstimating
                  ? 'Calculating...'
                  : 'Get my price'}
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
          title="How It Works"
          text="Design your custom T-shirt in 3 simple steps. No design skills required."
        />

        <div style={threeGrid}>
          <StepCard
            number="01"
            icon="TEE"
            title="Choose Your Shirt"
            text="Select your T-shirt color, size and placement. Start with a clean black or white canvas."
          />

          <StepCard
            number="02"
            icon="AI"
            title="Generate AI Logo"
            text="Describe your idea in plain English. Create a first logo concept or upload your own design."
          />

          <StepCard
            number="03"
            icon="€"
            title="Preview & Order"
            text="See the logo on the tee and get instant pricing based on stitches, colors and coverage."
          />
        </div>
      </section>

      <section id="features" style={sectionStyle}>
        <SectionHeader
          eyebrow="Features"
          title="Everything needed for fast custom embroidery"
          text="From visual preview to instant pricing, Stitchra gives customers confidence before ordering."
        />

        <div style={fourGrid}>
          {features.map((feature) => (
            <div
              key={feature.title}
              className="glow-card"
              onPointerMove={setGlowPosition}
              onPointerLeave={resetGlowPosition}
              style={featureCard}
            >
              <div style={iconBox}>{feature.icon}</div>

              <h3 style={cardTitle}>
                {feature.title}
              </h3>

              <p style={cardText}>
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="gallery" style={sectionStyle}>
        <SectionHeader
          eyebrow="Gallery"
          title="Made for modern creators"
          text="A clean visual direction for brand badges, small chest logos, statement fronts and minimal streetwear."
        />

        <div style={galleryGrid}>
          {galleryItems.map((item, index) => (
            <div
              key={item}
              className="glow-card"
              onPointerMove={setGlowPosition}
              onPointerLeave={resetGlowPosition}
              style={{
                ...featureCard,
                minHeight: 220,
                display: 'grid',
                alignContent: 'space-between',
              }}
            >
              <div
                style={{
                  ...iconBox,
                  width: 72,
                  height: 72,
                  borderRadius: 22,
                  background:
                    index % 2
                      ? 'rgba(0,196,255,0.13)'
                      : 'rgba(0,255,136,0.13)',
                  fontSize: 28,
                }}
              >
                ✦
              </div>

              <div>
                <h3 style={cardTitle}>
                  {item}
                </h3>

                <p style={cardText}>
                  Logo-ready mockup style for fast embroidery quotes.
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" style={sectionStyle}>
        <SectionHeader
          eyebrow="Pricing"
          title="Transparent estimate before production"
          text="Start with a base cost, then calculate by stitch count and colors. Your current backend already does this automatically."
        />

        <div
          className="glow-card"
          onPointerMove={setGlowPosition}
          onPointerLeave={resetGlowPosition}
          style={pricingPanel}
        >
          <div style={priceGrid}>
            <PriceBlock label="Base" value="€3.50" />
            <PriceBlock label="Per 1k stitches" value="€1.00" />
            <PriceBlock label="Color fee" value="€0.75" />
            <PriceBlock label="Minimum" value="€10" highlight />
          </div>

          <a
            href="#designer"
            className="lux-button"
            style={wideButton}
          >
            Try the estimator →
          </a>
        </div>
      </section>

      <section style={ctaSection}>
        <div
          className="glow-card"
          onPointerMove={setGlowPosition}
          onPointerLeave={resetGlowPosition}
          style={ctaCard}
        >
          <h2 style={ctaTitle}>
            Ready to create your first custom tee?
          </h2>

          <p style={ctaText}>
            Upload a logo and get an instant embroidery quote now.
          </p>

          <a
            href="#designer"
            className="lux-button"
            style={primaryButton}
          >
            Start Creating Now →
          </a>
        </div>
      </section>

      <footer style={footerStyle}>
        <div style={footerInner}>
          <div>
            <strong style={{ color: '#f5f7f8' }}>Stitchra</strong> · AI embroidery platform
          </div>

          <div style={footerLinks}>
            <a href="#how" style={footerLink}>How It Works</a>
            <a href="#pricing" style={footerLink}>Pricing</a>
            <a href="#features" style={footerLink}>Features</a>
            <span>© 2026 Stitchra</span>
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <HoverCard
            style={{
              width: 58,
              height: 58,
              borderRadius: 20,
              background:
                'linear-gradient(135deg,#00ff88,#00c8ff)',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 900,
              fontSize: 32,
              color: '#05100a',
              boxShadow:
                '0 0 45px rgba(0,255,136,0.35)',
            }}
          >
            S
          </HoverCard>

          <div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 900,
                letterSpacing: '-0.03em',
              }}
            >
              Stitchra
            </div>

            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.18em',
                color:
                  'rgba(255,255,255,0.5)',
              }}
            >
              AI EMBROIDERY STUDIO
            </div>
          </div>
        </div>

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
                background:
                  'linear-gradient(135deg, rgba(124,240,212,0.13), rgba(0,0,0,0.08))',
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
                  opacity: isWhite ? 0.24 : 0.34,
                  animation:
                    'stitchraThread 7s linear infinite',
                }}
              />

              {preview ? (
                <Image
                  src={preview}
                  alt="logo"
                  fill
                  unoptimized
                  style={{
                    objectFit: 'contain',
                    mixBlendMode: logoBlend,
                    padding: 8,
                    filter: isWhite
                      ? 'drop-shadow(0 0 8px rgba(0,0,0,0.18))'
                      : 'drop-shadow(0 0 16px rgba(124,240,212,0.55))',
                  }}
                />
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
          overflow: hidden;
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
          inset: -1px;
          pointer-events: none;
          z-index: 0;
          opacity: 0;
          background:
            radial-gradient(circle at var(--glow-x) var(--glow-y), rgba(0,255,136,0.30), rgba(0,212,255,0.17) 22%, rgba(255,56,212,0.10) 40%, transparent 62%);
          mix-blend-mode: screen;
          transition: opacity 220ms ease;
        }

        .glow-card::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          border-radius: inherit;
          background:
            linear-gradient(135deg, rgba(255,255,255,0.10), transparent 28%, rgba(0,200,255,0.08));
          opacity: 0.26;
        }

        .glow-card:hover {
          transform: translateY(-4px);
          border-color: rgba(124,240,212,0.34) !important;
          box-shadow:
            0 34px 105px rgba(0,0,0,0.52),
            0 0 72px rgba(0,255,136,0.14),
            0 0 92px rgba(0,200,255,0.10),
            inset 0 1px 0 rgba(255,255,255,0.12) !important;
        }

        .glow-card:hover::before {
          opacity: 1;
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
}: {
  number: string;
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div
      className="glow-card"
      onPointerMove={setGlowPosition}
      onPointerLeave={resetGlowPosition}
      style={stepCard}
    >
      <div style={stepTop}>
        <div style={stepNumber}>
          {number}
        </div>

        <div style={iconBox}>
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

const navItems = [
  { label: 'How It Works', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Features', href: '#features' },
];

const features = [
  {
    icon: 'AI',
    title: 'AI logo generator',
    text: 'Describe a logo idea and create a quick embroidery-style concept instantly.',
  },
  {
    icon: 'ST',
    title: 'Stitch estimator',
    text: 'Upload artwork and get an instant stitch, coverage, color and price estimate.',
  },
  {
    icon: '3D',
    title: '3D tee preview',
    text: 'Preview placement on a dark or light T-shirt before producing the design.',
  },
  {
    icon: '€',
    title: 'Fast quoting',
    text: 'Customers understand cost and placement immediately.',
  },
];

const galleryItems = [
  'Monogram',
  'Streetwear',
  'Badge',
  'Minimal',
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

const threeGrid: CSSProperties = {
  maxWidth: 1180,
  margin: '40px auto 0',
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 22,
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
  width: 44,
  height: 44,
  borderRadius: 14,
  background:
    'linear-gradient(135deg, rgba(0,255,136,0.18), rgba(0,196,255,0.12))',
  border: '1px solid rgba(255,255,255,0.08)',
  display: 'grid',
  placeItems: 'center',
  fontSize: 13,
  fontWeight: 900,
  letterSpacing: '0.02em',
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

const ctaCard: CSSProperties = {
  maxWidth: 940,
  margin: '0 auto',
  textAlign: 'center',
  padding: 38,
  borderRadius: 32,
  background:
    'linear-gradient(135deg, rgba(0,255,136,0.14), rgba(0,196,255,0.08))',
  border: '1px solid rgba(0,255,136,0.18)',
  boxShadow: '0 34px 100px rgba(0,0,0,0.34)',
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

const badge: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 14px',
  borderRadius: 999,
  marginBottom: 24,
  border: '1px solid rgba(0,255,136,0.34)',
  color: '#9dffc4',
  background: 'rgba(0,255,136,0.08)',
  fontSize: 12,
  fontWeight: 800,
};

const badgeDot: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: '#00ff88',
  boxShadow: '0 0 18px rgba(0,255,136,0.8)',
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
