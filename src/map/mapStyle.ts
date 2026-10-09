import type { Palette } from '../theme/tokens';

/** Google Maps style (Android) derived from the theme's map palette: quiet, low-POI, Uber-like. */
export function googleMapStyle(c: Palette) {
  const m = c.map;
  return [
    { elementType: 'geometry', stylers: [{ color: m.land }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: m.label }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: m.labelHalo }] },
    { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: m.park }] },
    { featureType: 'poi.park', elementType: 'labels.text', stylers: [{ visibility: 'on' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: m.road }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: m.roadCasing }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: m.roadMajor }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: m.roadMajor }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: m.roadMajorCasing }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: m.water }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: m.label }] },
  ];
}
