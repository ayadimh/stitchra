import type {
  EmbroideryZoneId,
  LogoPlacementConfig,
} from '@/lib/embroideryZones';

export type ShirtColor = 'black' | 'white';

export type ShirtConfiguratorProps = {
  logoUrl: string | null;
  shirtColor: ShirtColor;
  placementZone: EmbroideryZoneId;
  config: LogoPlacementConfig;
  logoAspectRatio: number;
  onConfigChange: (config: LogoPlacementConfig) => void;
};
