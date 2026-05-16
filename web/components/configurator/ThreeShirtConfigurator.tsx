'use client';

import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import {
  clampLogoPlacementConfig,
  formatLogoSize,
  getEmbroideryZone,
} from '@/lib/embroideryZones';
import FlatShirtConfigurator from './FlatShirtConfigurator';
import type { ShirtConfiguratorProps } from './types';

const WORLD_PER_MM = 0.00635;
// Temporary prototype 3D asset. Replace with original Stitchra 3D garment model before final commercial launch.
const PROTOTYPE_SHIRT_MODEL_PATH = '/models/stitchra-shirt-prototype.glb';
const PROTOTYPE_SHIRT_MODEL_MANIFEST =
  '/models/stitchra-shirt-prototype.json';

const zoneCenters = {
  left_chest: new THREE.Vector3(0.42, 0.47, 0.13),
  center_front: new THREE.Vector3(0, 0.02, 0.13),
};

function hasWebGLSupport() {
  if (typeof document === 'undefined') {
    return false;
  }

  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') || canvas.getContext('webgl')
    );
  } catch {
    return false;
  }
}

function shouldUseFlatPerformanceFallback() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return true;
  }

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const narrowScreen = window.matchMedia('(max-width: 520px)').matches;
  const memory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;

  return Boolean(
    reducedMotion ||
      (coarsePointer && narrowScreen && memory !== undefined && memory <= 4)
  );
}

function getLogoWorldPosition(config: ShirtConfiguratorProps['config']) {
  const zone = getEmbroideryZone(config.placement_zone);
  const center = zoneCenters[config.placement_zone];
  const zoneWidth = zone.maxWidthMm * WORLD_PER_MM;
  const zoneHeight = zone.maxHeightMm * WORLD_PER_MM;
  const logoWidth = config.logo_width_mm * WORLD_PER_MM;
  const logoHeight = config.logo_height_mm * WORLD_PER_MM;

  return new THREE.Vector3(
    center.x + (config.logo_position_x - 0.5) * (zoneWidth - logoWidth),
    center.y - (config.logo_position_y - 0.5) * (zoneHeight - logoHeight),
    center.z
  );
}

class ModelFallbackBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: unknown) {
    console.warn('Prototype shirt model unavailable; using flat preview.', error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function PrototypeShirtModel({
  shirtColor,
}: {
  shirtColor: 'black' | 'white';
}) {
  const { scene } = useGLTF(PROTOTYPE_SHIRT_MODEL_PATH);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const material = new THREE.MeshStandardMaterial({
      color: shirtColor === 'white' ? '#f3efe6' : '#101a1b',
      roughness: shirtColor === 'white' ? 0.78 : 0.88,
      metalness: 0.02,
    });

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = material;
      }
    });

    return clone;
  }, [scene, shirtColor]);

  return (
    <primitive
      object={model}
      position={[0, -0.1, -0.08]}
      rotation={[0, Math.PI, 0]}
      scale={1.35}
    />
  );
}

function LogoPlane({
  logoUrl,
  config,
  shirtColor,
}: {
  logoUrl: string;
  config: ShirtConfiguratorProps['config'];
  shirtColor: 'black' | 'white';
}) {
  const texture = useTexture(logoUrl);
  const position = getLogoWorldPosition(config);

  // TODO: Replace this clean planar projection with exact UV/decal placement when the final shirt model is available.
  return (
    <mesh position={position}>
      <planeGeometry
        args={[
          config.logo_width_mm * WORLD_PER_MM,
          config.logo_height_mm * WORLD_PER_MM,
        ]}
      />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        toneMapped={false}
        opacity={shirtColor === 'white' ? 0.9 : 0.84}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );
}

function ZonePlane({
  config,
  placementZone,
  shirtColor,
  logoAspectRatio,
  onConfigChange,
}: Omit<ShirtConfiguratorProps, 'logoUrl'>) {
  const [dragging, setDragging] = useState(false);
  const zone = getEmbroideryZone(placementZone);
  const center = zoneCenters[placementZone];
  const width = zone.maxWidthMm * WORLD_PER_MM;
  const height = zone.maxHeightMm * WORLD_PER_MM;

  const updateFromPoint = (event: ThreeEvent<PointerEvent>) => {
    const logoWidth = config.logo_width_mm * WORLD_PER_MM;
    const logoHeight = config.logo_height_mm * WORLD_PER_MM;
    const xRange = Math.max(0.001, width - logoWidth);
    const yRange = Math.max(0.001, height - logoHeight);
    const normalizedX = (event.point.x - center.x) / xRange + 0.5;
    const normalizedY = (center.y - event.point.y) / yRange + 0.5;

    onConfigChange(
      clampLogoPlacementConfig(
        {
          ...config,
          placement_zone: placementZone,
          shirt_color: shirtColor,
          logo_position_x: normalizedX,
          logo_position_y: normalizedY,
        },
        logoAspectRatio
      )
    );
  };

  return (
    <mesh
      position={center}
      onPointerDown={(event) => {
        event.stopPropagation();
        setDragging(true);
        updateFromPoint(event);
      }}
      onPointerMove={(event) => {
        if (dragging) {
          event.stopPropagation();
          updateFromPoint(event);
        }
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
        setDragging(false);
      }}
      onPointerCancel={() => setDragging(false)}
    >
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        color="#7cf0d4"
        transparent
        opacity={0.13}
        depthWrite={false}
      />
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(width, height)]} />
        <lineBasicMaterial color="#7cf0d4" transparent opacity={0.82} />
      </lineSegments>
    </mesh>
  );
}

function ConfiguratorScene(props: ShirtConfiguratorProps) {
  return (
    <>
      <ambientLight intensity={0.72} />
      <directionalLight position={[3, 4, 5]} intensity={1.35} castShadow />
      <pointLight position={[-2.8, 1.8, 3]} intensity={1.2} color="#00c8ff" />
      <pointLight position={[2.4, -1.4, 2]} intensity={0.85} color="#00ff88" />

      <group rotation={[0.08, 0, 0]} position={[0, -0.12, 0]} scale={0.78}>
        <PrototypeShirtModel shirtColor={props.shirtColor} />
        <ZonePlane {...props} />
        {props.logoUrl && (
          <Suspense fallback={null}>
            <LogoPlane
              logoUrl={props.logoUrl}
              config={props.config}
              shirtColor={props.shirtColor}
            />
          </Suspense>
        )}
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.48, -0.18]}>
        <circleGeometry args={[1.72, 96]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.32} />
      </mesh>

      <OrbitControls
        enableRotate
        enableZoom
        enablePan={false}
        minPolarAngle={Math.PI / 2.8}
        maxPolarAngle={Math.PI / 1.9}
        minDistance={3.15}
        maxDistance={5.4}
        target={[0, 0.02, 0]}
      />
    </>
  );
}

export default function ThreeShirtConfigurator(
  props: ShirtConfiguratorProps
) {
  const [canUse3D] = useState(
    () => hasWebGLSupport() && !shouldUseFlatPerformanceFallback()
  );
  const [modelAvailability, setModelAvailability] = useState<
    'checking' | 'available' | 'unavailable'
  >('checking');
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const zone = getEmbroideryZone(props.placementZone);

  useEffect(() => {
    if (!canUse3D) {
      return;
    }

    let cancelled = false;

    fetch(PROTOTYPE_SHIRT_MODEL_MANIFEST, {
      cache: 'no-store',
    })
      .then(async (response) => {
        const payload = response.ok
          ? ((await response.json().catch(() => null)) as {
              available?: boolean;
            } | null)
          : null;

        if (!cancelled) {
          setModelAvailability(
            payload?.available ? 'available' : 'unavailable'
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setModelAvailability('unavailable');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canUse3D]);

  useEffect(() => {
    const element = cardRef.current;

    if (!element || !canUse3D || modelAvailability !== 'available') {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '180px',
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [canUse3D, modelAvailability]);

  if (!canUse3D || modelAvailability === 'unavailable') {
    return <FlatShirtConfigurator {...props} />;
  }

  return (
    <ModelFallbackBoundary fallback={<FlatShirtConfigurator {...props} />}>
      <div ref={cardRef} className="shirt-configurator-card" style={cardStyle}>
        <div style={topBarStyle}>
          <span style={badgeStyle}>360° prototype</span>
          <span style={metaStyle}>
            Placement: {zone.label} · Logo size: {formatLogoSize(props.config)}
          </span>
        </div>

        {modelAvailability === 'available' && isVisible ? (
          <Canvas
            shadows
            dpr={[1, 1.75]}
            camera={{
              position: [0, 0.08, 4.8],
              fov: 36,
              near: 0.1,
              far: 100,
            }}
            gl={{
              alpha: true,
              antialias: true,
              powerPreference: 'high-performance',
              preserveDrawingBuffer: true,
            }}
            style={{
              position: 'absolute',
              inset: 0,
            }}
          >
            <fog attach="fog" args={['#050607', 5.5, 8]} />
            <Suspense fallback={null}>
              <ConfiguratorScene {...props} />
            </Suspense>
          </Canvas>
        ) : (
          <div style={loadingStyle}>Loading 3D preview...</div>
        )}

        <div style={bottomHintStyle}>
          Drag to rotate the shirt. Drag the logo within the highlighted
          embroidery zone.
        </div>
      </div>
    </ModelFallbackBoundary>
  );
}

const cardStyle: CSSProperties = {
  position: 'relative',
  minHeight: 650,
  borderRadius: 36,
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.10)',
  background:
    'radial-gradient(circle at 50% 12%, rgba(0,255,136,0.18), transparent 30%), linear-gradient(145deg,rgba(3,5,7,0.98),rgba(8,15,17,0.94) 48%,rgba(2,3,5,0.98))',
  boxShadow:
    '0 44px 130px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.08)',
  isolation: 'isolate',
};

const topBarStyle: CSSProperties = {
  position: 'absolute',
  zIndex: 4,
  top: 20,
  left: 20,
  right: 20,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  alignItems: 'center',
  flexWrap: 'wrap',
  padding: '10px 14px',
  borderRadius: 16,
  background: 'rgba(0,0,0,0.46)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 18px 45px rgba(0,0,0,0.32)',
};

const badgeStyle: CSSProperties = {
  color: '#9dffc4',
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const metaStyle: CSSProperties = {
  color: 'rgba(245,247,248,0.72)',
  fontSize: 13,
  fontWeight: 750,
};

const loadingStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  color: '#9dffc4',
  fontWeight: 850,
  background:
    'radial-gradient(circle at 50% 35%, rgba(0,255,136,0.13), transparent 28%)',
};

const bottomHintStyle: CSSProperties = {
  position: 'absolute',
  left: 22,
  right: 22,
  bottom: 18,
  zIndex: 4,
  margin: 0,
  padding: '10px 14px',
  borderRadius: 14,
  background: 'rgba(0,0,0,0.38)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(245,247,248,0.68)',
  fontSize: 13,
  textAlign: 'center',
};
