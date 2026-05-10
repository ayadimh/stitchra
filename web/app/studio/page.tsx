'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

const API =
  process.env.NEXT_PUBLIC_API_URL ??
  'https://stitchra-production.up.railway.app';

type Placement = 'left' | 'center';
type ShirtColor = 'black' | 'white';

type CostBreakdown = {
  blank_tshirt_eur: number;
  backing_eur: number;
  thread_and_bobbin_eur: number;
  needle_wear_eur: number;
  electricity_eur: number;
  packaging_eur: number;
  waste_buffer_eur: number;
  machine_payback_eur: number;
  labor_eur: number;
  color_complexity_fee_eur: number;
};

type PublicQuote = {
  stitches: number;
  colors: number;
  coverage: number;
  price_eur: number | null;
  manual_quote: boolean;
  pricing_tier: string;
  customer_warnings: string[];
  customer_recommendations: string[];
};

type InternalQuote = {
  internal_cost_eur: number;
  estimated_profit_eur: number | null;
  profit_margin_percent: number | null;
  cost_breakdown: CostBreakdown;
  technical_warnings: string[];
  production_notes: string[];
};

type EstimateResponse = {
  stitches: number;
  colors: number;
  coverage: number;
  price_eur: number | null;
  manual_quote: boolean;
  pricing_tier: string;
  warnings: string[];
  recommendations: string[];
  internal_cost_eur: number;
  estimated_profit_eur: number | null;
  cost_breakdown: CostBreakdown;
  public_quote?: PublicQuote;
  internal_quote?: InternalQuote;
};

type LogoAnalysis = {
  processed_png: string;
  colors_count: number;
  contrast_score: number;
  warnings: string[];
  recommendations: string[];
};

const placementSize = {
  left: { width: 90, height: 60, label: 'Left chest' },
  center: { width: 250, height: 200, label: 'Center front' },
} as const;

const breakdownLabels: Array<[keyof CostBreakdown, string]> = [
  ['blank_tshirt_eur', 'Blank shirt'],
  ['backing_eur', 'Backing'],
  ['thread_and_bobbin_eur', 'Thread and bobbin'],
  ['needle_wear_eur', 'Needle wear'],
  ['electricity_eur', 'Electricity'],
  ['packaging_eur', 'Packaging'],
  ['waste_buffer_eur', 'Waste buffer'],
  ['machine_payback_eur', 'Studio payback'],
  ['labor_eur', 'Labor'],
  ['color_complexity_fee_eur', 'Color complexity'],
];

async function dataUrlToFile(dataUrl: string, name: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  return new File([blob], name, {
    type: 'image/png',
  });
}

function getPublicQuote(estimate: EstimateResponse): PublicQuote {
  return (
    estimate.public_quote ?? {
      stitches: estimate.stitches,
      colors: estimate.colors,
      coverage: estimate.coverage,
      price_eur: estimate.price_eur,
      manual_quote: estimate.manual_quote,
      pricing_tier: estimate.pricing_tier,
      customer_warnings: estimate.warnings,
      customer_recommendations: estimate.recommendations,
    }
  );
}

function getInternalQuote(estimate: EstimateResponse): InternalQuote {
  return (
    estimate.internal_quote ?? {
      internal_cost_eur: estimate.internal_cost_eur,
      estimated_profit_eur: estimate.estimated_profit_eur,
      profit_margin_percent:
        estimate.price_eur && estimate.estimated_profit_eur
          ? Number(
              (
                (estimate.estimated_profit_eur / estimate.price_eur) *
                100
              ).toFixed(1)
            )
          : null,
      cost_breakdown: estimate.cost_breakdown,
      technical_warnings: estimate.warnings,
      production_notes: [],
    }
  );
}

export default function StudioPage() {
  const expectedPasscode =
    process.env.NEXT_PUBLIC_STUDIO_PASSCODE ??
    (process.env.NODE_ENV === 'development'
      ? 'stitchra-dev'
      : '');

  const [passcode, setPasscode] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [gateError, setGateError] = useState('');

  const [placement, setPlacement] = useState<Placement>('left');
  const [shirtColor, setShirtColor] = useState<ShirtColor>('black');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<LogoAnalysis | null>(null);
  const [estimate, setEstimate] = useState<EstimateResponse | null>(
    null
  );
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const publicQuote = estimate ? getPublicQuote(estimate) : null;
  const internalQuote = estimate ? getInternalQuote(estimate) : null;

  const productionLabels = useMemo(() => {
    const labels = new Set(
      internalQuote?.production_notes ?? []
    );

    if (analysis && analysis.contrast_score < 42) {
      labels.add('Low contrast');
    }

    return Array.from(labels);
  }, [analysis, internalQuote]);

  const unlock = () => {
    if (!expectedPasscode) {
      setGateError(
        'Studio passcode is not configured for this deployment.'
      );
      return;
    }

    if (passcode === expectedPasscode) {
      setUnlocked(true);
      setGateError('');
      return;
    }

    setGateError('Wrong passcode.');
  };

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;

    setFile(selected);
    setEstimate(null);
    setAnalysis(null);
    setError('');
    setStatus('');
    setPreview(selected ? URL.createObjectURL(selected) : null);
  };

  const runStudioQuote = async () => {
    if (!file) {
      setError('Upload a logo first.');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('Analyzing artwork...');

    try {
      let quoteFile = file;
      let colors = 3;

      const analysisData = new FormData();
      analysisData.append('file', file);
      analysisData.append('tee_color', shirtColor);

      const analysisResponse = await fetch(`${API}/analyze_logo`, {
        method: 'POST',
        body: analysisData,
      });

      if (analysisResponse.ok) {
        const result =
          (await analysisResponse.json()) as LogoAnalysis;
        setAnalysis(result);
        setPreview(result.processed_png);
        quoteFile = await dataUrlToFile(
          result.processed_png,
          'studio-logo.png'
        );
        colors = Math.max(1, result.colors_count);
      }

      setStatus('Calculating quote...');

      const size = placementSize[placement];
      const estimateData = new FormData();
      estimateData.append('file', quoteFile);
      estimateData.append('width_mm', String(size.width));
      estimateData.append('height_mm', String(size.height));
      estimateData.append('colors', String(colors));

      const estimateResponse = await fetch(`${API}/estimate`, {
        method: 'POST',
        body: estimateData,
      });

      if (!estimateResponse.ok) {
        throw new Error('Estimate failed');
      }

      const quote =
        (await estimateResponse.json()) as EstimateResponse;
      setEstimate(quote);
      setStatus('Studio quote ready.');
    } catch {
      setError('Could not calculate this studio quote.');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  if (!unlocked) {
    return (
      <main style={pageShell}>
        <section style={gateCard}>
          <div style={brandMark}>S</div>
          <p style={eyebrow}>Private studio</p>
          <h1 style={gateTitle}>Stitchra quote dashboard</h1>
          <p style={mutedText}>
            Internal pricing, production notes and profit visibility
            for the Stitchra team.
          </p>
          <div style={gateForm}>
            <input
              value={passcode}
              onChange={(event) =>
                setPasscode(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  unlock();
                }
              }}
              placeholder="Studio passcode"
              type="password"
              style={inputStyle}
            />
            <button onClick={unlock} style={primaryButton}>
              Enter studio
            </button>
          </div>
          {gateError && <p style={errorText}>{gateError}</p>}
          {process.env.NODE_ENV === 'development' && (
            <p style={tinyText}>
              Local fallback passcode for development:
              {' '}
              <strong>stitchra-dev</strong>
            </p>
          )}
        </section>
      </main>
    );
  }

  return (
    <main style={pageShell}>
      <header style={studioHeader}>
        <div>
          <p style={eyebrow}>Private studio</p>
          <h1 style={studioTitle}>Quote command center</h1>
        </div>
        <Link href="/" style={secondaryButton}>
          Public website
        </Link>
      </header>

      <section style={workspaceGrid}>
        <div style={panel}>
          <h2 style={panelTitle}>Artwork input</h2>
          <div style={controlGrid}>
            <label style={fieldLabel}>
              Placement
              <select
                value={placement}
                onChange={(event) =>
                  setPlacement(event.target.value as Placement)
                }
                style={inputStyle}
              >
                <option value="left">Left chest</option>
                <option value="center">Center front</option>
              </select>
            </label>
            <label style={fieldLabel}>
              Shirt color
              <select
                value={shirtColor}
                onChange={(event) =>
                  setShirtColor(event.target.value as ShirtColor)
                }
                style={inputStyle}
              >
                <option value="black">Black</option>
                <option value="white">White</option>
              </select>
            </label>
          </div>
          <label style={fieldLabel}>
            Upload logo
            <input
              type="file"
              accept="image/*"
              onChange={onFile}
              style={fileInputStyle}
            />
          </label>
          <button
            onClick={runStudioQuote}
            disabled={loading}
            style={{
              ...primaryButton,
              width: '100%',
              opacity: loading ? 0.68 : 1,
            }}
          >
            {loading ? 'Calculating...' : 'Analyze and price'}
          </button>
          {status && <p style={successText}>{status}</p>}
          {error && <p style={errorText}>{error}</p>}
        </div>

        <div style={panel}>
          <h2 style={panelTitle}>Preview</h2>
          <div
            style={{
              ...previewBox,
              background:
                shirtColor === 'white'
                  ? 'linear-gradient(135deg, #f7f5ef, #d6ddd9)'
                  : 'linear-gradient(135deg, #090d0c, #19201d)',
            }}
          >
            {preview ? (
              <div
                style={{
                  ...logoPreview,
                  backgroundImage: `url(${preview})`,
                }}
              />
            ) : (
              <span style={mutedText}>No logo uploaded</span>
            )}
          </div>
          <div style={metaGrid}>
            <Meta label="Placement" value={placementSize[placement].label} />
            <Meta label="Shirt" value={`${shirtColor} tee`} />
            <Meta
              label="Size"
              value={`${placementSize[placement].width} x ${placementSize[placement].height} mm`}
            />
          </div>
        </div>
      </section>

      {publicQuote && internalQuote && (
        <>
          <section style={metricGrid}>
            <Metric label="Stitches" value={publicQuote.stitches.toLocaleString()} />
            <Metric label="Colors" value={publicQuote.colors} />
            <Metric
              label="Coverage"
              value={`${(publicQuote.coverage * 100).toFixed(1)}%`}
            />
            <Metric
              label="Customer price"
              value={
                publicQuote.manual_quote
                  ? 'Manual quote'
                  : `€${publicQuote.price_eur}`
              }
            />
            <Metric
              label="Internal cost"
              value={`€${internalQuote.internal_cost_eur.toFixed(2)}`}
            />
            <Metric
              label="Profit"
              value={
                internalQuote.estimated_profit_eur === null
                  ? 'Pending'
                  : `€${internalQuote.estimated_profit_eur.toFixed(2)}`
              }
            />
            <Metric
              label="Margin"
              value={
                internalQuote.profit_margin_percent === null
                  ? 'Pending'
                  : `${internalQuote.profit_margin_percent}%`
              }
            />
            <Metric label="Tier" value={publicQuote.pricing_tier} />
          </section>

          <section style={workspaceGrid}>
            <div style={panel}>
              <h2 style={panelTitle}>Production decision</h2>
              <div style={labelWrap}>
                {productionLabels.map((label) => (
                  <span key={label} style={decisionLabel}>
                    {label}
                  </span>
                ))}
              </div>
              <div style={noteStack}>
                {internalQuote.technical_warnings.map((warning) => (
                  <p key={warning} style={warningCard}>
                    {warning}
                  </p>
                ))}
                {publicQuote.customer_recommendations.map((recommendation) => (
                  <p key={recommendation} style={recommendationCard}>
                    {recommendation}
                  </p>
                ))}
                {analysis && (
                  <p style={mutedText}>
                    Contrast score:
                    {' '}
                    <strong>{analysis.contrast_score}/100</strong>
                  </p>
                )}
              </div>
            </div>

            <div style={panel}>
              <h2 style={panelTitle}>Internal cost breakdown</h2>
              <div style={breakdownTable}>
                {breakdownLabels.map(([key, label]) => (
                  <div key={key} style={breakdownRow}>
                    <span>{label}</span>
                    <strong>
                      €{internalQuote.cost_breakdown[key].toFixed(2)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function Meta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={metaCard}>
      <span>{label}</span>
      <strong>{value}</strong>
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
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const pageShell: CSSProperties = {
  minHeight: '100vh',
  padding: '40px clamp(18px, 4vw, 64px)',
  background:
    'radial-gradient(circle at 18% 8%, rgba(0,255,136,0.15), transparent 30%), radial-gradient(circle at 86% 22%, rgba(0,200,255,0.12), transparent 32%), #050607',
  color: '#f5f7f8',
  fontFamily:
    'var(--font-geist-sans), Inter, "Helvetica Neue", Arial, sans-serif',
};

const brandMark: CSSProperties = {
  width: 64,
  height: 64,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 22,
  background: 'linear-gradient(135deg, #00ff88, #00c8ff)',
  color: '#03100d',
  fontSize: 34,
  fontWeight: 950,
  marginBottom: 22,
};

const gateCard: CSSProperties = {
  width: 'min(560px, 100%)',
  margin: '10vh auto',
  padding: '42px',
  borderRadius: 30,
  border: '1px solid rgba(255,255,255,0.12)',
  background:
    'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.025))',
  boxShadow: '0 40px 120px rgba(0,0,0,0.45)',
};

const studioHeader: CSSProperties = {
  maxWidth: 1320,
  margin: '0 auto 28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 20,
  flexWrap: 'wrap',
};

const eyebrow: CSSProperties = {
  color: '#00ff88',
  fontSize: 12,
  fontWeight: 850,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  margin: '0 0 10px',
};

const gateTitle: CSSProperties = {
  fontSize: 'clamp(34px, 6vw, 62px)',
  lineHeight: 0.95,
  margin: 0,
};

const studioTitle: CSSProperties = {
  fontSize: 'clamp(34px, 5vw, 58px)',
  lineHeight: 0.95,
  margin: 0,
};

const mutedText: CSSProperties = {
  color: 'rgba(245,247,248,0.62)',
  lineHeight: 1.55,
};

const tinyText: CSSProperties = {
  color: 'rgba(245,247,248,0.38)',
  fontSize: 12,
  marginTop: 16,
};

const gateForm: CSSProperties = {
  display: 'grid',
  gap: 12,
  marginTop: 24,
};

const inputStyle: CSSProperties = {
  width: '100%',
  border: '1px solid rgba(255,255,255,0.13)',
  borderRadius: 16,
  background: 'rgba(255,255,255,0.055)',
  color: '#f5f7f8',
  padding: '14px 16px',
  fontSize: 15,
  outline: 'none',
};

const fileInputStyle: CSSProperties = {
  ...inputStyle,
  padding: 12,
};

const primaryButton: CSSProperties = {
  border: 0,
  borderRadius: 18,
  padding: '15px 20px',
  background: 'linear-gradient(135deg, #00ff88, #00c8ff)',
  color: '#03100d',
  fontSize: 15,
  fontWeight: 850,
  cursor: 'pointer',
};

const secondaryButton: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 18,
  padding: '13px 18px',
  color: '#f5f7f8',
  background: 'rgba(255,255,255,0.045)',
  textDecoration: 'none',
  fontWeight: 800,
};

const workspaceGrid: CSSProperties = {
  maxWidth: 1320,
  margin: '0 auto 20px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))',
  gap: 20,
};

const panel: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.11)',
  borderRadius: 28,
  padding: 'clamp(22px, 3vw, 32px)',
  background:
    'linear-gradient(145deg, rgba(255,255,255,0.075), rgba(255,255,255,0.025))',
  boxShadow: '0 30px 90px rgba(0,0,0,0.34)',
};

const panelTitle: CSSProperties = {
  margin: '0 0 18px',
  fontSize: 22,
};

const controlGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 14,
};

const fieldLabel: CSSProperties = {
  display: 'grid',
  gap: 9,
  color: 'rgba(245,247,248,0.68)',
  fontWeight: 750,
  marginBottom: 16,
};

const previewBox: CSSProperties = {
  minHeight: 300,
  borderRadius: 24,
  border: '1px solid rgba(255,255,255,0.10)',
  display: 'grid',
  placeItems: 'center',
  boxShadow: 'inset 0 0 70px rgba(0,0,0,0.35)',
};

const logoPreview: CSSProperties = {
  width: 150,
  height: 100,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundSize: 'contain',
  filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.35))',
};

const metaGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
  gap: 12,
  marginTop: 14,
};

const metaCard: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 18,
  padding: 14,
  background: 'rgba(0,0,0,0.26)',
};

const metricGrid: CSSProperties = {
  maxWidth: 1320,
  margin: '0 auto 20px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 14,
};

const metricCard: CSSProperties = {
  minHeight: 108,
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 22,
  padding: 18,
  background: 'rgba(255,255,255,0.045)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};

const labelWrap: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
};

const decisionLabel: CSSProperties = {
  padding: '9px 12px',
  borderRadius: 999,
  border: '1px solid rgba(0,255,136,0.24)',
  background: 'rgba(0,255,136,0.08)',
  color: '#9dffc4',
  fontSize: 13,
  fontWeight: 800,
};

const noteStack: CSSProperties = {
  display: 'grid',
  gap: 10,
  marginTop: 18,
};

const warningCard: CSSProperties = {
  border: '1px solid rgba(255,224,131,0.22)',
  borderRadius: 16,
  padding: 14,
  background: 'rgba(255,224,131,0.065)',
  color: '#ffe083',
  margin: 0,
};

const recommendationCard: CSSProperties = {
  border: '1px solid rgba(157,255,196,0.20)',
  borderRadius: 16,
  padding: 14,
  background: 'rgba(157,255,196,0.06)',
  color: '#9dffc4',
  margin: 0,
};

const breakdownTable: CSSProperties = {
  display: 'grid',
  gap: 10,
};

const breakdownRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  padding: '10px 0',
};

const successText: CSSProperties = {
  color: '#9dffc4',
  margin: '12px 0 0',
};

const errorText: CSSProperties = {
  color: '#ff9d9d',
  margin: '12px 0 0',
};
