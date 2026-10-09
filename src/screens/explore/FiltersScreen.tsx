import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AMENITIES } from '../../data/categories';
import { search, type Setting, type SortMode } from '../../domain/search';
import { usePlaceData } from '../../state/PlacesProvider';
import { usePlaces } from '../../state/places';
import { useSettings } from '../../state/settings';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { Press } from '../../ui/Press';
import { Segmented } from '../../ui/Segmented';
import { T } from '../../ui/Text';
import { Toggle } from '../../ui/Toggle';

const MUST_HAVES = AMENITIES.filter((a) => ['toilets', 'babyChange', 'parking', 'cafe', 'shade', 'fenced', 'stroller', 'accessible', 'covered'].includes(a.id));

function Row({ title, hint, value, onChange, disabled }: { title: string; hint: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, opacity: disabled ? 0.45 : 1 }} pointerEvents={disabled ? 'none' : 'auto'}>
      <View style={{ flex: 1 }}>
        <T variant="bodyStrong">{title}</T>
        <T variant="small" tone="muted">
          {hint}
        </T>
      </View>
      <Toggle value={value} onChange={onChange} label={title} />
    </View>
  );
}

export function FiltersScreen() {
  const { c } = useTheme();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const data = usePlaceData();
  const filters = usePlaces((s) => s.filters);
  const setFilters = usePlaces((s) => s.setFilters);
  const resetFilters = usePlaces((s) => s.resetFilters);
  const radiusKm = useSettings((s) => s.radiusKm);
  const kids = useSettings((s) => s.kids);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: Platform.OS !== 'web', tension: 70, friction: 12 }).start();
  }, [anim]);

  const close = () => {
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: Platform.OS !== 'web' }).start(() => nav.goBack());
  };

  const count = useMemo(
    () => search(data.places, { filters, radiusKm, kidAges: kids.map((k) => k.age) }).length,
    [data.places, filters, radiusKm, kids],
  );

  const toggleAmenity = (id: (typeof MUST_HAVES)[number]['id']) =>
    setFilters({ amenities: filters.amenities.includes(id) ? filters.amenities.filter((a) => a !== id) : [...filters.amenities, id] });

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.scrim, opacity: anim }}>
        <Pressable style={{ flex: 1 }} onPress={close} accessibilityLabel="Close filters" />
      </Animated.View>
      <Animated.View
        style={{
          backgroundColor: c.bg,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          maxHeight: '88%',
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [700, 0] }) }],
        }}
      >
        <View style={{ alignItems: 'center', paddingTop: 10 }}>
          <View style={{ width: 42, height: 5, borderRadius: 3, backgroundColor: c.faint, opacity: 0.6 }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6 }}>
          <T variant="h1">Filters</T>
          <Press onPress={() => resetFilters(true)} accessibilityRole="button" style={{ padding: 6 }}>
            <T variant="smallStrong" tone="soft">
              Reset
            </T>
          </Press>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 22 }}>
          <View style={{ gap: 10 }}>
            <T variant="label" tone="muted">
              Sort by
            </T>
            <Segmented<SortMode>
              options={[
                { value: 'recommended', label: 'For you' },
                { value: 'distance', label: 'Closest' },
                { value: 'vibe', label: 'Best vibes' },
              ]}
              value={filters.sort}
              onChange={(sort) => setFilters({ sort })}
            />
          </View>
          <View style={{ gap: 10 }}>
            <T variant="label" tone="muted">
              Inside or out
            </T>
            <Segmented<Setting>
              options={[
                { value: 'any', label: 'Either' },
                { value: 'indoor', label: 'Indoor', icon: 'umbrella' },
                { value: 'outdoor', label: 'Outdoor', icon: 'sun' },
              ]}
              value={filters.setting}
              onChange={(setting) => setFilters({ setting })}
            />
          </View>
          <View style={{ gap: 18 }}>
            <Row title="Free only" hint="Parks, libraries, splash pads…" value={filters.freeOnly} onChange={(freeOnly) => setFilters({ freeOnly })} />
            <Row title="Open now" hint="Hide places that are closed" value={filters.openNow} onChange={(openNow) => setFilters({ openNow })} />
            <Row title="Good vibes only" hint="Vibe meter 70 and up" value={filters.goodVibesOnly} onChange={(goodVibesOnly) => setFilters({ goodVibesOnly })} />
            <Row
              title="Right for my kids’ ages"
              hint={kids.length ? `Ages ${kids.map((k) => k.age).join(', ')}` : 'Add your kids in Family first'}
              value={filters.ageFit && kids.length > 0}
              onChange={(ageFit) => setFilters({ ageFit })}
              disabled={!kids.length}
            />
          </View>
          <View style={{ gap: 10 }}>
            <T variant="label" tone="muted">
              Must have
            </T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {MUST_HAVES.map((a) => (
                <Chip key={a.id} label={a.label} icon={a.icon} size="sm" selected={filters.amenities.includes(a.id)} onPress={() => toggleAmenity(a.id)} />
              ))}
            </View>
          </View>
        </ScrollView>
        <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 16) + 4 }}>
          <Button title={count ? `Show ${count} ${count === 1 ? 'place' : 'places'}` : 'No places match'} size="lg" full onPress={close} disabled={!count} />
        </View>
      </Animated.View>
    </View>
  );
}
