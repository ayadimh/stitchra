'use client';

import Image from 'next/image';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, Environment } from '@react-three/drei';
import { useMemo, useRef, useState } from 'react';
import type { CSSProperties, ChangeEvent } from 'react';
import * as THREE from 'three';

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
    widthMm: 90,
    heightMm: 60,
  },

  center: {
    label: 'Center front',
    size: '250 × 200 mm',
    widthMm: 250,
    heightMm: 200,
  },
} as const;

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

  const [logoPrompt, setLogoPrompt] =
    useState('');

  const [isGeneratingLogo, setIsGeneratingLogo] =
    useState(false);

  const [isEstimating, setIsEstimating] =
    useState(false);

  const preset = placementPresets[placement];

  const bg = useMemo(
    () =>
      'radial-gradient(circle at 20% 20%, rgba(0,255,136,0.16), transparent 30%), radial-gradient(circle at 80% 10%, rgba(0,196,255,0.13), transparent 28%), radial-gradient(circle at 50% 90%, rgba(255,0,200,0.08), transparent 28%), #040605',
    []
  );

  const onFile = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const f = e.target.files?.[0] ?? null;

    setFile(f);

    setPreview(
      f ? URL.createObjectURL(f) : null
    );

    setEstimate(null);

    setError('');
  };

  const generateLogo = async () => {
    setError('');

    if (!logoPrompt.trim()) {
      setError(
        'Describe your embroidery idea.'
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

      const blob = await res.blob();

      const generatedFile = new File(
        [blob],
        'logo.png',
        {
          type: 'image/png',
        }
      );

      setFile(generatedFile);

      setPreview(
        URL.createObjectURL(blob)
      );
    } catch {
      setError(
        'AI generation failed.'
      );
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  const getQuote = async () => {
    if (!file) {
      setError(
        'Upload a logo first.'
      );
      return;
    }

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

      fd.append('colors', '3');

      const res = await fetch(
        `${API}/estimate`,
        {
          method: 'POST',
          body: fd,
        }
      );

      const data =
        (await res.json()) as Estimate;

      setEstimate(data);
    } catch {
      setError(
        'Estimate failed.'
      );
    } finally {
      setIsEstimating(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: bg,
        color: '#f4f7f8',
        fontFamily:
          'Inter, sans-serif',
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      <BackgroundFX />

      <Header />

      <section
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '40px 24px 80px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 1320,
            display: 'grid',
            gridTemplateColumns:
              '1fr 1fr',
            gap: 34,
            alignItems: 'center',
          }}
        >
          <HoverCard style={heroCard}>
            <Pill text="Interactive embroidery production studio" />

            <h1 style={heroTitle}>
              Create
              <span style={greenText}>
                real embroidery
              </span>
              before production
            </h1>

            <p style={heroText}>
              Preview embroidery
              directly on a realistic
              3D mannequin, estimate
              stitches, machine time,
              thread usage and final
              production pricing before
              the design reaches your
              embroidery machine.
            </p>

            <div
              style={{
                display: 'flex',
                gap: 14,
                flexWrap: 'wrap',
                marginBottom: 28,
              }}
            >
              <GlowButton>
                Start 3D Preview →
              </GlowButton>

              <SecondaryButton>
                Machine Workflow
              </SecondaryButton>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 18,
                flexWrap: 'wrap',
                alignItems: 'center',
                color:
                  'rgba(255,255,255,0.72)',
              }}
            >
              <span>
                Built for embroidery
                businesses
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

          <ThreeDPreview preview={preview} />
        </div>
      </section>

      <section
        style={{
          padding: '40px 24px 120px',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns:
              '420px 1fr',
            gap: 28,
          }}
        >
          <HoverCard style={glassCard}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(3,1fr)',
                gap: 12,
                marginBottom: 22,
              }}
            >
              <MiniStat
                label="Machine"
                value="Commercial"
              />

              <MiniStat
                label="Preview"
                value="3D"
              />

              <MiniStat
                label="Quote"
                value="Realtime"
              />
            </div>

            <div
              style={{
                display: 'grid',
                gap: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                }}
              >
                <InteractiveToggle
                  active={
                    teeColor === 'black'
                  }
                  onClick={() =>
                    setTeeColor(
                      'black'
                    )
                  }
                >
                  Black
                </InteractiveToggle>

                <InteractiveToggle
                  active={
                    teeColor === 'white'
                  }
                  onClick={() =>
                    setTeeColor(
                      'white'
                    )
                  }
                >
                  White
                </InteractiveToggle>
              </div>

              <div>
                <label style={label}>
                  Placement
                </label>

                <select
                  value={placement}
                  onChange={(e) =>
                    setPlacement(
                      e.target
                        .value as Placement
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
              </div>

              <div>
                <label style={label}>
                  Upload artwork
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={onFile}
                  style={input}
                />
              </div>

              <div>
                <label style={label}>
                  AI embroidery idea
                </label>

                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                  }}
                >
                  <input
                    value={logoPrompt}
                    onChange={(e) =>
                      setLogoPrompt(
                        e.target.value
                      )
                    }
                    placeholder="futuristic embroidered chest logo"
                    style={{
                      ...input,
                      flex: 1,
                    }}
                  />

                  <GlowButton
                    onClick={
                      generateLogo
                    }
                  >
                    {isGeneratingLogo
                      ? 'Generating...'
                      : 'Generate'}
                  </GlowButton>
                </div>
              </div>

              <GlowButton
                onClick={getQuote}
              >
                {isEstimating
                  ? 'Calculating...'
                  : 'Estimate Production'}
              </GlowButton>

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
                    value={`€${estimate.price_eur}`}
                  />
                </div>
              )}

              {error && (
                <div
                  style={{
                    color: '#ff8f8f',
                    fontSize: 13,
                  }}
                >
                  {error}
                </div>
              )}

              {status && (
                <div
                  style={{
                    color: '#9dffc0',
                    fontSize: 13,
                  }}
                >
                  {status}
                </div>
              )}
            </div>
          </HoverCard>

          <ThreeDPreview preview={preview} />
        </div>
      </section>
    </main>
  );
}

function ThreeDPreview({
  preview,
}: {
  preview: string | null;
}) {
  return (
    <HoverCard
      style={{
        ...glassCard,
        minHeight: 720,
        position: 'relative',
        overflow: 'hidden',
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

      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 45,
        }}
      >
        <ambientLight intensity={1.4} />

        <directionalLight
          position={[5, 5, 5]}
          intensity={2}
        />

        <Environment preset="city" />

        <Float
          speed={2}
          rotationIntensity={0.4}
          floatIntensity={0.5}
        >
          <Mannequin />
        </Float>

        <OrbitControls
          enableZoom={false}
        />
      </Canvas>

      {preview && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '44%',
            transform:
              'translate(-50%, -50%)',
            width: 110,
            height: 90,
            pointerEvents: 'none',
            filter:
              'drop-shadow(0 0 18px rgba(0,255,136,0.35))',
          }}
        >
          <Image
            src={preview}
            alt="preview"
            fill
            unoptimized
            style={{
              objectFit: 'contain',
              mixBlendMode: 'screen',
            }}
          />
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          top: 18,
          right: 18,
          padding: '10px 14px',
          borderRadius: 14,
          background:
            'rgba(0,0,0,0.48)',
          border:
            '1px solid rgba(255,255,255,0.10)',
          fontSize: 12,
        }}
      >
        Interactive 3D preview
      </div>
    </HoverCard>
  );
}

function Mannequin() {
  const meshRef =
    useRef<THREE.Group>(null);

  return (
    <group
      ref={meshRef}
      rotation={[0, 0.15, 0]}
      position={[0, -1.2, 0]}
    >
      <mesh position={[0, 2.2, 0]}>
        <sphereGeometry
          args={[0.45, 64, 64]}
        />

        <meshStandardMaterial
          color="#111"
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>

      <mesh position={[0, 1.05, 0]}>
        <capsuleGeometry
          args={[0.9, 2.1, 16, 32]}
        />

        <meshStandardMaterial
          color="#121717"
          metalness={0.75}
          roughness={0.2}
        />
      </mesh>

      <mesh
        position={[-1.1, 1, 0]}
        rotation={[0, 0, 0.2]}
      >
        <capsuleGeometry
          args={[0.22, 1.7, 12, 24]}
        />

        <meshStandardMaterial
          color="#0f1212"
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>

      <mesh
        position={[1.1, 1, 0]}
        rotation={[0, 0, -0.2]}
      >
        <capsuleGeometry
          args={[0.22, 1.7, 12, 24]}
        />

        <meshStandardMaterial
          color="#0f1212"
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>

      <mesh
        position={[-0.42, -1.3, 0]}
      >
        <capsuleGeometry
          args={[0.28, 1.9, 12, 24]}
        />

        <meshStandardMaterial
          color="#101515"
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>

      <mesh
        position={[0.42, -1.3, 0]}
      >
        <capsuleGeometry
          args={[0.28, 1.9, 12, 24]}
        />

        <meshStandardMaterial
          color="#101515"
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

function Header() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        backdropFilter: 'blur(24px)',
        background:
          'rgba(5,8,7,0.72)',
        borderBottom:
          '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <nav
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          height: 86,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={brandMark}>
            S
          </div>

          <div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 1000,
              }}
            >
              Stitchra
            </div>

            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.18em',
                color:
                  'rgba(255,255,255,0.48)',
              }}
            >
              AI EMBROIDERY PLATFORM
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 28,
            alignItems: 'center',
          }}
        >
          <NavLink>
            Workflow
          </NavLink>

          <NavLink>
            Machine
          </NavLink>

          <NavLink>
            Gallery
          </NavLink>

          <GlowButton>
            Start Designing →
          </GlowButton>
        </div>
      </nav>
    </header>
  );
}

function HoverCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        ...style,
        transition:
          'all 0.35s cubic-bezier(0.22,1,0.36,1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform =
          'translateY(-8px) scale(1.01)';

        e.currentTarget.style.boxShadow =
          '0 50px 140px rgba(0,0,0,0.58)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform =
          'translateY(0px) scale(1)';

        e.currentTarget.style.boxShadow