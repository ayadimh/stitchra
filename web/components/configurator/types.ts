import type {
  EmbroideryPlacementGroup,
  EmbroideryZoneId,
  LogoPlacementConfig,
} from '@/lib/embroideryZones';

export type ShirtColor = 'black' | 'white';
export type ShirtViewerSide = 'front' | 'back' | 'side';

export type CustomLogoPlacement = {
  side: ShirtViewerSide;
  x: number;
  y: number;
  frame: number;
};

export type ShirtConfiguratorProps = {
  logoUrl: string | null;
  shirtColor: ShirtColor;
  placementZone: EmbroideryZoneId;
  config: LogoPlacementConfig;
  logoAspectRatio: number;
  onConfigChange: (config: LogoPlacementConfig) => void;
  customPlacement?: CustomLogoPlacement | null;
  onCustomPlacementChange?: (placement: CustomLogoPlacement | null) => void;
  viewerGroup?: EmbroideryPlacementGroup;
  focusPulseKey?: number;
  guidanceHint?: string;
  showEmptyStateHelper?: boolean;
  onEmptyDesignClick?: () => void;
  onStartUpload?: () => void;
  onStartAi?: () => void;
};
