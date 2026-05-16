'use client';

import { Suspense, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import {
  clampLogoPlacementConfig,
  formatLogoSize,
  getEmbroideryZone,
} from '@/lib/embroideryZones';
import FlatShirtConfigurator from './FlatShirtConfigurator';
import type { ShirtConfiguratorProps } from './types';

const WORLD_PER_MM = 0.00635;

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

function ShirtBody({ shirtColor }: { shirtColor: 'black' | 'white' }) {
  const shirtShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.9, -1.42);
    shape.lineTo(0.9, -1.42);
    shape.lineTo(1.02, -0.34);
    shape.lineTo(1.23, 0.82);
    shape.lineTo(0.72, 1.32);
    shape.lineTo(0.46, 1.32);
    shape.quadraticCurveTo(0.35, 1.07, 0.2, 1.01);
    shape.quadraticCurveTo(0, 0.94, -0.2, 1.01);
    shape.quadraticCurveTo(-0.35, 1.07, -0.46, 1.32);
    shape.lineTo(-0.72, 1.32);
    shape.lineTo(-1.23, 0.82);
    shape.lineTo(-1.02, -0.34);
    shape.closePath();
    return shape;
  }, []);
  const materialColor = shirtColor === 'white' ? '#f3efe6' : '#101a1b';
  const roughness = shirtColor === 'white' ? 0.82 : 0.9;

  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0, -0.05]}>
        <extrudeGeometry
          args={[
            shirtShape,
            {
              depth: 0.12,
              bevelEnabled: true,
              bevelSegments: 8,
              bevelSize: 0.035,
              bevelThickness: 0.035,
            },
          ]}
        />
        <meshStandardMaterial
          color={materialColor}
          roughness={roughness}
          metalness={0.02}
        />
      </mesh>

      <mesh position={[0, 1.18, 0.025]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.24, 0.025, 16, 64, Math.PI]} />
        <meshStandardMaterial
          color={shirtColor === 'white' ? '#d7d0c4' : '#020505'}
          roughness={0.86}
        />
      </mesh>

      <mesh position={[0, -0.16, 0.075]}>
        <planeGeometry args={[1.65, 2.1, 32, 32]} />
        <meshStandardMaterial
          color={shirtColor === 'white' ? '#fffaf0' : '#101a1b'}
          transparent
          opacity={shirtColor === 'white' ? 0.18 : 0.12}
          roughness={0.9}
        />
      </mesh>
    </group>
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
        <ShirtBody shirtColor={props.shirtColor} />
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
  const [webglSupported] = useState(hasWebGLSupport);
  const zone = getEmbroideryZone(props.placementZone);

  if (webglSupported === false) {
    return <FlatShirtConfigurator {...props} />;
  }

  return (
    <div className="shirt-configurator-card" style={cardStyle}>
      <div style={topBarStyle}>
        <span style={badgeStyle}>360° preview</span>
        <span style={metaStyle}>
          Placement: {zone.label} · Logo size: {formatLogoSize(props.config)}
        </span>
      </div>

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

      <div style={bottomHintStyle}>
        Drag to rotate the shirt. Drag the logo within the highlighted
        embroidery zone.
      </div>
    </div>
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
