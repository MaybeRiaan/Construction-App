import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import MapView, { Circle, Marker, Polyline, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import type { LatLng } from '../domain/types';
import { useTheme } from '../theme/ThemeProvider';
import { googleMapStyle } from './mapStyle';
import { Pin } from './Pin';
import type { AppMapHandle, AppMapProps } from './types';

/** Native map: Apple Maps (muted) on iOS, styled Google Maps on Android. */

function regionFor(center: LatLng, km: number): Region {
  const latDelta = ((km * 2) / 111) * 1.25;
  const lngDelta = latDelta / Math.max(0.2, Math.cos((center.latitude * Math.PI) / 180));
  return { latitude: center.latitude, longitude: center.longitude, latitudeDelta: latDelta, longitudeDelta: lngDelta };
}

export const AppMap = forwardRef<AppMapHandle, AppMapProps>(function AppMap(
  { origin, radiusKm, showRange = true, markers, onMarkerPress, onMapPress, trail, you, showUser = true, padding = { top: 0, bottom: 0 }, interactive = true, onCenterChange, style },
  ref,
) {
  const { c, scheme } = useTheme();
  const map = useRef<MapView>(null);
  const centerCb = useRef(onCenterChange);
  centerCb.current = onCenterChange;
  const [tracking, setTracking] = useState(true);
  const style_ = useMemo(() => googleMapStyle(c), [c]);

  // Custom marker views need a moment to render before tracking is switched off.
  useEffect(() => {
    setTracking(true);
    const t = setTimeout(() => setTracking(false), 700);
    return () => clearTimeout(t);
  }, [markers]);

  useImperativeHandle(ref, () => ({
    fitRadius: (km) => map.current?.animateToRegion(regionFor(origin, km), 450),
    focus: (p) => map.current?.animateCamera({ center: p }, { duration: 400 }),
    recenter: () => map.current?.animateToRegion(regionFor(origin, radiusKm ?? 3), 450),
  }));

  return (
    <View style={[{ flex: 1 }, style]} pointerEvents={interactive ? 'auto' : 'none'}>
      <MapView
        ref={map}
        style={{ flex: 1 }}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={Platform.OS === 'android' ? style_ : undefined}
        mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
        userInterfaceStyle={scheme}
        initialRegion={regionFor(origin, radiusKm ?? 3)}
        showsUserLocation={showUser && !you}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        pitchEnabled={false}
        showsPointsOfInterests={false}
        mapPadding={{ top: padding.top, bottom: padding.bottom, left: 0, right: 0 }}
        onPress={() => onMapPress?.()}
        onRegionChangeComplete={(r) => centerCb.current?.({ latitude: r.latitude, longitude: r.longitude })}
      >
        {radiusKm && showRange ? (
          <Circle center={origin} radius={radiusKm * 1000} strokeColor={c.map.radiusStroke} fillColor={c.map.radiusFill} strokeWidth={1.5} lineDashPattern={[6, 6]} />
        ) : null}
        {trail && trail.length > 1 ? (
          <>
            <Polyline coordinates={trail} strokeColor={c.ink} strokeWidth={8} lineCap="round" lineJoin="round" />
            <Polyline coordinates={trail} strokeColor={c.accent} strokeWidth={5} lineCap="round" lineJoin="round" />
          </>
        ) : null}
        {you && showUser ? (
          <Marker coordinate={you} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false} zIndex={30}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c.ink, borderWidth: 4, borderColor: '#FFFFFF', boxShadow: '0px 2px 6px rgba(0,0,0,0.35)' }} />
          </Marker>
        ) : null}
        {markers.map((m) => (
          <Marker
            key={`${m.id}${m.selected ? ':s' : ''}`}
            coordinate={m.coordinate}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={tracking}
            zIndex={m.selected ? 20 : m.sponsored ? 3 : 1}
            onPress={(e) => {
              e.stopPropagation?.();
              onMarkerPress?.(m.id);
            }}
          >
            <Pin m={m} />
          </Marker>
        ))}
      </MapView>
    </View>
  );
});
