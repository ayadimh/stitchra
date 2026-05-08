'use client';

import Image from 'next/image';
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
      radial-gradient(circle at 85% 10%, rgba(0,200,255,0.10), transparent 28%),
      radial-gradient(circle at 50% 100%, rgba(255,0,200,0.08), transparent 35%),
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
          'Inter, system-ui, sans-serif',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <BackgroundEffects />

      <Header />

      <section
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
              MACHINE-AWARE EMBROIDERY PLATFORM
            </div>

            <h1
              style={{
                fontSize:
                  'clamp(52px,8vw,96px)',
                lineHeight: 0.9,
                letterSpacing: '-0.08em',
                margin: '0 0 22px',
                fontWeight: 1000,
              }}
            >
              Build your own
              <span
                style={{
                  display: 'block',
                  color: '#00ff88',
                  textShadow:
                    '0 0 25px rgba(0,255,136,0.35)',
                }}
              >
                3D embroidery fit
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
              Create embroidery-ready
              streetwear previews with AI.
              Generate logos, preview
              placement on a 3D mannequin
              and calculate production cost
              instantly.
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
                style={primaryButton}
              >
                Start 3D Preview →
              </a>

              <a
                href="#designer"
                style={secondaryButton}
              >
                Explore Workflow
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
                Built for creators &
                embroidery studios
              </span>
            </div>
          </HoverCard>

          <MannequinPreview
            preview={preview}
            preset={preset}
          />
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
                value="Machine Ready"
              />

              <Stat
                label="Pricing"
                value="Instant"
              />

              <Stat
                label="Preview"
                value="3D Live"
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
                Upload logo
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
                Generate with AI
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
                  placeholder="minimal green streetwear logo"
                  style={{
                    ...input,
                    flex: 1,
                  }}
                />

                <button
                  onClick={generateLogo}
                  disabled={isGenerating}
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
                style={{
                  ...primaryButton,
                  border: 'none',
                  width: '100%',
                }}
              >
                {isEstimating
                  ? 'Calculating...'
                  : 'Estimate stitches & price'}
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
          />
        </div>
      </section>
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
              fontWeight: 1000,
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
                fontWeight: 1000,
                letterSpacing: '-0.06em',
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
              MACHINE-AWARE STUDIO
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
          {[
            'How It Works',
            'Pricing',
            'Gallery',
            'Features',
          ].map((item) => (
            <HoverCard
              key={item}
              style={{
                padding: '8px 10px',
                borderRadius: 12,
                color:
                  'rgba(255,255,255,0.74)',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {item}
            </HoverCard>
          ))}

          <a
            href="#designer"
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
}: {
  preview: string | null;
  preset: {
    label: string;
    size: string;
  };
}) {
  return (
    <HoverCard
      style={{
        position: 'relative',
        minHeight: 650,
        borderRadius: 40,
        overflow: 'hidden',
        background:
          'linear-gradient(145deg,rgba(5,10,12,0.94),rgba(10,18,22,0.86))',
        border:
          '1px solid rgba(255,255,255,0.08)',
        boxShadow:
          '0 40px 120px rgba(0,0,0,0.55)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
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
        }}
      >
        3D mannequin · {preset.label}
      </div>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 80,
          transform:
            'translateX(-50%)',
          width: 340,
          height: 500,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform:
              'translateX(-50%)',
            width: 110,
            height: 110,
            borderRadius: '50%',
            background:
              'linear-gradient(145deg,#27312d,#111917)',
            boxShadow:
              '0 25px 60px rgba(0,0,0,0.45)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 95,
            left: '50%',
            transform:
              'translateX(-50%)',
            width: 260,
            height: 320,
            borderRadius:
              '48% 48% 28% 28%',
            background:
              'linear-gradient(145deg,#111917,#1b2825,#0b1011)',
            boxShadow:
              'inset 0 25px 50px rgba(255,255,255,0.04), 0 40px 90px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 95,
              transform:
                'translateX(-50%)',
              width: 120,
              height: 80,
              border:
                '2px dashed #7cf0d4',
              borderRadius: 16,
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
              boxShadow:
                '0 0 35px rgba(0,255,136,0.25)',
            }}
          >
            {preview ? (
              <Image
                src={preview}
                alt="logo"
                fill
                unoptimized
                style={{
                  objectFit: 'contain',
                  mixBlendMode:
                    'screen',
                }}
              />
            )