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
    icon: '🤖',
    title: 'AI logo generator',
    text: 'Describe a logo idea and create a quick embroidery-style concept instantly.',
  },
  {
    icon: '🧵',
    title: 'Stitch estimator',
    text: 'Upload artwork and get an instant stitch, coverage, color and price estimate.',
  },
  {
    icon: '👕',
    title: '3D tee preview',
    text: 'Preview placement on a dark or light T-shirt before producing the design.',
  },
  {
    icon: '⚡',
    title: 'Fast quoting',
    text: 'No endless messages. Customers understand cost and placement immediately.',
  },
];

const galleryItems = ['Monogram', 'Streetwear', 'Badge', 'Minimal'];

export default function Home() {
  const [teeColor, setTeeColor] = useState<TeeColor>('black');
  const [placement, setPlacement] = useState<Placement>('left');
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
    setStatus('');
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

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('width_mm', String(preset.widthMm));
      fd.append('height_mm', String(preset.heightMm));
      fd.append('colors', String(3));

      const res = await fetch(`${API}/estimate`, { method: 'POST', body: fd });
      if (!res.ok) {
        setStatus(`API error ${res.status}`);
        setError('API antwortet nicht. Prüfe Backend/Server.');
        return;
      }

      const data = (await res.json()) as Estimate;
      setEstimate(data);
      setStatus('Estimate ready.');
    } catch {
      setStatus('Network error');
      setError('Netzwerkfehler. Prüfe Railway/CORS.');
    } finally {
      setIsEstimating(false);
    }
  };

  const generateLogo = async () => {
    setError('');
    setStatus('');

    if (!logoPrompt.trim()) {
      setError('Beschreibe dein Logo, z.B. „minimal green monogram”.');
      return;
    }

    setIsGeneratingLogo(true);

    try {
      const fd = new FormData();
      fd.append('prompt', logoPrompt);
      const res = await fetch(`${API}/generate_logo`, { method: 'POST', body: fd });

      if (!res.ok) {
        setError('Logo-Generator fehlgeschlagen.');
        return;
      }

      const blob = await res.blob();
      const generatedFile = new File([blob], 'ai-logo.png', { type: 'image/png' });
      setFile(generatedFile);
      setPreview(URL.createObjectURL(blob));
      setEstimate(null);
      setStatus('AI logo ready. Now estimate the price.');
    } catch {
      setError('Logo-Generator Netzwerkfehler.');
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  const bg = useMemo(
    () =>
      'radial-gradient(circle at 18% 24%, rgba(0,255,136,0.16), transparent 26%),' +
      'radial-gradient(circle at 85% 18%, rgba(0,196,255,0.13), transparent 25%),' +
      'radial-gradient(circle at 52% 88%, rgba(255,0,200,0.08), transparent 28%),' +
      '#070908',
    []
  );

  const teeSurface =
    teeColor === 'black'
      ? 'linear-gradient(120deg, #090d10, #151c20 55%, #0b0f13)'
      : 'linear-gradient(120deg, #f7f9ff, #dfe6ff 55%, #ffffff)';

  return (
    <main style={{ minHeight: '100vh', background: bg, color: '#f4f7f8', fontFamily: 'Inter, "SF Pro Display", system-ui, -apple-system, sans-serif', overflowX: 'hidden', position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: '96px 96px', maskImage: 'radial-gradient(circle at 50% 20%, black, transparent 72%)' }} />
      <div style={{ position: 'fixed', top: 90, left: -160, width: 460, height: 460, borderRadius: 999, background: 'rgba(0,255,136,0.16)', filter: 'blur(95px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', right: -180, top: 130, width: 560, height: 560, borderRadius: 999, background: 'rgba(0,196,255,0.12)', filter: 'blur(105px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', left: '42%', bottom: -260, width: 520, height: 520, borderRadius: 999, background: 'rgba(255,0,200,0.07)', filter: 'blur(120px)', pointerEvents: 'none' }} />

      <Header />

      <section id="hero" style={{ minHeight: 'calc(100vh - 82px)', display: 'grid', placeItems: 'center', padding: '72px 24px 54px', position: 'relative' }}>
        <div style={{ width: '100%', maxWidth: 1240, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 46, alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div style={heroGlassCard}>
            <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center', padding: '8px 12px', borderRadius: 999, background: 'rgba(0,255,136,0.12)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.28)', fontSize: 13, fontWeight: 700, marginBottom: 18 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: '#00ff88', boxShadow: '0 0 16px #00ff88' }} />
              Machine-aware embroidery platform
            </div>

            <h1 style={{ fontSize: 'clamp(44px, 7vw, 82px)', lineHeight: 0.96, letterSpacing: '-0.07em', margin: '0 0 20px', fontWeight: 950 }}>
              Build your own <span style={{ display: 'block', color: '#00ff88' }}>3D embroidery fit</span>
            </h1>

            <p style={{ maxWidth: 580, fontSize: 18, lineHeight: 1.6, color: 'rgba(244,247,248,0.72)', marginBottom: 28 }}>
              Preview your design on a mannequin-style model, estimate stitch count, machine time and production pricing before anything goes to the embroidery machine.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
              <a href="#designer" style={primaryButton}>Start 3D Preview →</a>
              <a href="#how" style={secondaryButton}>See Machine Workflow</a>
            </div>

            <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', color: 'rgba(244,247,248,0.76)', fontSize: 13 }}>
              <div style={{ display: 'flex' }}>
                {['S', 'M', 'A'].map((letter, index) => (
                  <span key={letter} style={{ width: 28, height: 28, marginLeft: index ? -8 : 0, borderRadius: 999, display: 'grid', placeItems: 'center', color: '#07100b', fontWeight: 900, background: index === 0 ? '#00f0ff' : index === 1 ? '#ff3bd4' : '#d5ff4f', border: '2px solid #070908' }}>{letter}</span>
                ))}
              </div>
              <span>Join 10,000+ creators</span>
              <span style={{ color: '#ffd84d' }}>★★★★★ 4.9/5</span>
            </div>
          </div>

          <MannequinPreview preset={preset} preview={preview} />
        </div>

        <a href="#how" style={{ position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)', color: 'rgba(244,247,248,0.6)', textDecoration: 'none', fontSize: 11, display: 'grid', gap: 6, placeItems: 'center' }}>
          Scroll to explore
          <span style={{ color: '#00ff88', fontSize: 18 }}>⌄</span>
        </a>
      </section>

      <section id="designer" style={{ padding: '84px 24px', position: 'relative', zIndex: 1 }}>
        <SectionHeader eyebrow="Live designer" title="Build your embroidery-ready tee" text="Upload a logo, generate an idea or switch placement and colors. The backend calculates a real quote from your image." />

        <div style={{ maxWidth: 1180, margin: '40px auto 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, alignItems: 'stretch' }}>
          <div style={glassCard}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12, marginBottom: 20 }}>
              <MiniStat label="Thread colors" value="Auto ≤ 6" />
              <MiniStat label="Pricing" value="From €10" />
              <MiniStat label="Coverage" value="Calculated" />
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={() => setTeeColor('black')} style={teeColor === 'black' ? activeToggle : toggleButton}>Midnight</button>
                <button onClick={() => setTeeColor('white')} style={teeColor === 'white' ? activeToggle : toggleButton}>Ice</button>
              </div>

              <label style={labelStyle}>Placement</label>
              <select value={placement} onChange={onPlacementChange} style={inputStyle}>
                <option value="left">Left chest (small badge)</option>
                <option value="center">Center front (statement)</option>
              </select>

              <label style={labelStyle}>Logo upload</label>
              <input type="file" accept="image/*" onChange={onFile} style={{ padding: '12px 0', color: '#f4f7f8' }} />

              <label style={labelStyle}>Or describe a logo (AI)</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input type="text" value={logoPrompt} onChange={(e) => setLogoPrompt(e.target.value)} placeholder="e.g. minimal monogram in green" style={{ ...inputStyle, flex: '1 1 220px' }} />
                <button type="button" onClick={generateLogo} disabled={isGeneratingLogo} style={{ ...primaryButton, border: 'none', minWidth: 160, opacity: isGeneratingLogo ? 0.65 : 1 }}>
                  {isGeneratingLogo ? 'Generating…' : 'Generate logo'}
                </button>
              </div>

              <button onClick={getQuote} disabled={isEstimating} style={{ ...primaryButton, border: 'none', width: '100%', opacity: isEstimating ? 0.65 : 1 }}>
                {isEstimating ? 'Calculating…' : 'Estimate stitches & price'}
              </button>

              {(status || error) && <div style={{ fontSize: 13, color: error ? '#ffb4b4' : '#cde7ff' }}>{error || status}</div>}

              {estimate && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 12 }}>
                  <Metric label="Stitches" value={estimate.stitches.toLocaleString()} />
                  <Metric label="Colors" value={estimate.colors} />
                  <Metric label="Coverage" value={`${(estimate.coverage * 100).toFixed(1)}%`} />
                  <Metric label="Price" value={`€${estimate.price_eur.toFixed(2)}`} />
                </div>
              )}
            </div>
          </div>

          <DesignerPreview teeSurface={teeSurface} teeColor={teeColor} preset={preset} preview={preview} large />
        </div>
      </section>

      <section id="how" style={sectionStyle}>
        <SectionHeader eyebrow="Simple process" title="How It Works" text="Design your custom T-shirt in 3 simple steps. No design skills required." />
        <div style={threeGrid}>
          <StepCard number="01" icon="👕" title="Choose Your Shirt" text="Select your T-shirt color, size and placement. Start with a clean black or white canvas." />
          <StepCard number="02" icon="🪄" title="Generate AI Logo" text="Describe your idea in plain English. Create a first logo concept or upload your own design." />
          <StepCard number="03" icon="📦" title="Preview & Order" text="See the logo on the tee and get instant pricing based on stitches, colors and coverage." />
        </div>
      </section>

      <section id="features" style={sectionStyle}>
        <SectionHeader eyebrow="Features" title="Everything needed for fast custom embroidery" text="From visual preview to instant pricing, Stitchra gives customers confidence before ordering." />
        <div style={{ maxWidth: 1180, margin: '40px auto 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
          {features.map((feature) => (
            <div key={feature.title} style={featureCard}>
              <div style={iconBox}>{feature.icon}</div>
              <h3 style={{ margin: '18px 0 10px', fontSize: 20 }}>{feature.title}</h3>
              <p style={{ margin: 0, color: 'rgba(244,247,248,0.62)', lineHeight: 1.6 }}>{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="gallery" style={sectionStyle}>
        <SectionHeader eyebrow="Gallery" title="Made for modern creators" text="A clean visual direction for brand badges, small chest logos, statement fronts and minimal streetwear." />
        <div style={{ maxWidth: 1180, margin: '40px auto 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
          {galleryItems.map((item, index) => (
            <div key={item} style={{ ...glassCard, minHeight: 220, display: 'grid', alignContent: 'space-between' }}>
              <div style={{ width: 72, height: 72, borderRadius: 22, background: index % 2 ? 'rgba(0,196,255,0.13)' : 'rgba(0,255,136,0.13)', border: '1px solid rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center', fontSize: 28 }}>✦</div>
              <div>
                <h3 style={{ margin: '22px 0 8px', fontSize: 22 }}>{item}</h3>
                <p style={{ margin: 0, color: 'rgba(244,247,248,0.58)' }}>Logo-ready mockup style for fast embroidery quotes.</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" style={sectionStyle}>
        <SectionHeader eyebrow="Pricing" title="Transparent estimate before production" text="Start with a base cost, then calculate by stitch count and colors. Your current backend already does this automatically." />
        <div style={{ maxWidth: 860, margin: '40px auto 0', ...glassCard }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            <PriceBlock label="Base" value="€3.50" />
            <PriceBlock label="Per 1k stitches" value="€1.00" />
            <PriceBlock label="Color fee" value="€0.75" />
            <PriceBlock label="Minimum" value="€10" highlight />
          </div>
          <a href="#designer" style={{ ...primaryButton, display: 'block', textAlign: 'center', marginTop: 20 }}>Try the estimator →</a>
        </div>
      </section>

      <section style={{ padding: '92px 24px 120px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 940, margin: '0 auto', textAlign: 'center', padding: 38, borderRadius: 32, background: 'linear-gradient(135deg, rgba(0,255,136,0.14), rgba(0,196,255,0.08))', border: '1px solid rgba(0,255,136,0.18)', boxShadow: '0 34px 100px rgba(0,0,0,0.34)' }}>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 62px)', lineHeight: 1.02, margin: '0 0 16px', letterSpacing: '-0.05em' }}>Ready to create your first custom tee?</h2>
          <p style={{ color: 'rgba(244,247,248,0.72)', fontSize: 17, marginBottom: 24 }}>Upload a logo and get an instant embroidery quote now.</p>
          <a href="#designer" style={primaryButton}>Start Creating Now →</a>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '34px 24px', position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.18)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', color: 'rgba(244,247,248,0.66)', fontSize: 14 }}>
          <div><strong style={{ color: '#f4f7f8' }}>Stitchra</strong> · AI embroidery platform</div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
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
    <header style={{ position: 'sticky', top: 0, zIndex: 20, backdropFilter: 'blur(26px)', WebkitBackdropFilter: 'blur(26px)', background: 'linear-gradient(180deg, rgba(7,9,8,0.70), rgba(7,9,8,0.40))', borderBottom: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 18px 60px rgba(0,0,0,0.28)' }}>
      <nav style={{ maxWidth: 1240, margin: '0 auto', height: 86, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
        <a href="#hero" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#f4f7f8' }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 18,
              background: 'linear-gradient(135deg, rgba(0,255,136,0.22), rgba(0,196,255,0.14))',
              border: '1px solid rgba(255,255,255,0.10)',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 0 45px rgba(0,255,136,0.22)',
              color: '#b8ffc9',
              fontWeight: 1000,
              fontSize: 30,
              letterSpacing: '-0.08em',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            S
          </div>
          <div style={{ display: 'grid', gap: 2 }}>
            <div style={{ fontWeight: 1000, letterSpacing: '-0.06em', fontSize: 24, lineHeight: 1, background: 'linear-gradient(135deg, #ffffff, #9dffb8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Stitchra
            </div>
            <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(184,255,201,0.58)' }}>
              AI EMBROIDERY PLATFORM
            </div>
          </div>
        </a>

        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <a href="#how" style={navLink}>How It Works</a>
          <a href="#pricing" style={navLink}>Pricing</a>
          <a href="#gallery" style={navLink}>Gallery</a>
          <a href="#features" style={navLink}>Features</a>
          <a href="#designer" style={smallCta}>Start Designing →</a>
        </div>
      </nav>
    </header>
  );
}

function DesignerPreview({ teeSurface, teeColor, preset, preview, large = false }: { teeSurface: string; teeColor: TeeColor; preset: typeof placementPresets[Placement]; preview: string | null; large?: boolean }) {
  return (
    <div style={{ position: 'relative', minHeight: large ? 620 : 520 }}>
      <div style={{ position: 'absolute', inset: large ? -20 : 0, filter: 'blur(70px)', background: teeColor === 'black' ? 'rgba(0,255,136,0.18)' : 'rgba(0,196,255,0.14)', borderRadius: 34, transform: 'rotate(-3deg)' }} />
      <div style={{ position: 'relative', padding: large ? 20 : 14, perspective: '1400px' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 560, margin: '0 auto', aspectRatio: '3 / 4', borderRadius: 30, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', transformStyle: 'preserve-3d', transform: 'rotateY(-10deg) rotateX(7deg)', boxShadow: '0 30px 100px rgba(0,0,0,0.56)', background: 'radial-gradient(circle at 20% 25%, rgba(0,255,136,0.12), transparent 35%), #0b111a' }}>
          <div style={{ position: 'absolute', inset: '8%', borderRadius: 26, background: teeSurface, boxShadow: teeColor === 'black' ? '0 30px 80px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.02)' : '0 30px 80px rgba(136,176,255,0.2), inset 0 0 0 1px rgba(0,0,0,0.04)' }} />
          <div style={{ position: 'absolute', inset: '8%', borderRadius: 26, overflow: 'hidden', transform: 'translateZ(6px)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ position: 'absolute', top: preset.top, left: preset.left, width: preset.width, height: preset.height, border: '2px dashed #7cf0d4', borderRadius: 14, background: preview ? 'transparent' : 'rgba(0,255,136,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 6px 22px rgba(0,255,136,0.2)' }}>
              {preview && <Image src={preview} alt="logo preview" fill sizes="320px" unoptimized style={{ objectFit: 'contain', mixBlendMode: teeColor === 'black' ? 'screen' : 'multiply' }} />}
            </div>
          </div>
          <div style={{ position: 'absolute', top: 14, right: 14, padding: '8px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, letterSpacing: 0.4 }}>{preset.label} · {preset.size}</div>
          <div style={{ position: 'absolute', bottom: 18, left: 18, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 12px rgba(0,255,136,0.9)' }} />
            <div style={{ opacity: 0.8 }}>Embroidery view · 3D</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MannequinPreview({ preset, preview }: { preset: typeof placementPresets[Placement]; preview: string | null }) {
  return (
    <div style={{ position: 'relative', minHeight: 560 }}>
      <div style={{ position: 'absolute', inset: -20, borderRadius: 42, background: 'radial-gradient(circle at 50% 32%, rgba(0,255,136,0.18), transparent 32%), radial-gradient(circle at 70% 72%, rgba(0,196,255,0.10), transparent 35%)', filter: 'blur(56px)' }} />
      <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto', minHeight: 560, borderRadius: 36, overflow: 'hidden', background: 'linear-gradient(145deg, rgba(6,12,10,0.92), rgba(8,16,20,0.82))', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 36px 120px rgba(0,0,0,0.58), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: '54px 54px', opacity: 0.55 }} />
        <div style={{ position: 'absolute', top: 18, right: 18, padding: '8px 12px', borderRadius: 14, background: 'rgba(0,0,0,0.48)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 12, color: 'rgba(244,247,248,0.82)' }}>
          3D mannequin · {preset.label}
        </div>
        <div style={{ position: 'absolute', left: '50%', top: 72, transform: 'translateX(-50%)', width: 300, height: 430, perspective: 1100 }}>
          <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', width: 92, height: 92, borderRadius: '50%', background: 'linear-gradient(145deg, #262f2c, #0f1715)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: 'inset 0 18px 50px rgba(255,255,255,0.05), 0 22px 60px rgba(0,0,0,0.42)' }} />
          <div style={{ position: 'absolute', left: '50%', top: 86, transform: 'translateX(-50%) rotateX(4deg)', width: 230, height: 270, borderRadius: '46% 46% 28% 28%', background: 'linear-gradient(125deg, #101917, #1c2926 45%, #070b0a)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: 'inset 28px 0 65px rgba(255,255,255,0.035), inset -38px 0 80px rgba(0,0,0,0.45), 0 34px 80px rgba(0,0,0,0.50)' }}>
            <div style={{ position: 'absolute', left: '50%', top: 76, transform: 'translateX(-50%)', width: preset.width, height: preset.height, minWidth: 76, minHeight: 48, border: '2px dashed #7cf0d4', borderRadius: 14, background: preview ? 'rgba(0,0,0,0.12)' : 'rgba(0,255,136,0.07)', display: 'grid', placeItems: 'center', overflow: 'hidden', boxShadow: '0 0 30px rgba(0,255,136,0.22)' }}>
              {preview ? (
                <Image src={preview} alt="embroidered logo preview" fill sizes="240px" unoptimized style={{ objectFit: 'contain', mixBlendMode: 'screen' }} />
              ) : (
                <span style={{ fontSize: 11, color: 'rgba(124,240,212,0.78)', fontWeight: 800 }}>LOGO AREA</span>
              )}
            </div>
          </div>
          <div style={{ position: 'absolute', left: 5, top: 122, width: 62, height: 230, borderRadius: 999, background: 'linear-gradient(160deg, #111917, #060807)', transform: 'rotate(12deg)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', right: 5, top: 122, width: 62, height: 230, borderRadius: 999, background: 'linear-gradient(200deg, #111917, #060807)', transform: 'rotate(-12deg)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
        <div style={{ position: 'absolute', left: 22, bottom: 22, display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(244,247,248,0.76)', fontSize: 12 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: '#00ff88', boxShadow: '0 0 12px rgba(0,255,136,0.9)' }} />
          Mannequin fit preview
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ color: '#00ff88', fontSize: 12, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>{eyebrow}</div>
      <h2 style={{ fontSize: 'clamp(32px, 5vw, 54px)', lineHeight: 1.05, letterSpacing: '-0.055em', margin: '0 0 14px', fontWeight: 950 }}>{title}</h2>
      <p style={{ margin: 0, color: 'rgba(244,247,248,0.66)', fontSize: 16, lineHeight: 1.7 }}>{text}</p>
    </div>
  );
}

function StepCard({ number, icon, title, text }: { number: string; icon: string; title: string; text: string }) {
  return (
    <div style={{ ...glassCard, minHeight: 280 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(0,255,136,0.13)', color: '#00ff88', display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 950 }}>{number}</div>
        <div style={iconBox}>{icon}</div>
      </div>
      <h3 style={{ margin: '0 0 12px', fontSize: 20 }}>{title}</h3>
      <p style={{ margin: 0, color: 'rgba(244,247,248,0.62)', lineHeight: 1.65 }}>{text}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '13px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ fontSize: 12, opacity: 0.58 }}>{label}</div>
      <div style={{ fontWeight: 900, fontSize: 18 }}>{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ fontSize: 12, opacity: 0.65 }}>{label}</div>
      <div style={{ fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function PriceBlock({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ padding: 18, borderRadius: 18, background: highlight ? 'rgba(0,255,136,0.13)' : 'rgba(255,255,255,0.035)', border: highlight ? '1px solid rgba(0,255,136,0.26)' : '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
      <div style={{ color: 'rgba(244,247,248,0.58)', fontSize: 13, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 950, color: highlight ? '#00ff88' : '#f4f7f8' }}>{value}</div>
    </div>
  );
}

const sectionStyle: React.CSSProperties = { padding: '94px 24px', position: 'relative', zIndex: 1 };

const threeGrid: React.CSSProperties = { maxWidth: 1180, margin: '40px auto 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 22 };

const glassCard: React.CSSProperties = { background: 'linear-gradient(145deg, rgba(255,255,255,0.095), rgba(255,255,255,0.028))', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 28, padding: 24, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 34px 95px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.08)' };

const heroGlassCard: React.CSSProperties = { ...glassCard, padding: 34, borderRadius: 34, background: 'linear-gradient(135deg, rgba(255,255,255,0.11), rgba(255,255,255,0.032))', boxShadow: '0 36px 120px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.10)' };

const featureCard: React.CSSProperties = { ...glassCard, transition: 'transform 0.2s ease, border 0.2s ease' };

const iconBox: React.CSSProperties = { width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, rgba(0,255,136,0.18), rgba(0,196,255,0.12))', border: '1px solid rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center', fontSize: 21 };

const navLink: React.CSSProperties = { color: 'rgba(244,247,248,0.74)', textDecoration: 'none', fontSize: 14, fontWeight: 650 };

const footerLink: React.CSSProperties = { color: 'rgba(244,247,248,0.66)', textDecoration: 'none' };

const primaryButton: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 22px', borderRadius: 15, background: 'linear-gradient(135deg, #83ff9f, #00ff88)', color: '#06100b', textDecoration: 'none', fontWeight: 950, cursor: 'pointer', boxShadow: '0 18px 55px rgba(0,255,136,0.28)', border: '1px solid rgba(255,255,255,0.18)' };

const secondaryButton: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 21px', borderRadius: 15, background: 'rgba(255,255,255,0.06)', color: '#b8ffc9', border: '1px solid rgba(0,255,136,0.22)', textDecoration: 'none', fontWeight: 850, cursor: 'pointer', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' };

const smallCta: React.CSSProperties = { ...primaryButton, padding: '11px 16px', fontSize: 13 };

const toggleButton: React.CSSProperties = { flex: '1 1 120px', padding: '13px 14px', borderRadius: 15, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)', color: '#f4f7f8', cursor: 'pointer', fontWeight: 700 };

const activeToggle: React.CSSProperties = { ...toggleButton, border: '1px solid #00ff88', background: 'rgba(0,255,136,0.11)', color: '#ffffff' };

const labelStyle: React.CSSProperties = { fontSize: 13, color: 'rgba(244,247,248,0.74)' };

const inputStyle: React.CSSProperties = { padding: '13px 14px', borderRadius: 15, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.045)', color: '#f4f7f8', outline: 'none', width: '100%' };
