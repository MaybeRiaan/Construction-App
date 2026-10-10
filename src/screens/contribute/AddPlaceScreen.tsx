import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AMENITIES, CATEGORY_BY_ID } from '../../data/categories';
import { ADDABLE_CATEGORIES, MAX_PENDING, SCOUT_POINTS } from '../../data/scouts';
import { AGE_BANDS, ageBandFor } from '../../data/vibes';
import { draftProblem, likelyDuplicates, parentLabel } from '../../domain/contribute';
import { distanceM, formatDistance } from '../../domain/geo';
import { newId } from '../../domain/id';
import type { AgeBand, AmenityId, CategoryId, LatLng } from '../../domain/types';
import { AppMap } from '../../map/AppMap';
import type { MapMarker } from '../../map/types';
import { haptics } from '../../services/haptics';
import { useCommunity } from '../../state/CommunityProvider';
import { useLocation } from '../../state/LocationProvider';
import { usePlaceData } from '../../state/PlacesProvider';
import { useSettings } from '../../state/settings';
import { useScout } from '../../state/useScout';
import { neu } from '../../theme/neu';
import { useTheme } from '../../theme/ThemeProvider';
import { radii } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { Field } from '../../ui/Field';
import { Icon } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { Press } from '../../ui/Press';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { Segmented } from '../../ui/Segmented';
import { Surface } from '../../ui/Surface';
import { T } from '../../ui/Text';

const PIN = 46;

/** Drag the map under a fixed pin to mark where the place is. */
function PinPicker({ start, you, onDone, onCancel }: { start: LatLng; you: LatLng; onDone: (c: LatLng) => void; onCancel: () => void }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const data = usePlaceData();
  const [center, setCenter] = useState(start);
  // Nearby places for context, so a parent can see if it's already on the map.
  const markers = useMemo<MapMarker[]>(
    () =>
      data.places
        .filter((p) => distanceM(start, p.coordinate) < 2500)
        .slice(0, 80)
        .map((p) => ({ id: p.id, coordinate: p.coordinate, kind: 'place', color: CATEGORY_BY_ID[p.category].color, icon: CATEGORY_BY_ID[p.category].icon, label: p.name, muted: true })),
    [data.places, start],
  );
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.map.land }]}>
      <AppMap origin={start} you={you} radiusKm={0.5} showRange={false} markers={markers} onCenterChange={setCenter} />
      <View pointerEvents="none" style={{ position: 'absolute', left: '50%', top: '50%', marginLeft: -PIN / 2, marginTop: -PIN, alignItems: 'center' }}>
        <Icon name="pin" size={PIN} color={c.ink} fill={c.accent} strokeWidth={1.8} />
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', left: '50%', top: '50%', width: 14, height: 6, marginLeft: -7, marginTop: -3, borderRadius: 7, backgroundColor: 'rgba(16,18,22,0.25)' }} />
      <View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }} pointerEvents="box-none">
        <IconButton icon="close" label="Cancel" variant="float" size={42} onPress={onCancel} />
        <View style={[neu(c, 'float'), { flex: 1, borderRadius: 21, paddingHorizontal: 16, height: 42, justifyContent: 'center' }]}>
          <T variant="smallStrong" numberOfLines={1}>
            Move the map until the pin sits on the place
          </T>
        </View>
      </View>
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom, 16) }}>
        <Button title="Use this spot" icon="check" size="lg" full onPress={() => onDone(center)} />
      </View>
    </View>
  );
}

export function AddPlaceScreen() {
  const { c } = useTheme();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const { origin } = useLocation();
  const data = usePlaceData();
  const community = useCommunity();
  const scout = useScout();
  const kids = useSettings((s) => s.kids);
  const defaultBands = useMemo(() => [...new Set(kids.map((k) => ageBandFor(k.age)))], [kids]);

  const [coord, setCoord] = useState<LatLng>(origin);
  const [pinned, setPinned] = useState(false);
  const [picking, setPicking] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [ages, setAges] = useState<AgeBand[]>(defaultBands);
  const [amenities, setAmenities] = useState<AmenityId[]>([]);
  const [price, setPrice] = useState<'free' | 'paid'>('free');
  const [setting, setSetting] = useState<'outdoor' | 'indoor'>('outdoor');
  const [tip, setTip] = useState('');
  const [website, setWebsite] = useState('');
  const [notDuplicate, setNotDuplicate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ name: string; sent: boolean } | null>(null);

  // Until a pin is dropped, the map follows where you are.
  const at = pinned ? coord : origin;
  const author = parentLabel(kids.map((k) => k.age));
  const problem = (pinned ? null : 'Drop the pin on the place') ?? draftProblem({ name, category, ages, website });
  const full = scout.waiting >= MAX_PENDING;
  const dupes = useMemo(() => (pinned && name.trim().length >= 3 ? likelyDuplicates({ name, category, coordinate: coord }, data.places) : []), [pinned, name, category, coord, data.places]);
  const cat = category ? CATEGORY_BY_ID[category] : null;
  const preview = useMemo<MapMarker[]>(
    () => [{ id: 'new', coordinate: coord, kind: 'place', color: cat?.color ?? c.ink, icon: cat?.icon ?? 'pin', label: name.trim() || 'New place', selected: true }],
    [coord, cat, c.ink, name],
  );

  const toggle = <V,>(list: V[], v: V) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const reset = () => {
    setPinned(false);
    setCoord(origin);
    setName('');
    setCategory(null);
    setAges(defaultBands);
    setAmenities([]);
    setPrice('free');
    setSetting('outdoor');
    setTip('');
    setWebsite('');
    setNotDuplicate(false);
    setDone(null);
  };

  const submit = async () => {
    if (problem || !category || full || busy) return;
    setBusy(true);
    const sent = await community.submitPlace({
      id: newId('place_'),
      name: name.trim(),
      category,
      coordinate: coord,
      ages,
      amenities,
      price: price === 'paid' ? 1 : 0,
      indoor: setting === 'indoor',
      tip: tip.trim() || undefined,
      website: website.trim() || undefined,
      author,
      createdAt: new Date().toISOString(),
    });
    haptics.success();
    setBusy(false);
    setDone({ name: name.trim(), sent });
  };

  if (done) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenHeader close />
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, gap: 18, paddingBottom: insets.bottom + 24 }}>
          <View style={{ alignItems: 'center', gap: 14 }}>
            <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="sparkles" size={44} color={c.onAccent} />
            </View>
            <T variant="hero" center>
              {done.sent ? 'It’s in the queue' : 'Saved on this phone'}
            </T>
            <T variant="body" tone="soft" center style={{ maxWidth: 340 }}>
              {done.sent
                ? `Thanks! A real person checks ${done.name} next. If it’s a vibe, it goes live for every family and you earn ${SCOUT_POINTS.added} Scout points.`
                : community.canSubmit
                  ? `${done.name} will be sent for review when you’re back online.`
                  : `This shared preview is read-only for you, so ${done.name} stays on this phone.`}
            </T>
          </View>
          <View style={{ gap: 10, marginTop: 8 }}>
            <Button title="See your places" icon="award" variant="accent" size="lg" full onPress={() => nav.navigate('Scout')} />
            <Button title="Add another" icon="plus" variant="soft" full onPress={reset} />
            <Button title="Done" variant="ghost" full onPress={() => nav.goBack()} />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title="Add a place" close />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 150, gap: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 6 }}>
          <T variant="label" tone="muted">
            For parents, by parents
          </T>
          <T variant="hero">Know a great spot?</T>
          <T variant="body" tone="soft">
            Tell other families about it. We check every place by hand, and if it’s a vibe it goes on the map for everyone and you earn {SCOUT_POINTS.added} Scout points.
          </T>
        </View>

        <View style={{ gap: 10 }}>
          <T variant="h3">Where is it?</T>
          <Press onPress={() => setPicking(true)} accessibilityRole="button" accessibilityLabel={pinned ? 'Move the pin' : 'Drop the pin'} scaleTo={0.98} style={[neu(c, 'raised'), { height: 170, borderRadius: radii.lg, overflow: 'hidden' }]}>
            <AppMap key={`${at.latitude.toFixed(6)},${at.longitude.toFixed(6)}`} origin={at} radiusKm={0.35} showRange={false} markers={pinned ? preview : []} showUser={false} interactive={false} />
            <View pointerEvents="none" style={{ position: 'absolute', left: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.ink, borderRadius: 18, height: 36, paddingHorizontal: 14 }}>
              <Icon name="pin" size={15} color={c.onInk} />
              <T variant="smallStrong" color={c.onInk}>
                {pinned ? 'Move the pin' : 'Drop the pin'}
              </T>
            </View>
          </Press>
          <T variant="small" tone="muted">
            {!pinned ? 'Put the pin on the place itself. We never share where you are.' : distanceM(origin, coord) < 25 ? 'Pinned right where you are.' : `Pinned ${formatDistance(distanceM(origin, coord))} from you.`}
          </T>
        </View>

        <Field label="What’s it called?" value={name} onChangeText={(t) => setName(t.slice(0, 60))} placeholder="e.g. Puddle Lane Pocket Park" autoCapitalize="words" />

        <View style={{ gap: 12 }}>
          <T variant="h3">What kind of place?</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ADDABLE_CATEGORIES.map((id) => {
              const def = CATEGORY_BY_ID[id];
              return <Chip key={id} label={def.label} icon={def.icon} color={def.color} size="sm" selected={category === id} onPress={() => setCategory(category === id ? null : id)} />;
            })}
          </View>
        </View>

        {dupes.length && !notDuplicate ? (
          <Surface depth="insetSm" radius={radii.lg} style={{ padding: 16, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="info" size={18} color={c.info} />
              <T variant="bodyStrong">Already on Playdar?</T>
            </View>
            <T variant="small" tone="muted">
              {dupes.length === 1 ? 'This place is close by with a similar name.' : 'These are close by with similar names.'} If it’s one of them, add a vibe check there instead.
            </T>
            {dupes.map(({ place, distanceM: d }) => (
              <Press key={place.id} onPress={() => nav.navigate('Place', { id: place.id })} accessibilityRole="button" style={[neu(c, 'raisedSm'), { borderRadius: radii.md, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: CATEGORY_BY_ID[place.category].color, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={CATEGORY_BY_ID[place.category].icon} size={16} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <T variant="smallStrong" numberOfLines={1}>
                    {place.name}
                  </T>
                  <T variant="micro" tone="muted">
                    {formatDistance(d)} from your pin
                  </T>
                </View>
                <Icon name="chevronRight" size={16} color={c.muted} />
              </Press>
            ))}
            <Button title="No, mine’s different" variant="ghost" size="sm" onPress={() => setNotDuplicate(true)} />
          </Surface>
        ) : null}

        <View style={{ gap: 12 }}>
          <T variant="h3">Who’s it great for?</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {AGE_BANDS.map((b) => (
              <Chip key={b.id} label={`${b.label} ${b.range[0]}–${b.range[1]}`} size="sm" selected={ages.includes(b.id)} onPress={() => setAges((x) => toggle(x, b.id))} />
            ))}
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <T variant="h3">What’s there?</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {AMENITIES.map((a) => (
              <Chip key={a.id} label={a.label} icon={a.icon} size="sm" selected={amenities.includes(a.id)} onPress={() => setAmenities((x) => toggle(x, a.id))} />
            ))}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, gap: 8 }}>
            <T variant="label" tone="muted">
              Cost
            </T>
            <Segmented
              options={[
                { value: 'free', label: 'Free' },
                { value: 'paid', label: 'Paid' },
              ]}
              value={price}
              onChange={setPrice}
            />
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <T variant="label" tone="muted">
              Setting
            </T>
            <Segmented
              options={[
                { value: 'outdoor', label: 'Outdoor' },
                { value: 'indoor', label: 'Indoor' },
              ]}
              value={setting}
              onChange={setSetting}
            />
          </View>
        </View>

        <Field
          label="Why is it a vibe?"
          value={tip}
          onChangeText={(t) => setTip(t.slice(0, 280))}
          placeholder="What makes it great, the best time to go, where to park…"
          multiline
          hint={`${280 - tip.length} characters left`}
        />
        <Field label="Website (optional)" value={website} onChangeText={(t) => setWebsite(t.slice(0, 200))} placeholder="example.com" autoCapitalize="none" autoCorrect={false} keyboardType="url" />

        <Surface depth="insetSm" radius={radii.lg} style={{ padding: 14, flexDirection: 'row', gap: 12 }}>
          <Icon name="shield" size={18} color={c.muted} />
          <T variant="small" tone="soft" style={{ flex: 1 }}>
            Posted as “{author}”, never your name. Public places only, please: no homes or schools. We don’t share where you were when you added it.
          </T>
        </Surface>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: Math.max(insets.bottom, 16), backgroundColor: c.bg, gap: 8 }}>
        {full ? (
          <T variant="small" tone="muted" center>
            You have {MAX_PENDING} places waiting for review. Once they’re checked you can add more.
          </T>
        ) : problem ? (
          <T variant="small" tone="muted" center>
            {problem}
          </T>
        ) : !community.canSubmit ? (
          <T variant="small" tone="muted" center>
            This shared preview is read-only for you, so your place will stay on this phone.
          </T>
        ) : null}
        <Button title="Send for review" size="lg" full icon="send" disabled={Boolean(problem) || full} loading={busy} onPress={submit} />
      </View>

      {picking ? (
        <PinPicker
          start={at}
          you={origin}
          onCancel={() => setPicking(false)}
          onDone={(p) => {
            haptics.press();
            setCoord(p);
            setPinned(true);
            setPicking(false);
          }}
        />
      ) : null}
    </View>
  );
}
