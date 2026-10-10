import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { Animated, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryArt } from '../../art/CategoryArt';
import { priceLabel, SaveHeart } from '../../components/PlaceCard';
import { VibeMeter } from '../../components/VibeMeter';
import { AMENITY_BY_ID, CATEGORY_BY_ID } from '../../data/categories';
import { VIBE_LEVELS, VIBE_TAG_BY_ID } from '../../data/vibes';
import { formatDistance } from '../../domain/geo';
import { hoursTable } from '../../domain/hours';
import type { VibeCheck } from '../../domain/types';
import type { RootStackParamList } from '../../navigation/types';
import { openDirections } from '../../services/directions';
import { usePlaceData } from '../../state/PlacesProvider';
import { usePlaces } from '../../state/places';
import { useSettings } from '../../state/settings';
import { toast } from '../../state/ui';
import { neu } from '../../theme/neu';
import { useTheme } from '../../theme/ThemeProvider';
import { hazard, radii } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { Icon, type IconName } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { Pill } from '../../ui/Pill';
import { Press } from '../../ui/Press';
import { Surface } from '../../ui/Surface';
import { T } from '../../ui/Text';

function Fact({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const { c } = useTheme();
  return (
    <Surface depth="raisedSm" radius={radii.md} style={{ flex: 1, minWidth: 0, paddingVertical: 12, paddingHorizontal: 10, gap: 6, alignItems: 'flex-start' }}>
      <Icon name={icon} size={17} color={c.inkSoft} />
      <T variant="micro" tone="muted" numberOfLines={1}>
        {label}
      </T>
      <T variant="smallStrong" numberOfLines={1}>
        {value}
      </T>
    </Surface>
  );
}

function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (d < 1) return 'Today';
  if (d < 2) return 'Yesterday';
  if (d < 7) return `${Math.floor(d)} days ago`;
  if (d < 30) return `${Math.floor(d / 7)} wk ago`;
  return `${Math.floor(d / 30)} mo ago`;
}

function Review({ v }: { v: VibeCheck }) {
  const { c } = useTheme();
  const lvl = VIBE_LEVELS[v.score - 1];
  return (
    <View style={[neu(c, 'raisedSm'), { borderRadius: radii.md, padding: 14, gap: 8 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: v.score >= 4 ? c.accent : c.well, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={lvl.icon} size={18} color={v.score >= 4 ? c.onAccent : c.inkSoft} />
        </View>
        <View style={{ flex: 1 }}>
          <T variant="smallStrong">{lvl.label}</T>
          <T variant="micro" tone="muted">
            {v.author} · {timeAgo(v.createdAt)}
          </T>
        </View>
        {v.sample ? <Pill label="Sample" /> : v.authorId === undefined && !v.sample ? <Pill label="You" tone="ink" /> : null}
      </View>
      {v.note ? <T variant="body" tone="soft">{v.note}</T> : null}
      {v.tags.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {v.tags.map((t) => (VIBE_TAG_BY_ID[t] ? <Pill key={t} label={VIBE_TAG_BY_ID[t].label} tone={VIBE_TAG_BY_ID[t].tone === 'good' ? 'neutral' : 'sponsored'} /> : null))}
        </View>
      ) : null}
    </View>
  );
}

export function PlaceScreen() {
  const { c } = useTheme();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProp<RootStackParamList, 'Place'>>();
  const data = usePlaceData();
  const units = useSettings((s) => s.units);
  const myVibe = usePlaces((s) => s.myVibes.find((v) => v.placeId === params.id));
  const [showHours, setShowHours] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const p = data.byId[params.id];

  if (!p) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + 60 }}>
        <EmptyState icon="pin" title="Place not found" body="It may be outside your current range or the data was refreshed." action="Back" onAction={() => nav.goBack()} />
      </View>
    );
  }

  const cat = CATEGORY_BY_ID[p.category];
  const reviews = data.vibesFor(p.id);
  const machineSpot = p.keywords?.some((k) => ['construction', 'diggers', 'digger', 'crane', 'machines', 'trucks'].includes(k));
  const hours = hoursTable(p.hours);

  const go = async () => {
    if (data.mode === 'demo') {
      toast('Directions open in Apple or Google Maps in the app. Riverbend is a demo town.', { icon: 'navigate' });
      return;
    }
    const ok = await openDirections(p.coordinate, p.name);
    if (!ok) toast('Couldn’t open maps on this device', { tone: 'danger' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: Platform.OS !== 'web' })}
      >
        <View style={{ height: 290 + insets.top * 0.4 }}>
          <CategoryArt category={p.category} seed={p.coverSeed} width="100%" height={290 + insets.top * 0.4} />
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 40, backgroundColor: c.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30 }} />
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: -10, gap: 18 }}>
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: cat.color, borderRadius: 999, paddingHorizontal: 9, height: 24 }}>
                <Icon name={cat.icon} size={12} color="#FFFFFF" />
                <T variant="micro" color="#FFFFFF">
                  {cat.short}
                </T>
              </View>
              {p.sponsored ? <Pill label={p.sponsored.label ?? 'Sponsored'} tone="accent" icon="star" /> : null}
              {p.source === 'osm' ? <Pill label="OpenStreetMap" tone="neutral" icon="globe" /> : null}
              {p.source === 'community' ? <Pill label={p.addedBy ? `Added by ${p.addedBy}` : 'Added by a parent'} tone="success" icon="users" /> : null}
              {data.mode === 'demo' ? <Pill label="Demo town" tone="neutral" /> : null}
            </View>
            <T variant="h1">{p.name}</T>
            <T variant="body" tone="muted">
              {[p.area, p.address].filter(Boolean).join(' · ')}
            </T>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Icon name="navigate" size={15} color={c.inkSoft} />
                <T variant="smallStrong" tone="soft">
                  {formatDistance(p.distanceM, units)}
                </T>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Icon name={p.travel.includes('walk') ? 'footprints' : 'car'} size={15} color={c.inkSoft} />
                <T variant="smallStrong" tone="soft">
                  {p.travel}
                </T>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.open.open ? c.success : c.faint }} />
                <T variant="smallStrong" tone={p.open.open ? 'success' : 'muted'}>
                  {p.open.label}
                </T>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Fact icon="baby" label="Best for" value={`Ages ${p.ages[0]}–${p.ages[1]}`} />
            <Fact icon="ticket" label="Cost" value={p.priceNote ?? priceLabel(p)} />
            <Fact icon={p.indoor ? 'umbrella' : 'sun'} label="Setting" value={p.indoor ? 'Indoor' : 'Outdoor'} />
          </View>

          <VibeMeter stats={p.stats} />

          {p.sponsored?.offer ? (
            <View style={{ borderRadius: radii.lg, overflow: 'hidden', backgroundColor: hazard.yellow, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: hazard.black, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="tag" size={18} color={hazard.yellow} />
              </View>
              <View style={{ flex: 1 }}>
                <T variant="label" color={hazard.black} style={{ opacity: 0.7 }}>
                  Playdar partner offer
                </T>
                <T variant="bodyStrong" color={hazard.black}>
                  {p.sponsored.offer}
                </T>
              </View>
            </View>
          ) : null}

          {machineSpot ? (
            <Press onPress={() => nav.navigate('Tabs', { screen: 'Hunt' })} accessibilityRole="button" style={{ borderRadius: radii.lg, backgroundColor: c.ink, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Icon name="hardHat" size={22} color={hazard.yellow} />
              <View style={{ flex: 1 }}>
                <T variant="stencilSm" color={hazard.yellow} style={{ textTransform: 'uppercase' }}>
                  Hard Hat Hunt hotspot
                </T>
                <T variant="small" color={c.onInk} style={{ opacity: 0.85 }}>
                  Machines are often spotted here. Bring the camera.
                </T>
              </View>
              <Icon name="chevronRight" size={18} color={c.onInk} />
            </Press>
          ) : null}

          {p.description || p.blurb ? (
            <View style={{ gap: 10 }}>
              <T variant="h2">About</T>
              <T variant="body" tone="soft">
                {p.description ?? p.blurb}
              </T>
              {p.highlights?.length ? (
                <View style={{ gap: 8, marginTop: 4 }}>
                  {p.highlights.map((h) => (
                    <View key={h} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="check" size={13} color={c.onAccent} strokeWidth={3} />
                      </View>
                      <T variant="bodyStrong" style={{ flex: 1 }}>
                        {h}
                      </T>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          {p.amenities.length ? (
            <View style={{ gap: 10 }}>
              <T variant="h2">Good to know</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {p.amenities.map((a) => (
                  <View key={a} style={[neu(c, 'raisedSm'), { borderRadius: radii.md, paddingHorizontal: 12, height: 40, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                    <Icon name={AMENITY_BY_ID[a].icon} size={16} color={c.inkSoft} />
                    <T variant="smallStrong">{AMENITY_BY_ID[a].label}</T>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {p.events?.length ? (
            <View style={{ gap: 10 }}>
              <T variant="h2">What’s on</T>
              {p.events.map((e) => {
                const d = new Date(e.startsAt);
                return (
                  <View key={e.id} style={[neu(c, 'raisedSm'), { borderRadius: radii.md, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' }]}>
                    <View style={{ width: 50, height: 54, borderRadius: radii.sm, backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center' }}>
                      <T variant="micro" color={c.onInk} style={{ textTransform: 'uppercase' }}>
                        {d.toLocaleDateString('en', { weekday: 'short' })}
                      </T>
                      <T variant="h3" color={c.onInk}>
                        {d.getDate()}
                      </T>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <T variant="bodyStrong">{e.title}</T>
                      <T variant="small" tone="muted">
                        {d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })} · {e.price ?? 'Free'}
                        {e.ages ? ` · Ages ${e.ages}` : ''}
                      </T>
                    </View>
                    {e.sponsored ? <Pill label="Partner" tone="accent" /> : null}
                  </View>
                );
              })}
            </View>
          ) : null}

          {hours.length ? (
            <View style={{ gap: 10 }}>
              <Press onPress={() => setShowHours((v) => !v)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <T variant="h2">Opening hours</T>
                <Icon name={showHours ? 'chevronUp' : 'chevronDown'} size={20} />
              </Press>
              {showHours ? (
                <Surface depth="insetSm" radius={radii.md} style={{ padding: 14, gap: 8 }}>
                  {hours.map((h) => (
                    <View key={h.day} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <T variant="smallStrong">{h.day}</T>
                      <T variant="small" tone="soft" style={{ fontVariant: ['tabular-nums'] }}>
                        {h.text}
                      </T>
                    </View>
                  ))}
                </Surface>
              ) : null}
            </View>
          ) : null}

          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <T variant="h2">Parents say</T>
              <T variant="small" tone="muted">
                {reviews.length} {reviews.length === 1 ? 'vibe check' : 'vibe checks'}
              </T>
            </View>
            {reviews.length ? (
              reviews.slice(0, 8).map((v) => <Review key={v.id} v={v} />)
            ) : (
              <Surface depth="insetSm" radius={radii.md} style={{ padding: 16 }}>
                <T variant="small" tone="muted">
                  No written vibe checks yet. Been here? Tell other parents how it went.
                </T>
              </Surface>
            )}
          </View>

          <Press onPress={() => toast('Thanks! We’ll check the details.', { icon: 'check' })} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', padding: 8 }}>
            <Icon name="pencil" size={14} color={c.muted} />
            <T variant="small" tone="muted">
              Suggest an edit
            </T>
          </Press>
        </View>
      </Animated.ScrollView>

      {/* Header: floats over the cover, becomes a solid bar once scrolled */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top + 60,
          backgroundColor: c.bg,
          opacity: scrollY.interpolate({ inputRange: [160, 230], outputRange: [0, 1], extrapolate: 'clamp' }),
          boxShadow: `0px 6px 16px ${c.scheme === 'dark' ? 'rgba(0,0,0,0.35)' : 'rgba(40,52,72,0.10)'}`,
        }}
      />
      <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconButton icon="back" label="Back" variant="float" size={42} onPress={() => nav.goBack()} />
        <Animated.View pointerEvents="none" style={{ flex: 1, opacity: scrollY.interpolate({ inputRange: [200, 250], outputRange: [0, 1], extrapolate: 'clamp' }) }}>
          <T variant="h3" numberOfLines={1}>
            {p.name}
          </T>
        </Animated.View>
        <SaveHeart id={p.id} name={p.name} size={42} />
      </View>

      {/* Sticky actions */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 14), backgroundColor: c.bg, flexDirection: 'row', gap: 12, boxShadow: `0px -8px 20px ${c.scheme === 'dark' ? 'rgba(0,0,0,0.35)' : 'rgba(40,52,72,0.10)'}` }}>
        <Button title={myVibe ? 'Update vibe' : 'Vibe check'} icon="sparkles" variant="soft" size="lg" style={{ flex: 1 }} onPress={() => nav.navigate('VibeCheck', { id: p.id })} />
        <Button title="Let’s go" icon="navigate" variant="primary" size="lg" style={{ flex: 1.2 }} onPress={go} />
      </View>
    </View>
  );
}
