import type { StyleProp, ViewStyle } from 'react-native';
import type { LatLng, VehicleTypeId } from '../domain/types';
import type { IconName } from '../ui/iconRegistry';

export interface MapMarker {
  id: string;
  coordinate: LatLng;
  kind: 'place' | 'spot';
  color: string;
  icon: IconName;
  label?: string;
  sponsored?: boolean;
  selected?: boolean;
  vehicle?: VehicleTypeId;
  /** Sample/demo content, drawn slightly quieter. */
  muted?: boolean;
  /** Your own spot. */
  mine?: boolean;
}

export interface AppMapHandle {
  fitRadius: (km: number) => void;
  focus: (c: LatLng) => void;
  recenter: () => void;
}

export interface AppMapProps {
  origin: LatLng;
  /** How much map to show at first, in km around origin. */
  radiusKm?: number;
  /** Draw radiusKm as the dashed radar range ring (default true). */
  showRange?: boolean;
  markers: MapMarker[];
  onMarkerPress?: (id: string) => void;
  onMapPress?: () => void;
  trail?: LatLng[];
  /** Where the user dot is drawn (defaults to origin). */
  you?: LatLng;
  showUser?: boolean;
  /** Screen space covered by overlays, so fitting and focusing aim at the visible part. */
  padding?: { top: number; bottom: number };
  /** Change to replay the radar pulse. */
  pulseKey?: number;
  /** false = a static preview that ignores touches. */
  interactive?: boolean;
  /** Called with the coordinate under the middle of the visible map after it moves. */
  onCenterChange?: (center: LatLng) => void;
  style?: StyleProp<ViewStyle>;
}
