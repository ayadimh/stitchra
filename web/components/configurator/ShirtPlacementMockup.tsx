'use client';

import NextImage from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import {
  clampLogoPlacementConfig,
  formatLogoSize,
  getEmbroideryZone,
  getPlacementSideLabel,
} from '@/lib/embroideryZones';
import type {
  CustomLogoPlacement,
  ShirtConfiguratorProps,
  ShirtViewerSide,
} from './types';

type ZoneLayout = {
  left: number;
  top: number;
  width: number;
  height: number;
  rotate?: number;
};

type StaticRenderSide = ShirtViewerSide;

type StaticPlacementLayout = {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotate?: number;
};

const SHIRT_RENDER_PATHS: Record<
  ShirtConfiguratorProps['shirtColor'],
  Record<Exclude<StaticRenderSide, 'side'>, string>
> = {
  white: {
    front: '/mockups/shirts/shirt-front-white.png',
    back: '/mockups/shirts/shirt-back-white.png',
  },
  black: {
    front: '/mockups/shirts/shirt-front-black.png',
    back: '/mockups/shirts/shirt-back-black.png',
  },
} as const;

const FRAME_COUNT = 16;
const SHIRT_COLORS_WITH_360_FRAMES = new Set<
  ShirtConfiguratorProps['shirtColor']
>(['white']);
const ROTATE_FRAME_THRESHOLD = 26;
const STATIC_RENDER_SHIRT_BOUNDS: Record<StaticRenderSide, ZoneLayout> = {
  front: { left: 31, top: 26, width: 38, height: 58 },
  back: { left: 31, top: 26, width: 38, height: 58 },
  side: { left: 36, top: 26, width: 28, height: 58 },
};

const STATIC_RENDER_PLACEMENTS: Record<
  StaticRenderSide,
  Partial<Record<ShirtConfiguratorProps['placementZone'], StaticPlacementLayout>>
> = {
  front: {
    left_chest: { centerX: 0.38, centerY: 0.32, width: 0.24, height: 0.15 },
    right_chest: { centerX: 0.62, centerY: 0.32, width: 0.24, height: 0.15 },
    center_chest: { centerX: 0.5, centerY: 0.33, width: 0.4, height: 0.17 },
    center_front: { centerX: 0.5, centerY: 0.54, width: 0.44, height: 0.48 },
    lower_front: { centerX: 0.5, centerY: 0.7, width: 0.4, height: 0.22 },
    front_left_bottom: { centerX: 0.38, centerY: 0.7, width: 0.26, height: 0.19 },
    front_right_bottom: { centerX: 0.62, centerY: 0.7, width: 0.26, height: 0.19 },
  },
  back: {
    upper_back: { centerX: 0.5, centerY: 0.3, width: 0.4, height: 0.17 },
    center_back: { centerX: 0.5, centerY: 0.54, width: 0.44, height: 0.48 },
    lower_back: { centerX: 0.5, centerY: 0.7, width: 0.4, height: 0.22 },
    back_left_shoulder: { centerX: 0.38, centerY: 0.3, width: 0.26, height: 0.17 },
    back_right_shoulder: { centerX: 0.62, centerY: 0.3, width: 0.26, height: 0.17 },
    back_left_bottom: { centerX: 0.38, centerY: 0.7, width: 0.26, height: 0.19 },
    back_right_bottom: { centerX: 0.62, centerY: 0.7, width: 0.26, height: 0.19 },
  },
  side: {
    left_sleeve: { centerX: 0.42, centerY: 0.46, width: 0.34, height: 0.18, rotate: 7 },
    right_sleeve: { centerX: 0.58, centerY: 0.46, width: 0.34, height: 0.18, rotate: -7 },
  },
};

// Raw FBX files are intentionally not loaded in production. The configurator uses static shirt render images for speed and stability.
function getStaticShirtRenderPath(
  shirtColor: ShirtConfiguratorProps['shirtColor'],
  side: ReturnType<typeof getPlacementSideLabel>
) {
  if (side === 'front') {
    return SHIRT_RENDER_PATHS[shirtColor].front;
  }

  if (side === 'back') {
    return SHIRT_RENDER_PATHS[shirtColor].back;
  }

  return null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeFrame(frame: number) {
  return ((frame % FRAME_COUNT) + FRAME_COUNT) % FRAME_COUNT;
}

function getDefaultFrameForSide(
  side: ReturnType<typeof getPlacementSideLabel>
) {
  if (side === 'back') {
    return 8;
  }

  if (side === 'sleeve') {
    return 4;
  }

  return 0;
}

function getDefaultFrameForGroup(
  group: ShirtConfiguratorProps['viewerGroup']
) {
  if (group === 'back') {
    return 8;
  }

  if (group === 'sleeves') {
    return 4;
  }

  return 0;
}

function getFramePath(
  shirtColor: ShirtConfiguratorProps['shirtColor'],
  frame: number
) {
  return `/mockups/shirts/360/${shirtColor}/frame-${String(frame).padStart(2, '0')}.png`;
}

function getViewerSideFromFrame(frame: number): ShirtViewerSide {
  const normalized = normalizeFrame(frame);

  if (normalized >= 6 && normalized <= 10) {
    return 'back';
  }

  if (
    (normalized >= 2 && normalized <= 5) ||
    (normalized >= 11 && normalized <= 14)
  ) {
    return 'side';
  }

  return 'front';
}

function getSideLabelFromViewerSide(side: ShirtViewerSide) {
  if (side === 'back') {
    return 'back';
  }

  if (side === 'side') {
    return 'sleeve';
  }

  return 'front';
}

function getPlacementTargetFrame(
  side: ShirtViewerSide,
  zoneId: ShirtConfiguratorProps['placementZone'],
  customPlacement?: CustomLogoPlacement | null
) {
  if (customPlacement) {
    return customPlacement.frame;
  }

  if (side === 'back') {
    return 8;
  }

  if (side === 'side') {
    return zoneId === 'right_sleeve' ? 12 : 4;
  }

  return 0;
}

function getSignedFrameDistance(currentFrame: number, targetFrame: number) {
  const raw = normalizeFrame(currentFrame - targetFrame);

  return raw > FRAME_COUNT / 2 ? raw - FRAME_COUNT : raw;
}

function getProjectionStyle(
  currentFrame: number,
  targetFrame: number
): Pick<CSSProperties, 'opacity' | 'transform'> {
  const signedDistance = getSignedFrameDistance(currentFrame, targetFrame);
  const distance = Math.abs(signedDistance);
  const opacity = clamp(1 - Math.max(0, distance - 1) / 5.2, 0, 1);
  const scaleX = clamp(1 - distance * 0.105, 0.28, 1);
  const skew = clamp(signedDistance * -1.8, -13, 13);

  return {
    opacity,
    transform: `translate(-50%, -50%) translateZ(96px) rotate(0deg) scaleX(${scaleX}) skewY(${skew}deg)`,
  };
}

function getZoneLayout(zoneId: ShirtConfiguratorProps['placementZone']): ZoneLayout {
  const layouts: Record<ShirtConfiguratorProps['placementZone'], ZoneLayout> = {
    left_chest: { left: 64, top: 42, width: 22, height: 15 },
    right_chest: { left: 36, top: 42, width: 22, height: 15 },
    center_chest: { left: 50, top: 40, width: 34, height: 18 },
    center_front: { left: 50, top: 54, width: 48, height: 35 },
    lower_front: { left: 50, top: 68, width: 38, height: 21 },
    front_left_bottom: { left: 38, top: 70, width: 31, height: 18 },
    front_right_bottom: { left: 62, top: 70, width: 31, height: 18 },
    upper_back: { left: 50, top: 32, width: 42, height: 20 },
    center_back: { left: 50, top: 54, width: 52, height: 38 },
    lower_back: { left: 50, top: 73, width: 50, height: 32 },
    back_left_shoulder: { left: 38, top: 31, width: 31, height: 18 },
    back_right_shoulder: { left: 62, top: 31, width: 31, height: 18 },
    back_left_bottom: { left: 36, top: 76, width: 31, height: 18 },
    back_right_bottom: { left: 64, top: 76, width: 31, height: 18 },
    left_sleeve: { left: 18, top: 47, width: 22, height: 24, rotate: 7 },
    right_sleeve: { left: 82, top: 47, width: 22, height: 24, rotate: -7 },
  };

  return layouts[zoneId];
}

function getStaticRenderSide(
  side: ReturnType<typeof getPlacementSideLabel>
): StaticRenderSide | null {
  if (side === 'front' || side === 'back') {
    return side;
  }

  if (side === 'sleeve') {
    return 'side';
  }

  return null;
}

function getStaticRenderZoneLayout(
  zoneId: ShirtConfiguratorProps['placementZone'],
  side: StaticRenderSide
): ZoneLayout {
  const bounds = STATIC_RENDER_SHIRT_BOUNDS[side];
  const placement = STATIC_RENDER_PLACEMENTS[side][zoneId];

  if (!placement) {
    const zone = getEmbroideryZone(zoneId);
    const fallbackPlacement: StaticPlacementLayout = {
      centerX: 0.5,
      centerY: side === 'side' ? 0.46 : 0.54,
      width: zone.maxWidthMm >= 200 ? 0.44 : zone.maxWidthMm >= 120 ? 0.34 : 0.24,
      height:
        zone.maxHeightMm >= 200 ? 0.48 : zone.maxHeightMm >= 90 ? 0.22 : 0.15,
    };

    return getStaticRenderZoneLayoutFromPlacement(bounds, fallbackPlacement);
  }

  return getStaticRenderZoneLayoutFromPlacement(bounds, placement);
}

function getStaticRenderZoneLayoutFromPlacement(
  bounds: ZoneLayout,
  placement: StaticPlacementLayout
): ZoneLayout {
  const width = clamp(bounds.width * placement.width, 1, bounds.width);
  const height = clamp(bounds.height * placement.height, 1, bounds.height);
  const left = clamp(
    bounds.left + bounds.width * placement.centerX,
    bounds.left + width / 2,
    bounds.left + bounds.width - width / 2
  );
  const top = clamp(
    bounds.top + bounds.height * placement.centerY,
    bounds.top + height / 2,
    bounds.top + bounds.height - height / 2
  );

  return {
    left: Number(left.toFixed(2)),
    top: Number(top.toFixed(2)),
    width: Number(width.toFixed(2)),
    height: Number(height.toFixed(2)),
    rotate: placement.rotate,
  };
}

function getCustomRenderZoneLayout(
  customPlacement: CustomLogoPlacement,
  side: StaticRenderSide,
  zoneId: ShirtConfiguratorProps['placementZone'],
  config: ShirtConfiguratorProps['config']
): ZoneLayout {
  const bounds = STATIC_RENDER_SHIRT_BOUNDS[side];
  const referenceZoneLayout = getStaticRenderZoneLayout(zoneId, side);
  const zone = getEmbroideryZone(zoneId);
  const width = clamp(
    referenceZoneLayout.width * (config.logo_width_mm / zone.maxWidthMm),
    4,
    bounds.width
  );
  const height = clamp(
    referenceZoneLayout.height * (config.logo_height_mm / zone.maxHeightMm),
    4,
    bounds.height
  );
  const left = clamp(
    bounds.left + bounds.width * customPlacement.x,
    bounds.left + width / 2,
    bounds.left + bounds.width - width / 2
  );
  const top = clamp(
    bounds.top + bounds.height * customPlacement.y,
    bounds.top + height / 2,
    bounds.top + bounds.height - height / 2
  );

  return {
    left: Number(left.toFixed(2)),
    top: Number(top.toFixed(2)),
    width: Number(width.toFixed(2)),
    height: Number(height.toFixed(2)),
  };
}

function clampLayoutToBounds(layout: ZoneLayout, bounds: ZoneLayout): ZoneLayout {
  const width = clamp(layout.width, 2, bounds.width);
  const height = clamp(layout.height, 2, bounds.height);
  const left = clamp(
    layout.left,
    bounds.left + width / 2,
    bounds.left + bounds.width - width / 2
  );
  const top = clamp(
    layout.top,
    bounds.top + height / 2,
    bounds.top + bounds.height - height / 2
  );

  return {
    left: Number(left.toFixed(2)),
    top: Number(top.toFixed(2)),
    width: Number(width.toFixed(2)),
    height: Number(height.toFixed(2)),
    rotate: layout.rotate,
  };
}

function getLogoRenderLayout(
  zoneLayout: ZoneLayout,
  bounds: ZoneLayout,
  zone: ReturnType<typeof getEmbroideryZone>,
  config: ShirtConfiguratorProps['config']
): ZoneLayout {
  const width = clamp(
    zoneLayout.width * (config.logo_width_mm / zone.maxWidthMm),
    2,
    Math.min(zoneLayout.width, bounds.width)
  );
  const height = clamp(
    zoneLayout.height * (config.logo_height_mm / zone.maxHeightMm),
    2,
    Math.min(zoneLayout.height, bounds.height)
  );
  const zoneLeftEdge = zoneLayout.left - zoneLayout.width / 2;
  const zoneTopEdge = zoneLayout.top - zoneLayout.height / 2;
  const left = clamp(
    zoneLeftEdge + zoneLayout.width * config.logo_position_x,
    bounds.left + width / 2,
    bounds.left + bounds.width - width / 2
  );
  const top = clamp(
    zoneTopEdge + zoneLayout.height * config.logo_position_y,
    bounds.top + height / 2,
    bounds.top + bounds.height - height / 2
  );

  return {
    left: Number(left.toFixed(2)),
    top: Number(top.toFixed(2)),
    width: Number(width.toFixed(2)),
    height: Number(height.toFixed(2)),
    rotate: zoneLayout.rotate,
  };
}

function formatViewerSide(side: string | null | undefined) {
  if (side === 'back') {
    return 'Back';
  }

  if (side === 'sleeve' || side === 'side') {
    return 'Sleeve';
  }

  return 'Front';
}

export default function ShirtPlacementMockup({
  logoUrl,
  shirtColor,
  placementZone,
  config,
  logoAspectRatio,
  onConfigChange,
  customPlacement,
  onCustomPlacementChange,
  viewerGroup,
  focusPulseKey = 0,
  guidanceHint,
  copy,
  showEmptyStateHelper = false,
  onEmptyDesignClick,
  onStartUpload,
  onStartAi,
}: ShirtConfiguratorProps) {
  const viewerCopy = {
    addDesignFirst: 'Add your design first',
    emptyTitle: 'Start with a design',
    emptyText: 'Upload your logo or create an AI concept below.',
    uploadLogo: 'Upload logo',
    createWithAi: 'Create with AI',
    resetView: 'Reset view',
    previewUnavailable: 'Preview unavailable',
    ...copy,
  };
  const torsoRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [viewerDrag, setViewerDrag] = useState<{
    pointerId: number;
    startX: number;
    startY: number;
    startFrame: number;
    moved: boolean;
  } | null>(null);
  const [placementNotice, setPlacementNotice] = useState('');
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const [failedShirtRenderPath, setFailedShirtRenderPath] =
    useState<string | null>(null);
  const [failed360FrameSets, setFailed360FrameSets] = useState<
    Partial<Record<ShirtConfiguratorProps['shirtColor'], boolean>>
  >({});
  const [currentFrame, setCurrentFrame] = useState(() =>
    getDefaultFrameForGroup(viewerGroup) ??
    getDefaultFrameForSide(getPlacementSideLabel(placementZone))
  );
  const [mouse, setMouse] = useState({
    x: 0,
    y: 0,
    active: false,
  });
  const zone = getEmbroideryZone(placementZone);
  const selectedPlacementSideLabel = getPlacementSideLabel(placementZone);
  const isWhite = shirtColor === 'white';
  const hasNative360Frames = SHIRT_COLORS_WITH_360_FRAMES.has(shirtColor);
  const preferred360FramePath =
    hasNative360Frames && !failed360FrameSets[shirtColor]
      ? getFramePath(shirtColor, currentFrame)
      : null;
  const fallbackWhite360FramePath =
    shirtColor !== 'white' && !failed360FrameSets.white
      ? getFramePath('white', currentFrame)
      : null;
  const current360FramePath =
    preferred360FramePath ?? fallbackWhite360FramePath;
  const usesTintedWhite360 =
    Boolean(fallbackWhite360FramePath) && !preferred360FramePath;
  const has360Viewer = Boolean(current360FramePath);
  const viewerFacingSide = current360FramePath
    ? getViewerSideFromFrame(currentFrame)
    : getStaticRenderSide(selectedPlacementSideLabel);
  const viewerFacingSideLabel = viewerFacingSide
    ? getSideLabelFromViewerSide(viewerFacingSide)
    : selectedPlacementSideLabel;
  const selectedPlacementRenderSide =
    customPlacement?.side ?? getStaticRenderSide(selectedPlacementSideLabel);
  const staticShirtRenderPath = !current360FramePath
    ? getStaticShirtRenderPath(shirtColor, selectedPlacementSideLabel)
    : null;
  const baseShirtImagePath = current360FramePath ?? staticShirtRenderPath;
  const useStaticShirtRender = Boolean(
    baseShirtImagePath && failedShirtRenderPath !== baseShirtImagePath
  );
  const activeCustomPlacement =
    useStaticShirtRender &&
    selectedPlacementRenderSide &&
    customPlacement
      ? customPlacement
      : null;
  const projectionTargetFrame = selectedPlacementRenderSide
    ? getPlacementTargetFrame(
        selectedPlacementRenderSide,
        placementZone,
        activeCustomPlacement
      )
    : 0;
  const projectionStyle = current360FramePath
    ? getProjectionStyle(currentFrame, projectionTargetFrame)
    : {
        opacity: 1,
        transform: 'translate(-50%, -50%) translateZ(96px) rotate(0deg)',
      };
  const layout =
    useStaticShirtRender && selectedPlacementRenderSide
      ? activeCustomPlacement
        ? getCustomRenderZoneLayout(
            activeCustomPlacement,
            selectedPlacementRenderSide,
            placementZone,
            config
          )
        : getStaticRenderZoneLayout(placementZone, selectedPlacementRenderSide)
      : getZoneLayout(placementZone);
  const logoLoadFailed = Boolean(logoUrl && failedLogoUrl === logoUrl);
  const hasVisibleLogo = Boolean(logoUrl && !logoLoadFailed);
  const activeShirtBounds =
    useStaticShirtRender && selectedPlacementRenderSide
      ? STATIC_RENDER_SHIRT_BOUNDS[selectedPlacementRenderSide]
      : { left: 0, top: 0, width: 100, height: 100 };
  const logoLayout =
    activeCustomPlacement
      ? clampLayoutToBounds(layout, activeShirtBounds)
      : getLogoRenderLayout(layout, activeShirtBounds, zone, config);
  const rotateX = mouse.active ? mouse.y * -4 : 0;
  const rotateY = mouse.active ? mouse.x * 6 : 0;
  const lightX = mouse.active ? 50 + mouse.x * 18 : 50;
  const lightY = mouse.active ? 32 + mouse.y * 12 : 32;
  const shirtSurface = isWhite
    ? 'radial-gradient(circle at 38% 18%, rgba(255,255,255,0.95), transparent 18%), linear-gradient(145deg,#fffdf7 0%,#dedbd2 46%,#f7f3ea 100%)'
    : 'radial-gradient(circle at 38% 18%, rgba(255,255,255,0.16), transparent 18%), linear-gradient(145deg,#172224 0%,#101716 46%,#060808 100%)';
  const sleeveSurface = isWhite
    ? 'linear-gradient(145deg,#fbf7ec,#d6d2c8 54%,#f5f1e8)'
    : 'linear-gradient(145deg,#101719,#1a2423 55%,#050707)';
  const seamColor = isWhite
    ? 'rgba(35,31,26,0.14)'
    : 'rgba(255,255,255,0.10)';
  const labelText = useMemo(
    () => {
      const placementLabel = activeCustomPlacement
        ? `Custom ${formatViewerSide(activeCustomPlacement.side).toLowerCase()} placement`
        : zone.label;
      const sizeLabel = activeCustomPlacement
        ? formatLogoSize(config)
        : `${zone.maxWidthMm} × ${zone.maxHeightMm} mm`;

      return `View: ${formatViewerSide(viewerFacingSideLabel)} • Placement: ${placementLabel} • ${sizeLabel}`;
    },
    [
      activeCustomPlacement,
      config,
      viewerFacingSideLabel,
      zone,
    ]
  );

  useEffect(() => {
    if (!current360FramePath || typeof window === 'undefined') {
      return;
    }

    const preloadIndexes = [
      currentFrame,
      normalizeFrame(currentFrame + 1),
      normalizeFrame(currentFrame - 1),
    ];

    preloadIndexes.forEach((frameIndex) => {
      const image = new window.Image();
      image.src = getFramePath(
        preferred360FramePath ? shirtColor : 'white',
        frameIndex
      );
    });
  }, [current360FramePath, currentFrame, preferred360FramePath, shirtColor]);

  useEffect(() => {
    if (!placementNotice) {
      return;
    }

    const timeout = window.setTimeout(() => setPlacementNotice(''), 1700);

    return () => window.clearTimeout(timeout);
  }, [placementNotice]);

  const updateCustomPlacementFromPointer = (
    event: PointerEvent<HTMLElement>
  ) => {
    const pointerPlacementSide =
      activeCustomPlacement?.side ?? selectedPlacementRenderSide ?? viewerFacingSide;

    if (
      !pointerPlacementSide ||
      !torsoRef.current ||
      !onCustomPlacementChange
    ) {
      return false;
    }

    const rect = torsoRef.current.getBoundingClientRect();
    const bounds = STATIC_RENDER_SHIRT_BOUNDS[pointerPlacementSide];
    const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((event.clientY - rect.top) / rect.height) * 100;

    if (
      xPercent < bounds.left ||
      xPercent > bounds.left + bounds.width ||
      yPercent < bounds.top ||
      yPercent > bounds.top + bounds.height
    ) {
      return false;
    }

    if (!hasVisibleLogo) {
      setPlacementNotice(viewerCopy.addDesignFirst);
      onEmptyDesignClick?.();
      return false;
    }

    setPlacementNotice('');
    onCustomPlacementChange({
      side: pointerPlacementSide,
      x: clamp((xPercent - bounds.left) / bounds.width, 0, 1),
      y: clamp((yPercent - bounds.top) / bounds.height, 0, 1),
      frame: currentFrame,
    });

    onConfigChange(
      clampLogoPlacementConfig(
        {
          ...config,
          placement_zone: placementZone,
          shirt_color: shirtColor,
          logo_position_x: 0.5,
          logo_position_y: 0.5,
        },
        logoAspectRatio
      )
    );

    return true;
  };

  const handleViewerPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setViewerDrag({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startFrame: currentFrame,
      moved: false,
    });
  };

  const handleViewerPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!viewerDrag) {
      return;
    }

    const deltaX = event.clientX - viewerDrag.startX;
    const deltaY = event.clientY - viewerDrag.startY;
    const moved = Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4;

    if (has360Viewer) {
      const nextFrame =
        normalizeFrame(
          viewerDrag.startFrame + Math.round(deltaX / ROTATE_FRAME_THRESHOLD)
        );

      setCurrentFrame((current) =>
        current === nextFrame ? current : nextFrame
      );
    }

    if (moved && !viewerDrag.moved) {
      setViewerDrag({ ...viewerDrag, moved: true });
    }
  };

  const handleViewerPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const wasClick = viewerDrag && !viewerDrag.moved;

    if (viewerDrag) {
      event.currentTarget.releasePointerCapture(viewerDrag.pointerId);
    }

    setViewerDrag(null);

    if (wasClick) {
      updateCustomPlacementFromPointer(event);
    }
  };

  const resetViewer = () => {
    setCurrentFrame(getDefaultFrameForGroup(viewerGroup));
  };

  return (
    <div
      className="designer-preview-card shirt-placement-preview-card"
      onPointerDown={handleViewerPointerDown}
      onPointerMove={handleViewerPointerMove}
      onPointerUp={handleViewerPointerUp}
      onPointerCancel={() => setViewerDrag(null)}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        setMouse({ x, y, active: true });
      }}
      onMouseLeave={() => setMouse({ x: 0, y: 0, active: false })}
      style={{
        ...stage,
        cursor: viewerDrag ? 'grabbing' : 'grab',
        background: `radial-gradient(circle at ${lightX}% ${lightY}%, rgba(124,240,212,0.22), transparent 18%), linear-gradient(145deg,rgba(3,5,7,0.98),rgba(8,15,17,0.94) 48%,rgba(2,3,5,0.98))`,
      }}
    >
      {/* Future upgrade: 3D FBX shirt preview with React Three Fiber. */}
      <style>
        {`
          @keyframes stitchraTorsoFloat {
            0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
            50% { transform: translate3d(0, -6px, 0) scale(1.01); }
          }

          @keyframes stitchraBreath {
            0%, 100% { transform: translateX(-50%) translateZ(58px) scale3d(1, 1, 1); filter: brightness(1); }
            50% { transform: translateX(-50%) translateZ(58px) scale3d(1.004, 1.003, 1); filter: brightness(1.025); }
          }

          @keyframes stitchraGlow {
            0%, 100% { opacity: 0.52; transform: scale(1); }
            50% { opacity: 0.92; transform: scale(1.04); }
          }

          @keyframes stitchraThread {
            0% { background-position: 0 0; }
            100% { background-position: 72px 72px; }
          }

          @keyframes stitchraFabric {
            0%, 100% { opacity: 0.27; transform: translateX(-10px); }
            50% { opacity: 0.38; transform: translateX(10px); }
          }

          @keyframes stitchraLogoPulse {
            0% { box-shadow: 0 0 0 0 rgba(24,255,154,0.55), 0 0 0 1px rgba(255,255,255,0.10), 0 0 20px rgba(124,240,212,0.26); }
            58% { box-shadow: 0 0 0 16px rgba(24,255,154,0.00), 0 0 0 1px rgba(255,255,255,0.16), 0 0 34px rgba(124,240,212,0.40); }
            100% { box-shadow: 0 0 0 0 rgba(24,255,154,0.00), 0 0 0 1px rgba(255,255,255,0.08), 0 0 18px rgba(124,240,212,0.20); }
          }

          @media (prefers-reduced-motion: reduce) {
            .shirt-placement-preview-card .shirt-preview-motion,
            .shirt-placement-preview-card .shirt-preview-breath,
            .shirt-placement-preview-card .shirt-preview-glow,
            .shirt-placement-preview-card .shirt-preview-thread,
            .shirt-placement-preview-card .shirt-preview-fabric {
              animation: none !important;
            }
          }
        `}
      </style>
      <div
        style={{
          ...gridOverlay,
          transform: `translate3d(${mouse.x * -10}px, ${mouse.y * -10}px, 0)`,
        }}
      />
      <div className="shirt-preview-glow" style={glowField} />

      <div className="designer-preview-label" style={previewLabel}>
        {labelText}
      </div>

      <div
        ref={torsoRef}
        className="designer-preview-torso"
        style={{
          ...torsoRig,
          transform: `translateX(-50%) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        }}
      >
        <div className="shirt-preview-motion" style={torsoFloat}>
          <div style={shadow} />
          {!useStaticShirtRender && (
            <>
              <div
                style={{
                  ...leftSleeve,
                  background: sleeveSurface,
                }}
              />
              <div
                style={{
                  ...rightSleeve,
                  background: sleeveSurface,
                }}
              />
              <div
                className="shirt-preview-breath"
                style={{
                  ...shirtBody,
                  background: shirtSurface,
                  boxShadow: isWhite
                    ? 'inset 24px 22px 38px rgba(255,255,255,0.70), inset -36px -42px 60px rgba(120,112,98,0.34), 0 56px 115px rgba(0,0,0,0.48), 0 0 74px rgba(124,240,212,0.13)'
                    : 'inset 24px 22px 42px rgba(255,255,255,0.07), inset -38px -48px 66px rgba(0,0,0,0.66), 0 56px 115px rgba(0,0,0,0.58), 0 0 78px rgba(124,240,212,0.13)',
                }}
              >
                <div
                  className="shirt-preview-fabric"
                  style={{
                    ...fabricTexture,
                    opacity: isWhite ? 0.44 : 0.3,
                  }}
                />
                <div style={collar} />
                <div
                  style={{
                    ...neckSeam,
                    background: seamColor,
                    boxShadow:
                      selectedPlacementSideLabel === 'back'
                        ? `0 30px 0 ${seamColor}, 0 62px 0 ${seamColor}`
                        : `0 22px 0 ${seamColor}`,
                  }}
                />
                {selectedPlacementSideLabel === 'back' && (
                  <div style={backYoke} />
                )}
              </div>
            </>
          )}

          {useStaticShirtRender && baseShirtImagePath && (
            <div style={staticShirtRenderLayer} aria-hidden="true">
              <NextImage
                src={baseShirtImagePath}
                alt=""
                fill
                sizes="(max-width: 760px) 82vw, 420px"
                onError={() => {
                  if (current360FramePath) {
                    setFailed360FrameSets((current) => ({
                      ...current,
                      [preferred360FramePath ? shirtColor : 'white']: true,
                    }));
                    return;
                  }

                  setFailedShirtRenderPath(baseShirtImagePath);
                }}
                style={{
                  objectFit: 'contain',
                  objectPosition: 'center center',
                  filter:
                    current360FramePath && usesTintedWhite360
                      ? 'brightness(0.28) contrast(1.38) saturate(0.8) drop-shadow(0 42px 72px rgba(0,0,0,0.56)) drop-shadow(0 0 42px rgba(124,240,212,0.10))'
                      : 'drop-shadow(0 42px 72px rgba(0,0,0,0.48)) drop-shadow(0 0 42px rgba(124,240,212,0.10))',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              />
            </div>
          )}

          {logoUrl && (
            <div
              key={`logo-preview-${logoUrl}-${focusPulseKey}`}
              aria-label="Design preview on shirt"
              onPointerDown={(event) => {
                event.stopPropagation();
                event.currentTarget.setPointerCapture(event.pointerId);
                setDragging(true);
                updateCustomPlacementFromPointer(event);
              }}
              onPointerMove={(event) => {
                event.stopPropagation();
                if (dragging) {
                  updateCustomPlacementFromPointer(event);
                }
              }}
              onPointerUp={(event) => {
                event.stopPropagation();
                event.currentTarget.releasePointerCapture(event.pointerId);
                setDragging(false);
              }}
              onPointerCancel={(event) => {
                event.stopPropagation();
                setDragging(false);
              }}
              style={{
                ...logoFrame,
                left: `${logoLayout.left}%`,
                top: `${logoLayout.top}%`,
                width: `${logoLayout.width}%`,
                height: `${logoLayout.height}%`,
                opacity: projectionStyle.opacity,
                transform: `${projectionStyle.transform} rotate(${logoLayout.rotate ?? 0}deg)`,
                animation:
                  hasVisibleLogo && focusPulseKey > 0
                    ? 'stitchraLogoPulse 1150ms ease-out 1'
                    : undefined,
                boxShadow: hasVisibleLogo
                  ? '0 0 0 1px rgba(255,255,255,0.08), 0 0 18px rgba(124,240,212,0.20)'
                  : 'none',
                cursor: 'grab',
                pointerEvents:
                  typeof projectionStyle.opacity === 'number' &&
                  projectionStyle.opacity < 0.18
                    ? 'none'
                    : 'auto',
              }}
            >
              {hasVisibleLogo ? (
                // Native img is intentional for immediate blob: upload previews.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Uploaded embroidery logo"
                  draggable={false}
                  onError={() => setFailedLogoUrl(logoUrl)}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                    zIndex: 4,
                    opacity: 0.99,
                    filter: isWhite
                      ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.26)) drop-shadow(0 0 8px rgba(124,240,212,0.12))'
                      : 'drop-shadow(0 0 1px rgba(255,255,255,0.85)) drop-shadow(0 0 8px rgba(255,255,255,0.22)) drop-shadow(0 0 12px rgba(124,240,212,0.18))',
                    pointerEvents: 'none',
                  }}
                />
              ) : (
                <span
                  style={{
                    ...previewUnavailableText,
                    color: isWhite
                      ? 'rgba(8,12,14,0.48)'
                      : 'rgba(224,255,244,0.74)',
                  }}
                >
                  {viewerCopy.previewUnavailable}
                </span>
              )}
            </div>
          )}

          <div style={bottomGlow} />
        </div>
      </div>

      {!hasVisibleLogo && showEmptyStateHelper && (
        <div style={emptyStateHelper}>
          <div style={emptyStateCopy}>
            <strong>{viewerCopy.emptyTitle}</strong>
            <span>{viewerCopy.emptyText}</span>
          </div>
          <div style={emptyStateActions}>
            <button
              type="button"
              style={{
                ...emptyStateActionButtonBase,
                border: 0,
                color: '#06100a',
                background: 'linear-gradient(135deg, #18ff9a, #00c8ff)',
              }}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onStartUpload?.();
              }}
            >
              {viewerCopy.uploadLogo}
            </button>
            <button
              type="button"
              style={{
                ...emptyStateActionButtonBase,
                border: '1px solid rgba(255,255,255,0.14)',
                color: 'rgba(246,255,249,0.86)',
                background: 'rgba(255,255,255,0.06)',
              }}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onStartAi?.();
              }}
            >
              {viewerCopy.createWithAi}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          resetViewer();
        }}
        style={resetButton}
      >
        {viewerCopy.resetView}
      </button>

      {placementNotice && (
        <div style={placementNoticeStyle}>
          {placementNotice}
        </div>
      )}

      <div style={footerHint}>
        {guidanceHint ??
          (hasVisibleLogo
          ? `Drag to rotate • Click shirt to reposition logo • Logo size ${formatLogoSize(config)}`
          : 'Upload a logo or create an AI concept, then click the shirt to place it.')}
      </div>
    </div>
  );
}

const stage: CSSProperties = {
  position: 'relative',
  minHeight: 650,
  borderRadius: 36,
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow:
    '0 44px 130px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.08)',
  isolation: 'isolate',
  perspective: 1100,
  transition: 'background 180ms ease, box-shadow 180ms ease',
  touchAction: 'pan-y',
  userSelect: 'none',
};

const gridOverlay: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage:
    'linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)',
  backgroundSize: '44px 44px',
  maskImage: 'radial-gradient(circle at 50% 45%, black, transparent 78%)',
  transition: 'transform 120ms ease',
};

const glowField: CSSProperties = {
  position: 'absolute',
  inset: '14% 5% 7%',
  background:
    'radial-gradient(ellipse at center, rgba(124,240,212,0.22), transparent 55%)',
  filter: 'blur(28px)',
  opacity: 0.76,
  animation: 'stitchraGlow 4.6s ease-in-out infinite',
};

const previewLabel: CSSProperties = {
  position: 'absolute',
  top: 20,
  left: 20,
  right: 20,
  padding: '10px 16px',
  borderRadius: 16,
  background: 'rgba(0,0,0,0.45)',
  border: '1px solid rgba(255,255,255,0.08)',
  fontSize: 13,
  textAlign: 'center',
  zIndex: 4,
  boxShadow: '0 18px 45px rgba(0,0,0,0.32)',
};

const torsoRig: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: 72,
  width: 420,
  height: 520,
  transformStyle: 'preserve-3d',
  transition: 'transform 140ms ease-out',
};

const torsoFloat: CSSProperties = {
  position: 'absolute',
  inset: 0,
  animation: 'stitchraTorsoFloat 6s ease-in-out infinite',
  transformStyle: 'preserve-3d',
};

const shadow: CSSProperties = {
  position: 'absolute',
  left: '50%',
  bottom: 10,
  transform: 'translateX(-50%) translateZ(-42px)',
  width: 320,
  height: 58,
  borderRadius: '50%',
  background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.66), transparent 68%)',
  filter: 'blur(12px)',
  opacity: 0.9,
};

const leftSleeve: CSSProperties = {
  position: 'absolute',
  left: 20,
  top: 122,
  width: 128,
  height: 255,
  borderRadius: '52px 22px 44px 68px',
  clipPath: 'polygon(42% 0, 100% 15%, 78% 100%, 18% 91%, 0 24%)',
  boxShadow:
    'inset 18px 22px 32px rgba(255,255,255,0.08), inset -24px -30px 46px rgba(0,0,0,0.42), 0 34px 70px rgba(0,0,0,0.42)',
  transform: 'rotate(7deg) translateZ(18px)',
};

const rightSleeve: CSSProperties = {
  ...leftSleeve,
  left: 'auto',
  right: 20,
  borderRadius: '22px 52px 68px 44px',
  clipPath: 'polygon(0 15%, 58% 0, 100% 24%, 82% 91%, 22% 100%)',
  transform: 'rotate(-7deg) translateZ(18px)',
};

const shirtBody: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: 62,
  transform: 'translateX(-50%) translateZ(58px)',
  width: 340,
  height: 440,
  borderRadius: '92px 92px 42px 42px / 86px 86px 34px 34px',
  clipPath:
    'polygon(17% 0, 35% 0, 42% 12%, 58% 12%, 65% 0, 83% 0, 98% 22%, 87% 100%, 13% 100%, 2% 22%)',
  animation: 'stitchraBreath 5.8s ease-in-out infinite',
  overflow: 'hidden',
};

const staticShirtRenderLayer: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: -8,
  transform: 'translateX(-50%) translateZ(66px)',
  width: 390,
  height: 520,
  zIndex: 1,
  pointerEvents: 'none',
};

const fabricTexture: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage:
    'linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.18) 18%, transparent 34%), repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 7px), repeating-linear-gradient(0deg, rgba(0,0,0,0.035) 0 1px, transparent 1px 9px)',
  animation: 'stitchraFabric 8s ease-in-out infinite',
  pointerEvents: 'none',
};

const collar: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: 0,
  transform: 'translateX(-50%)',
  width: 112,
  height: 64,
  borderRadius: '0 0 999px 999px',
  background:
    'linear-gradient(180deg, rgba(0,0,0,0.72), rgba(0,0,0,0.34))',
  boxShadow:
    '0 10px 24px rgba(0,0,0,0.38), inset 0 -9px 16px rgba(255,255,255,0.05)',
};

const neckSeam: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: 46,
  transform: 'translateX(-50%)',
  width: 152,
  height: 1,
};

const backYoke: CSSProperties = {
  position: 'absolute',
  left: '18%',
  right: '18%',
  top: 116,
  height: 1,
  background:
    'linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)',
};

const logoFrame: CSSProperties = {
  position: 'absolute',
  minWidth: 20,
  minHeight: 20,
  borderRadius: 12,
  overflow: 'hidden',
  isolation: 'isolate',
  zIndex: 4,
  touchAction: 'none',
};

const previewUnavailableText: CSSProperties = {
  fontSize: 11,
  fontWeight: 850,
  letterSpacing: 0,
  zIndex: 2,
  maxWidth: '80%',
  textAlign: 'center',
  textTransform: 'none',
  lineHeight: 1.25,
};

const bottomGlow: CSSProperties = {
  position: 'absolute',
  left: '50%',
  bottom: -2,
  transform: 'translateX(-50%) translateZ(40px)',
  width: 285,
  height: 30,
  borderRadius: '50%',
  background:
    'linear-gradient(90deg, transparent, rgba(124,240,212,0.24), transparent)',
  filter: 'blur(20px)',
  opacity: 0.8,
};

const resetButton: CSSProperties = {
  position: 'absolute',
  right: 22,
  top: 76,
  zIndex: 8,
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 999,
  padding: '8px 12px',
  background: 'rgba(0,0,0,0.42)',
  color: 'rgba(245,247,248,0.78)',
  fontSize: 12,
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: '0 16px 40px rgba(0,0,0,0.26)',
};

const emptyStateHelper: CSSProperties = {
  position: 'absolute',
  right: 22,
  bottom: 76,
  zIndex: 8,
  width: 'min(360px, calc(100% - 44px))',
  display: 'grid',
  gap: 12,
  padding: 14,
  borderRadius: 22,
  border: '1px solid rgba(24,255,154,0.22)',
  background:
    'radial-gradient(circle at 12% 0%, rgba(0,255,136,0.14), transparent 34%), rgba(5,10,11,0.82)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 20px 64px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.08)',
};

const emptyStateCopy: CSSProperties = {
  display: 'grid',
  gap: 4,
  color: '#f6fff9',
  fontSize: 13,
  lineHeight: 1.4,
};

const emptyStateActions: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};

const emptyStateActionButtonBase: CSSProperties = {
  minHeight: 34,
  borderRadius: 999,
  padding: '0 12px',
  font: 'inherit',
  fontSize: 12,
  fontWeight: 900,
  cursor: 'pointer',
};

const placementNoticeStyle: CSSProperties = {
  position: 'absolute',
  left: '50%',
  bottom: 70,
  transform: 'translateX(-50%)',
  zIndex: 8,
  padding: '8px 12px',
  borderRadius: 999,
  background: 'rgba(0,0,0,0.58)',
  border: '1px solid rgba(124,240,212,0.22)',
  color: 'rgba(224,255,244,0.88)',
  fontSize: 12,
  fontWeight: 850,
  boxShadow: '0 16px 42px rgba(0,0,0,0.32)',
  pointerEvents: 'none',
};

const footerHint: CSSProperties = {
  position: 'absolute',
  left: 22,
  right: 22,
  bottom: 18,
  zIndex: 8,
  margin: 0,
  padding: '10px 14px',
  borderRadius: 14,
  background: 'rgba(0,0,0,0.38)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(245,247,248,0.68)',
  fontSize: 13,
  textAlign: 'center',
};
