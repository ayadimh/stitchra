'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { CSSProperties, ChangeEvent } from 'react';

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
    top: '32%',
    left: '56%',
    width: '24%',
    height: '13%',
    widthMm: 90,
    heightMm: 60,
  },
  center: {
    label: 'Center front',
    size: '250 × 200 mm',
    top: '40%',
    left: '30%',
    width: '50%',
    height: '35%',
    widthMm: 250,
    heightMm: 200,
  },
} as const;

const features = [
  {
    icon: '🧠',
    title: 'Machine-aware AI',
    text: 'Designs are generated with embroidery production limitations in mind.',
    accent: '#66ff99',
  },
  {
    icon: '🧵',
    title: 'Real stitch estimate',
    text: 'Estimate stitches, density, colors and production complexity instantly.',
    accent: '#59d9ff',
  },
  {
    icon: '🧍',
    title: '3D mannequin preview',
    text: 'Preview embroidery placement directly on a realistic mannequin model.',
    accent: '#ff4dff',
  },
  {
    icon: '⚡',
    title: 'Fast production flow',
    text: 'Go from concept to embroidery-ready order in minutes.',
    accent: '#ffe45c',
  },
];

export default function Home() {
  const [teeColor, setTeeColor] =
    useState<TeeColor>('black');

  const [placement, setPlacement] =
    useState<Placement>('left');

  const [file, setFile] = useState<File | null>(null);

  const [preview, setPreview] =
    useState<string | null>(null);

  const [estimate, setEstimate] =
    useState<Estimate | null>(null);

  const [status, setStatus] = useState('');

  const [error, setError] = useState('');

  const [isEstimating, setIsEstimating] =
    useState(false);

  const [logoPrompt, setLogoPrompt] =
    useState('');

  const [isGeneratingLogo, setIsGeneratingLogo] =
    useState(false);

  const preset = placementPresets[placement];

  const bg = useMemo(
    () =>
      'radial-gradient(circle at 16% 20%, rgba(0,255,136,0.18), transparent 28%),' +
      'radial-gradient(circle at 82% 18%, rgba(0,196,255,0.16), transparent 30%),' +
      'radial-gradient(circle at 55% 92%, rgba(255,0,200,0.10), transparent 32%),' +
      '#050706',
    []
  );

  const teeSurface =
    teeColor === 'black'
      ? 'linear-gradient(120deg, #090d10, #151c20 55%, #0b0f13)'
      : 'linear-gradient(120deg, #f7f9ff, #dfe6ff 55%, #ffffff)';

  const onFile = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const f = e.target.files?.[0] ?? null;

    setFile(f);
    setEstimate(null);

    setPreview(
      f ? URL.createObjectURL(f) : null
    );

    setError('');
    setStatus('');
  };

  const onPlacementChange = (
    e: ChangeEvent<HTMLSelectElement>
  ) => {
    setPlacement(
      e.target.value === 'center'
        ? 'center'
        : 'left'
    );
  };

  const getQuote = async () => {
    setError('');

    if (!file) {
      setError(
        'Bitte zuerst ein Logo hochladen.'
      );
      return;
    }

    setStatus('Calculating...');
    setIsEstimating(true);

    try {
      const fd = new FormData();

      fd.append('file', file);

      fd.append(
        'width_mm',
        String(preset.widthMm)
      );

      fd.append(
        'height_mm',
        String(preset.heightMm)
      );

      fd.append('colors', String(3));

      const res = await fetch(
        `${API}/estimate`,
        {
          method: 'POST',
          body: fd,
        }
      );

      if (!res.ok) {
        setError('Backend/API error.');
        return;
      }

      const data =
        (await res.json()) as Estimate;

      setEstimate(data);

      setStatus(
        'Machine estimate ready.'
      );
    } catch {
      setError(
        'Netzwerkfehler. Prüfe Railway.'
      );
    } finally {
      setIsEstimating(false);
    }
  };

  const generateLogo = async () => {
    setError('');

    if (!logoPrompt.trim()) {
      setError(
        'Beschreibe dein Logo.'
      );
      return;
    }

    setIsGeneratingLogo(true);

    try {
      const fd = new FormData();

      fd.append('prompt', logoPrompt);

      const res = await fetch(
        `${API}/generate_logo`,
        {
          method: 'POST',
          body: fd,
        }
      );

      if (!res.ok) {
        setError(
          'Logo generation failed.'
        );
        return;
      }

      const blob = await res.blob();

      const generatedFile = new File(
        [blob],
        'ai-logo.png',
        {
          type: 'image/png',
        }
      );

      setFile(generatedFile);

      setPreview(
        URL.createObjectURL(blob)
      );

      setStatus(
        'Logo concept generated.'
      );
    } catch {
      setError(
        'Generator Netzwerkfehler.'
      );
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: bg,
        color: '#f4f7f8',
        fontFamily:
          'Inter, system-ui, sans-serif',
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      <BackgroundFX />

      <Header />

      <section
        id="hero"
        style={{
          minHeight:
            'calc(100vh - 86px)',
          display: 'grid',
          placeItems: 'center',
          padding: '72px 24px',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 1240,
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 46,
            alignItems: 'center',
          }}
        >
          <HoverCard style={heroGlassCard}>
            <Pill text="Machine-aware embroidery studio" />

            <h1 style={heroTitle}>
              Create embroidery
              <span style={greenText}>
                before production starts
              </span>
            </h1>

            <p style={heroText}>
              Preview embroidery on a
              realistic mannequin,
              calculate stitch count,
              estimate machine time and
              validate production cost
              before the order reaches
              the embroidery machine.
            </p>

            <div
              style={{
                display: 'flex',
                gap: 14,
                flexWrap: 'wrap',
                marginBottom: 28,
              }}
            >
              <InteractiveLink
                href="#designer"
                style={primaryButton}
              >
                Start Production Preview →
              </InteractiveLink>

              <InteractiveLink
                href="#features"
                style={secondaryButton}
              >
                Explore Studio
              </InteractiveLink>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 18,
                alignItems: 'center',
                flexWrap: 'wrap',
                color:
                  'rgba(244,247,248,0.76)',
                fontSize: 13,
              }}
            >
              <AvatarStack />

              <span>
                Built for streetwear,
                embroidery and creator
                brands
              </span>

              <span
                style={{
                  color: '#ffd84d',
                }}
              >
                ★★★★★ 4.9/5
              </span>
            </div>
          </HoverCard>

          <MannequinPreview
            preset={preset}
            preview={preview}
          />
        </div>
      </section>

      <section
        id="designer"
        style={sectionStyle}
      >
        <SectionHeader
          eyebrow="Machine estimate"
          title="Check your embroidery before production"
          text="Upload a logo, generate an AI concept and preview the embroidery placement directly on the garment."
        />

        <div
          style={{
            maxWidth: 1180,
            margin: '40px auto 0',
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 24,
          }}
        >
          <HoverCard style={glassCard}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(3, minmax(0,1fr))',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <MiniStat
                label="Machine"
                value="Single head"
              />

              <MiniStat
                label="Estimate"
                value="Real-time"
              />

              <MiniStat
                label="Production"
                value="Ready"
              />
            </div>

            <div
              style={{
                display: 'grid',
                gap: 14,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  onClick={() =>
                    setTeeColor('black')
                  }
                  style={
                    teeColor === 'black'
                      ? activeToggle
                      : toggleButton
                  }
                >
                  Black garment
                </button>

                <button
                  onClick={() =>
                    setTeeColor('white')
                  }
                  style={
                    teeColor === 'white'
                      ? activeToggle
                      : toggleButton
                  }
                >
                  White garment
                </button>
              </div>

              <label style={labelStyle}>
                Embroidery placement
              </label>

              <select
                value={placement}
                onChange={
                  onPlacementChange
                }
                style={inputStyle}
              >
                <option value="left">
                  Left chest badge
                </option>

                <option value="center">
                  Center front design
                </option>
              </select>

              <label style={labelStyle}>
                Upload artwork
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={onFile}
                style={{
                  padding: '12px 0',
                  color: '#f4f7f8',
                }}
              />

              <label style={labelStyle}>
                AI embroidery concept
              </label>

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <input
                  type="text"
                  value={logoPrompt}
                  onChange={(e) =>
                    setLogoPrompt(
                      e.target.value
                    )
                  }
                  placeholder="e.g. futuristic chest logo with green thread"
                  style={{
                    ...inputStyle,
                    flex: '1 1 220px',
                  }}
                />

                <InteractiveButton
                  type="button"
                  onClick={generateLogo}
                  disabled={
                    isGeneratingLogo
                  }
                  style={{
                    ...primaryButton,
                    border: 'none',
                    minWidth: 160,
                    opacity:
                      isGeneratingLogo
                        ? 0.65
                        : 1,
                  }}
                >
                  {isGeneratingLogo
                    ? 'Generating…'
                    : 'Generate'}
                </InteractiveButton>
              </div>

              <InteractiveButton
                onClick={getQuote}
                disabled={isEstimating}
                style={{
                  ...primaryButton,
                  border: 'none',
                  width: '100%',
                  opacity:
                    isEstimating
                      ? 0.65
                      : 1,
                }}
              >
                {isEstimating
                  ? 'Calculating…'
                  : 'Estimate production'}
              </InteractiveButton>

              {(status || error) && (
                <div
                  style={{
                    fontSize: 13,
                    color: error
                      ? '#ffb4b4'
                      : '#cde7ff',
                  }}
                >
                  {error || status}
                </div>
              )}

              {estimate && (
                <div style={metricGrid}>
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
                    value={`€${estimate.price_eur.toFixed(
                      2
                    )}`}
                  />
                </div>
              )}
            </div>
          </HoverCard>

          <DesignerPreview
            teeSurface={teeSurface}
            teeColor={teeColor}
            preset={preset}
            preview={preview}
            large
          />
        </div>
      </section>
    </main>
  );
}

function BackgroundFX() {
  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '96px 96px',
          maskImage:
            'radial-gradient(circle at 50% 20%, black, transparent 72%)',
        }}
      />

      <div
        style={{
          position: 'fixed',
          top: 90,
          left: -160,
          width: 460,
          height: 460,
          borderRadius: 999,
          background:
            'rgba(0,255,136,0.16)',
          filter: 'blur(95px)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

function Header() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        backdropFilter: 'blur(26px)',
        background:
          'linear-gradient(180deg, rgba(7,9,8,0.72), rgba(7,9,8,0.42))',
        borderBottom:
          '1px solid rgba(255,255,255,0.10)',
      }}
    >
      <nav
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          height: 86,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            'space-between',
        }}
      >
        <a
          href="#hero"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textDecoration: 'none',
            color: '#f4f7f8',
          }}
        >
          <div style={brandMark}>
            <span
              style={{
                color: '#e3ffe9',
                fontWeight: 1000,
                fontSize: 24,
              }}
            >
              St
            </span>
          </div>

          <div>
            <div
              style={{
                fontWeight: 1000,
                fontSize: 24,
              }}
            >
              Stitchra
            </div>

            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.18em',
                color:
                  'rgba(184,255,201,0.58)',
              }}
            >
              MACHINE-AWARE STUDIO
            </div>
          </div>
        </a>
      </nav>
    </header>
  );
}