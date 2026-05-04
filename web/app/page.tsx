'use client';
import Image from 'next/image';
import { useMemo, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://stitchra-production.up.railway.app';

type Estimate = {
  stitches: number;
  colors: number;
  coverage: number;
  price_eur: number;
  width_mm: number;
  height_mm: number;
};

const placementPresets = {
  left: {
    label: 'Left chest',
    size: '90 × 60 mm',
    top: '32%',
    left: '56%',
    width: '24%',
    height: '13%'
  },
  center: {
    label: 'Center front',
    size: '250 × 200 mm',
    top: '40%',
    left: '30%',
    width: '50%',
    height: '35%'
  }
} as const;

export default function Home() {
  const [teeColor, setTeeColor] = useState<'black' | 'white'>('black');
  const [placement, setPlacement] = useState<'left' | 'center'>('left');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isEstimating, setIsEstimating] = useState<boolean>(false);
  const [logoPrompt, setLogoPrompt] = useState<string>('');
  const [isGeneratingLogo, setIsGeneratingLogo] = useState<boolean>(false);

  const preset = placementPresets[placement];

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setEstimate(null);
    setPreview(f ? URL.createObjectURL(f) : null);
    setError('');
  };

  const onPlacementChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === 'center' ? 'center' : 'left';
    setPlacement(value);
  };

  const getQuote = async () => {
    setError('');
    if (!file) {
      setStatus('Choose a logo image first.');
      setError('Bitte zuerst ein Logo hochladen.');
      return;
    }
    setStatus('Estimating…');
    setIsEstimating(true);

    // Practical defaults (left chest ≈ 3.5" wide)
    const width_mm = placement === 'left' ? 90 : 250;
    const height_mm = placement === 'left' ? 60 : 200;
    const colors = 3;

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('width_mm', String(width_mm));
      fd.append('height_mm', String(height_mm));
      fd.append('colors', String(colors));

      const res = await fetch(`${API}/estimate`, { method: 'POST', body: fd });
      if (!res.ok) {
        setStatus(`API error ${res.status}`);
        setError('API antwortet nicht. Prüfe URL/Server.');
        return;
      }
      const data = (await res.json()) as Estimate;
      setEstimate(data);
      setStatus('Done');
    } catch {
      setStatus('Network error');
      setError('Netzwerkfehler – bist du online?');
    } finally {
      setIsEstimating(false);
    }
  };

  const bg = useMemo(
    () =>
      'radial-gradient(circle at 12% 20%, rgba(139,255,216,0.16), transparent 26%),' +
      'radial-gradient(circle at 82% 0%, rgba(120,160,255,0.18), transparent 28%),' +
      '#05070c',
    []
  );

  const teeSurface =
    teeColor === 'black'
      ? 'linear-gradient(120deg, #0b0f14, #151c24 55%, #0d1218)'
      : 'linear-gradient(120deg, #f4f6fb, #dfe6ff 55%, #f8fbff)';

  return (
    <main
      style={{
        minHeight: '100vh',
        background: bg,
        color: '#e9f2ff',
        fontFamily: 'Inter, "SF Pro Display", system-ui, -apple-system, sans-serif',
        padding: '32px 24px 48px'
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '120px 120px',
          maskImage: 'radial-gradient(circle at 50% 40%, black, transparent 70%)'
        }}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #7cf0d4, #6aa7ff)',
                boxShadow: '0 12px 32px rgba(124, 240, 212, 0.24)',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
                color: '#04101a',
                letterSpacing: 0.5
              }}
            >
              3D
            </div>
            <div>
              <div style={{ fontWeight: 700, letterSpacing: 0.3 }}>StitchLab</div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>Embroidery playground</div>
            </div>
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>API: {API}</div>
        </header>

        <section
          style={{
            marginTop: 28,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 24,
            alignItems: 'center'
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: 24,
              backdropFilter: 'blur(16px)',
              boxShadow: '0 30px 70px rgba(0,0,0,0.35)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span
                style={{
                  padding: '6px 10px',
                  borderRadius: 999,
                  fontSize: 12,
                  background: 'rgba(124, 240, 212, 0.12)',
                  color: '#7cf0d4',
                  border: '1px solid rgba(124, 240, 212, 0.3)'
                }}
              >
                New · 3D preview
              </span>
              <span style={{ fontSize: 12, opacity: 0.7 }}>Instant stitch & price estimate</span>
            </div>
            <h1 style={{ fontSize: 34, lineHeight: 1.2, fontWeight: 800, marginBottom: 12 }}>
              Build your embroidery-ready tee in 3D.
            </h1>
            <p style={{ opacity: 0.72, marginBottom: 18 }}>
              Drop a logo, pick placement, see stitches and pricing instantly. Tuned for small chest hits or bold front graphics.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
              {[
                { label: 'Thread colors', value: 'Auto ≤ 6' },
                { label: 'Pricing', value: 'From €10' },
                { label: 'Coverage', value: 'Calculated' }
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    minWidth: 130
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.6 }}>{item.label}</div>
                  <div style={{ fontWeight: 700 }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {[
                  { id: 'black', label: 'Midnight' },
                  { id: 'white', label: 'Ice' }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setTeeColor(option.id as 'black' | 'white')}
                    style={{
                      flex: '1 1 120px',
                      padding: '12px 14px',
                      borderRadius: 14,
                      border: teeColor === option.id ? '1px solid #7cf0d4' : '1px solid rgba(255,255,255,0.12)',
                      background:
                        teeColor === option.id ? 'rgba(124, 240, 212, 0.12)' : 'rgba(255,255,255,0.03)',
                      color: '#e9f2ff',
                      cursor: 'pointer',
                      transition: 'border 0.2s ease, transform 0.2s ease'
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <label style={{ fontSize: 13, opacity: 0.75 }}>Placement</label>
              <select
                value={placement}
                onChange={onPlacementChange}
                style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#e9f2ff',
                  outline: 'none',
                  width: '100%'
                }}
              >
                <option value="left">Left chest (small badge)</option>
                <option value="center">Center front (statement)</option>
              </select>

              <label style={{ fontSize: 13, opacity: 0.75 }}>Logo upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={onFile}
                style={{
                  padding: '12px 0',
                  color: '#e9f2ff',
                  background: 'transparent'
                }}
              />

              <label style={{ fontSize: 13, opacity: 0.75 }}>Or describe a logo (AI)</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={logoPrompt}
                  onChange={(e) => setLogoPrompt(e.target.value)}
                  placeholder="e.g. minimal monogram in green"
                  style={{
                    flex: '1 1 200px',
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#e9f2ff',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={async () => {
                    setError('');
                    setStatus('');
                    if (!logoPrompt.trim()) {
                      setError('Beschreibe dein Logo, z.B. „Retro Script in Grün”.');
                      return;
                    }
                    setIsGeneratingLogo(true);
                    try {
                      const fd = new FormData();
                      fd.append('prompt', logoPrompt);
                      const res = await fetch(`${API}/generate_logo`, { method: 'POST', body: fd });
                      if (!res.ok) {
                        setError('Logo-Gen fehlgeschlagen (API).');
                        return;
                      }
                      const blob = await res.blob();
                      const generatedFile = new File([blob], 'ai-logo.png', { type: 'image/png' });
                      setFile(generatedFile);
                      const url = URL.createObjectURL(blob);
                      setPreview(url);
                      setEstimate(null);
                      setStatus('AI Logo ready – you can estimate now.');
                    } catch {
                      setError('Logo-Gen fehlgeschlagen (Netzwerk).');
                    } finally {
                      setIsGeneratingLogo(false);
                    }
                  }}
                  disabled={isGeneratingLogo}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 14,
                    border: 'none',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #7cf0d4, #6aa7ff)',
                    color: '#04101a',
                    cursor: 'pointer',
                    boxShadow: '0 12px 40px rgba(108, 200, 255, 0.35)',
                    opacity: isGeneratingLogo ? 0.7 : 1,
                    minWidth: 160
                  }}
                >
                  {isGeneratingLogo ? 'Generating…' : 'Generate logo'}
                </button>
              </div>

              <button
                onClick={getQuote}
                disabled={isEstimating}
                style={{
                  padding: '12px 16px',
                  borderRadius: 14,
                  border: 'none',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #7cf0d4, #6aa7ff)',
                  color: '#04101a',
                  cursor: 'pointer',
                  boxShadow: '0 12px 40px rgba(108, 200, 255, 0.35)',
                  opacity: isEstimating ? 0.7 : 1
                }}
              >
                {isEstimating ? 'Calculating…' : 'Estimate stitches & price'}
              </button>

              {(status || error) && (
                <div style={{ fontSize: 13, color: error ? '#ffb4b4' : '#cde7ff' }}>
                  {error || status}
                </div>
              )}

              {estimate && (
                <div
                  style={{
                    marginTop: 4,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16,
                    padding: 12
                  }}
                >
                  <Metric label="Stitches" value={estimate.stitches.toLocaleString()} />
                  <Metric label="Colors" value={estimate.colors} />
                  <Metric label="Coverage" value={`${(estimate.coverage * 100).toFixed(1)}%`} />
                  <Metric label="Price" value={`€${estimate.price_eur.toFixed(2)}`} />
                </div>
              )}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                inset: -18,
                filter: 'blur(70px)',
                background: teeColor === 'black' ? 'rgba(124, 240, 212, 0.22)' : 'rgba(106, 167, 255, 0.18)',
                borderRadius: 30,
                transform: 'rotate(-2deg)'
              }}
            />
            <div
              style={{
                position: 'relative',
                padding: 16,
                perspective: '1400px'
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '3 / 4',
                  borderRadius: 24,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transformStyle: 'preserve-3d',
                  transform: 'rotateY(-10deg) rotateX(8deg)',
                  boxShadow: '0 26px 80px rgba(0,0,0,0.45)',
                  background: 'radial-gradient(circle at 20% 25%, rgba(124, 240, 212, 0.12), transparent 35%), #0b111a'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: '8%',
                    borderRadius: 24,
                    background: teeSurface,
                    boxShadow:
                      teeColor === 'black'
                        ? '0 30px 80px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.02)'
                        : '0 30px 80px rgba(136,176,255,0.2), inset 0 0 0 1px rgba(0,0,0,0.04)'
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    inset: '8%',
                    borderRadius: 24,
                    overflow: 'hidden',
                    transform: 'translateZ(6px)',
                    border: '1px solid rgba(255,255,255,0.04)'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: preset.top,
                      left: preset.left,
                      width: preset.width,
                      height: preset.height,
                      border: '2px dashed #7cf0d4',
                      borderRadius: 14,
                      background: preview ? 'transparent' : 'rgba(124, 240, 212, 0.07)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      boxShadow: '0 6px 22px rgba(124, 240, 212, 0.2)'
                    }}
                  >
                    {preview && (
                      <Image
                        src={preview}
                        alt="logo preview"
                        fill
                        sizes="320px"
                        unoptimized
                        style={{
                          objectFit: 'contain',
                          mixBlendMode: teeColor === 'black' ? 'screen' : 'multiply'
                        }}
                      />
                    )}
                  </div>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    padding: '8px 12px',
                    borderRadius: 12,
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: 12,
                    letterSpacing: 0.4
                  }}
                >
                  {preset.label} · {preset.size}
                </div>

                <div
                  style={{
                    position: 'absolute',
                    bottom: 18,
                    left: 18,
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: 12,
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center'
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: '#7cf0d4',
                      boxShadow: '0 0 12px rgba(124, 240, 212, 0.9)'
                    }}
                  />
                  <div style={{ opacity: 0.8 }}>Embroidery view · 3D</div>
                </div>
              </div>
            </div>
            <p style={{ textAlign: 'center', marginTop: 10, fontSize: 13, opacity: 0.7 }}>
              Move fast with a 3D-ish tee stage. Drag & drop rotation coming next.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)'
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.65 }}>{label}</div>
      <div style={{ fontWeight: 800 }}>{value}</div>
    </div>
  );
}
