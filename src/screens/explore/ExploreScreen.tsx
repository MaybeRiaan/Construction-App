import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaceFeature, PlaceRow } from '../../components/PlaceCard';
import { config } from '../../config';
import { CATEGORIES, CATEGORY_BY_ID, INTENTS } from '../../data/categories';
import { DEMO_TOWN_NAME } from '../../data/demoTown';
import { formatRadius } from '../../domain/geo';
import { activeFilterCount, featured, search, upcomingEvents } from '../../domain/search';
import { AppMap } from '../../map/AppMap';
import type { AppMapHandle, MapMarker } from '../../map/types';
import { useTabBarSpace } from '../../navigation/TabBar';
import { fetchWeather, weatherTip, type Weather } from '../../services/weather';
import { useLocation } from '../../state/LocationProvider';
import { usePlaceData } from '../../state/PlacesProvider';
import { usePlaces } from '../../state/places';
import { useSettings } from '../../state/settings';
import { useUi } from '../../state/ui';
import { neu } from '../../theme/neu';
import { useTheme } from '../../theme/ThemeProvider';
import { radii } from '../../theme/tokens';
import { Chip } from '../../ui/Chip';
import { EmptyState } from '../../ui/EmptyState';
import { Icon } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { Press } from '../../ui/Press';
import { SectionHeader } from '../../ui/Section';
import { Sheet, type SheetHandle } from '../../ui/Sheet';
import { Slider } from '../../ui/Slider';
import { T } from '../../ui/Text';

export function ExploreScreen() {
  const { c } = useTheme();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const [height, setHeight] = useState(800);
  const { origin } = useLocation();
  const data = usePlaceData();
  const filters = usePlaces((s) => s.filters);
  const setFilters = usePlaces((s) => s.setFilters);
  const radiusKm = useSettings((s) => s.radiusKm);
  const setRadiusKm = useSettings((s) => s.setRadiusKm);
  const units = useSettings((s) => s.units);
  const kids = useSettings((s) => s.kids);
  const interests = useSettings((s) => s.interests);
  const selectedId = useUi((s) => s.selectedPlaceId);
  const selectPlace = useUi((s) => s.selectPlace);

  const map = useRef<AppMapHandle>(null);
  const sheet = useRef<SheetHandle>(null);
  const [liveRadius, setLiveRadius] = useState(radiusKm);
  const [pulse, setPulse] = useState(0);
  const [sheetIndex, setSheetIndex] = useState(1);
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => setLiveRadius(radiusKm), [radiusKm]);
  useEffect(() => {
    const ctl = new AbortController();
    fetchWeather(origin, ctl.signal).then(setWeather);
    return () => ctl.abort();
  }, [origin]);

  const kidAges = useMemo(() => kids.map((k) => k.age), [kids]);
  // Categories the family picked during onboarding come first.
  const orderedCategories = useMemo(
    () => [...CATEGORIES].sort((a, b) => Number(interests.includes(b.id)) - Number(interests.includes(a.id))),
    [interests],
  );
  const results = useMemo(
    () => search(data.places, { filters, radiusKm: liveRadius, kidAges }),
    [data.places, filters, liveRadius, kidAges],
  );
  const feat = useMemo(() => featured(data.places, liveRadius), [data.places, liveRadius]);
  const events = useMemo(() => upcomingEvents(data.places, liveRadius).slice(0, 8), [data.places, liveRadius]);
  const selected = selectedId ? data.byId[selectedId] : undefined;

  const markers = useMemo<MapMarker[]>(
    () =>
      results.slice(0, 120).map((p) => ({
        id: p.id,
        coordinate: p.coordinate,
        kind: 'place',
        color: CATEGORY_BY_ID[p.category].color,
        icon: CATEGORY_BY_ID[p.category].icon,
        label: p.name,
        sponsored: Boolean(p.sponsored),
        selected: p.id === selectedId,
      })),
    [results, selectedId],
  );

  const peek = tabSpace + 96;
  const topOverlay = insets.top + 118;
  const mapPadding = useMemo(
    () => ({ top: topOverlay, bottom: sheetIndex === 0 ? peek : Math.round(height * 0.46) }),
    [topOverlay, sheetIndex, peek, height],
  );

  const commitRadius = useCallback(
    (km: number) => {
      setRadiusKm(km);
      setPulse((p) => p + 1);
      map.current?.fitRadius(km);
    },
    [setRadiusKm],
  );

  const onMarker = useCallback(
    (id: string) => {
      selectPlace(id);
      const p = data.byId[id];
      if (p) map.current?.focus(p.coordinate);
      sheet.current?.snapTo(0);
    },
    [data.byId, selectPlace],
  );

  const toggleCategory = (id: (typeof CATEGORIES)[number]['id'] | null) => {
    selectPlace(null);
    if (!id) setFilters({ categories: [] });
    else setFilters({ categories: filters.categories.length === 1 && filters.categories[0] === id ? [] : [id] });
  };

  const tip = weather ? weatherTip(weather) : null;
  const filterCount = activeFilterCount(filters) + (filters.intent ? 1 : 0);
  const open = (id: string) => nav.navigate('Place', { id });

  const header = (
    <View style={{ paddingHorizontal: 20, paddingBottom: 12, gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <T variant="h2" numberOfLines={1}>
            {results.length} {results.length === 1 ? 'place' : 'places'} nearby
          </T>
          <T variant="small" tone="muted" numberOfLines={1}>
            Within {formatRadius(liveRadius, units)} · {data.mode === 'demo' ? `${DEMO_TOWN_NAME} demo town` : 'Live from OpenStreetMap'}
          </T>
        </View>
        <Press
          onPress={() => sheet.current?.snapTo(sheetIndex === 0 ? 1 : sheetIndex)}
          accessibilityRole="button"
          accessibilityLabel="Change range"
          style={[neu(c, 'raisedSm'), { flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 12, borderRadius: 999 }]}
        >
          <Icon name="radar" size={16} />
          <T variant="smallStrong" style={{ fontVariant: ['tabular-nums'] }}>
            {formatRadius(liveRadius, units)}
          </T>
        </Press>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.map.land }} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
      <AppMap
        ref={map}
        origin={origin}
        radiusKm={liveRadius}
        markers={markers}
        onMarkerPress={onMarker}
        onMapPress={() => selectPlace(null)}
        padding={mapPadding}
        pulseKey={pulse}
      />

      {/* Top: search, filters, categories */}
      <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top + 8, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16 }}>
          <Press
            onPress={() => nav.navigate('Search')}
            accessibilityRole="search"
            accessibilityLabel="Search places"
            scaleTo={0.98}
            style={[neu(c, 'float'), { flex: 1, height: 52, borderRadius: 26, flexDirection: 'row', alignItems: 'center', paddingLeft: 18, paddingRight: 8, gap: 10 }]}
          >
            <Icon name="search" size={19} />
            <T variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
              What’s the plan today?
            </T>
            <Press
              onPress={() => nav.navigate('Search', { ask: true })}
              accessibilityRole="button"
              accessibilityLabel="Ask Playdar"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.ink, height: 36, paddingHorizontal: 12, borderRadius: 18 }}
            >
              <Icon name="sparkles" size={14} color={c.onInk} />
              <T variant="smallStrong" color={c.onInk}>
                Ask
              </T>
            </Press>
          </Press>
          <IconButton icon="filter" label="Filters" variant="float" size={52} badge={filterCount || undefined} onPress={() => nav.navigate('Filters')} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 6 }}>
          <Chip label="All" surface="float" selected={filters.categories.length === 0} onPress={() => toggleCategory(null)} icon="layers" />
          {orderedCategories.map((cat) => (
            <Chip
              key={cat.id}
              label={cat.label}
              surface="float"
              icon={cat.icon}
              color={cat.color}
              selected={filters.categories.length === 1 && filters.categories[0] === cat.id}
              onPress={() => toggleCategory(cat.id)}
            />
          ))}
        </ScrollView>
        <View style={{ alignItems: 'flex-end', paddingHorizontal: 16, gap: 10 }} pointerEvents="box-none">
          <IconButton icon="locate" label="Show my area" variant="float" size={44} onPress={() => map.current?.fitRadius(liveRadius)} />
          <IconButton icon="plus" label="Add a place" variant="float" size={44} onPress={() => nav.navigate('AddPlace')} />
        </View>
      </View>

      <Sheet ref={sheet} snapPoints={[peek, 0.46, 1]} initialIndex={1} onIndexChange={setSheetIndex} header={header} bottomInset={tabSpace} topGap={insets.top + 12}>
        {/* Range */}
        <View style={{ paddingHorizontal: 20, gap: 6, marginBottom: 18 }}>
          <View style={[neu(c, 'raised'), { borderRadius: radii.lg, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T variant="label" tone="muted">
                Your radar range
              </T>
              <T variant="smallStrong" style={{ fontVariant: ['tabular-nums'] }}>
                {formatRadius(liveRadius, units)}
              </T>
            </View>
            <Slider
              label="Search range"
              value={liveRadius}
              min={config.minRadiusKm}
              max={config.maxRadiusKm}
              curve="ease"
              onChange={setLiveRadius}
              onChangeEnd={commitRadius}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T variant="micro" tone="faint">
                Around the corner
              </T>
              <T variant="micro" tone="faint">
                Day trip
              </T>
            </View>
          </View>
        </View>

        {/* Weather-smart tip */}
        {tip && weather ? (
          <Press
            onPress={() => tip.intent && setFilters({ intent: filters.intent === tip.intent ? null : tip.intent })}
            accessibilityRole="button"
            style={{ marginHorizontal: 20, marginBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.ink, borderRadius: radii.lg, padding: 14 }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={weather.kind === 'rain' ? 'rain' : weather.kind === 'cloudy' ? 'cloudSun' : 'sun'} size={22} color={c.onAccent} />
            </View>
            <View style={{ flex: 1 }}>
              <T variant="bodyStrong" color={c.onInk}>
                {weather.label} {weather.tempC}°
              </T>
              <T variant="small" color={c.onInk} style={{ opacity: 0.8 }}>
                {tip.text}
              </T>
            </View>
          </Press>
        ) : null}

        {/* Uber-style quick intents */}
        <View style={{ paddingHorizontal: 20, marginBottom: 22 }}>
          <T variant="label" tone="muted" style={{ marginBottom: 10 }}>
            Quick ideas
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {INTENTS.map((it) => {
              const on = filters.intent === it.id;
              return (
                <Press
                  key={it.id}
                  onPress={() => setFilters({ intent: on ? null : it.id })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${it.label}: ${it.hint}`}
                  scaleTo={0.96}
                  style={(pressed) => [
                    { width: '31%', flexGrow: 1, borderRadius: radii.md, paddingVertical: 12, paddingHorizontal: 10, gap: 8, alignItems: 'flex-start' },
                    on ? { backgroundColor: c.ink } : neu(c, pressed ? 'insetSm' : 'raisedSm'),
                  ]}
                >
                  <Icon name={it.icon} size={20} color={on ? c.accent : c.ink} />
                  <T variant="smallStrong" color={on ? c.onInk : c.ink} numberOfLines={1}>
                    {it.label}
                  </T>
                </Press>
              );
            })}
          </View>
        </View>

        {feat.length ? (
          <View style={{ marginBottom: 22 }}>
            <SectionHeader title="Featured nearby" eyebrow="From local partners" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingVertical: 6 }}>
              {feat.map((p) => (
                <PlaceFeature key={p.id} p={p} onPress={() => open(p.id)} />
              ))}
            </ScrollView>
            <T variant="micro" tone="faint" style={{ paddingHorizontal: 20, marginTop: 8 }}>
              Partners pay to appear here. They never change the ratings or the order of the list below.
            </T>
          </View>
        ) : null}

        {events.length ? (
          <View style={{ marginBottom: 22 }}>
            <SectionHeader title="Happening soon" eyebrow="Next 10 days" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingVertical: 6 }}>
              {events.map(({ event, place }) => {
                const d = new Date(event.startsAt);
                return (
                  <Press
                    key={event.id}
                    onPress={() => open(place.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${event.title} at ${place.name}`}
                    style={[neu(c, 'raised'), { width: 220, borderRadius: radii.lg, padding: 12, flexDirection: 'row', gap: 12 }]}
                  >
                    <View style={{ width: 52, borderRadius: radii.sm, backgroundColor: CATEGORY_BY_ID[place.category].color, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}>
                      <T variant="micro" color="#FFFFFF" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                        {d.toLocaleDateString('en', { weekday: 'short' })}
                      </T>
                      <T variant="h2" color="#FFFFFF">
                        {d.getDate()}
                      </T>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <T variant="smallStrong" numberOfLines={2}>
                        {event.title}
                      </T>
                      <T variant="micro" tone="muted" numberOfLines={1}>
                        {d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })} · {event.price ?? 'Free'}
                      </T>
                      <T variant="micro" tone="muted" numberOfLines={1}>
                        {place.name}
                      </T>
                    </View>
                  </Press>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <SectionHeader title={filters.categories.length === 1 ? CATEGORY_BY_ID[filters.categories[0]].label : 'All places'} eyebrow={filters.sort === 'distance' ? 'Closest first' : filters.sort === 'vibe' ? 'Best vibes first' : 'Best for you'} action="Sort" onAction={() => nav.navigate('Filters')} />
        {data.status === 'loading' ? (
          <EmptyState icon="radar" title="Scanning nearby…" body="Pulling in parks, playgrounds, libraries and more from OpenStreetMap." />
        ) : data.status === 'error' ? (
          <EmptyState icon="wifi" title="Couldn’t load places" body="Check your connection, or switch to the demo town in Family settings." action="Try again" onAction={data.reload} />
        ) : results.length === 0 ? (
          <EmptyState
            icon="telescope"
            title="Nothing in range"
            body="Try widening your radar or clearing a filter."
            action="Clear filters"
            onAction={() => {
              usePlaces.getState().resetFilters(false);
            }}
          />
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 14 }}>
            {results.map((p) => (
              <PlaceRow key={p.id} p={p} onPress={() => open(p.id)} />
            ))}
          </View>
        )}
        {data.status === 'ready' ? (
          <Press
            onPress={() => nav.navigate('AddPlace')}
            accessibilityRole="button"
            accessibilityLabel="Add a place"
            style={[neu(c, 'insetSm'), { marginHorizontal: 20, marginTop: 18, borderRadius: radii.lg, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }]}
          >
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={20} color={c.onAccent} />
            </View>
            <View style={{ flex: 1 }}>
              <T variant="bodyStrong">Know a spot we’re missing?</T>
              <T variant="small" tone="muted">
                Add it for other families and earn Scout points.
              </T>
            </View>
            <Icon name="chevronRight" size={18} color={c.muted} />
          </Press>
        ) : null}
      </Sheet>

      {/* Selected pin preview */}
      {selected ? (
        <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom: peek + 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
            <IconButton icon="close" label="Close preview" variant="float" size={36} onPress={() => selectPlace(null)} />
          </View>
          <PlaceRow p={selected} onPress={() => open(selected.id)} style={[neu(c, 'float'), { borderRadius: radii.lg }]} />
        </View>
      ) : null}
    </View>
  );
}
