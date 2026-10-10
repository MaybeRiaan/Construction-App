import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AGE_BANDS, ageBandFor, VIBE_LEVELS, VIBE_TAGS } from '../../data/vibes';
import { parentLabel } from '../../domain/contribute';
import { newId } from '../../domain/id';
import type { AgeBand, VibeScore } from '../../domain/types';
import type { RootStackParamList } from '../../navigation/types';
import { haptics } from '../../services/haptics';
import { usePlaceData } from '../../state/PlacesProvider';
import { usePlaces } from '../../state/places';
import { useSettings } from '../../state/settings';
import { toast } from '../../state/ui';
import { neu } from '../../theme/neu';
import { useTheme } from '../../theme/ThemeProvider';
import { radii } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { Field } from '../../ui/Field';
import { Icon } from '../../ui/Icon';
import { Press } from '../../ui/Press';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { T } from '../../ui/Text';

/** One question for parents: was it a vibe? Plus quick tags other parents care about. */
export function VibeCheckScreen() {
  const { c } = useTheme();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProp<RootStackParamList, 'VibeCheck'>>();
  const place = usePlaceData().byId[params.id];
  const existing = usePlaces((s) => s.myVibes.find((v) => v.placeId === params.id));
  const addVibe = usePlaces((s) => s.addVibe);
  const kids = useSettings((s) => s.kids);
  const defaultBands = useMemo(() => [...new Set(kids.map((k) => ageBandFor(k.age)))], [kids]);

  const [score, setScore] = useState<VibeScore | null>(existing?.score ?? null);
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [ages, setAges] = useState<AgeBand[]>(existing?.ages ?? defaultBands);
  const [note, setNote] = useState(existing?.note ?? '');

  const author = parentLabel(kids.map((k) => k.age));
  const level = score ? VIBE_LEVELS[score - 1] : null;

  const submit = () => {
    if (!score) return;
    addVibe({ id: existing?.id ?? newId('vibe_'), placeId: params.id, author, score, tags, ages, note: note.trim() || undefined, createdAt: new Date().toISOString() });
    haptics.success();
    toast(score >= 4 ? 'Vibe check posted. Thanks for sharing!' : 'Thanks. Honest checks help everyone.', { icon: 'sparkles', tone: 'accent' });
    nav.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title="Vibe check" close />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 120, gap: 26 }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 4 }}>
          <T variant="label" tone="muted">
            {place?.name ?? 'This place'}
          </T>
          <T variant="hero">Was it a vibe?</T>
        </View>

        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {VIBE_LEVELS.map((l) => {
              const on = score === l.score;
              return (
                <Press
                  key={l.score}
                  onPress={() => {
                    haptics.press();
                    setScore(l.score);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={l.label}
                  scaleTo={0.9}
                  style={[
                    { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
                    on ? { backgroundColor: l.score >= 4 ? c.accent : c.ink } : neu(c, 'raised'),
                  ]}
                >
                  <Icon name={l.icon} size={26} color={on ? (l.score >= 4 ? c.onAccent : c.onInk) : c.inkSoft} />
                </Press>
              );
            })}
          </View>
          <View style={[neu(c, 'insetSm'), { borderRadius: radii.md, height: 52, alignItems: 'center', justifyContent: 'center' }]}>
            <T variant="h2" tone={level ? 'ink' : 'faint'}>
              {level ? level.label : 'Tap a face'}
            </T>
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <T variant="h3">What stood out?</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {VIBE_TAGS.map((t) => (
              <Chip
                key={t.id}
                label={t.label}
                size="sm"
                icon={t.tone === 'good' ? undefined : 'info'}
                selected={tags.includes(t.id)}
                onPress={() => setTags((x) => (x.includes(t.id) ? x.filter((y) => y !== t.id) : [...x, t.id]))}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <T variant="h3">Who came along?</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {AGE_BANDS.map((b) => (
              <Chip
                key={b.id}
                label={`${b.label} ${b.range[0]}–${b.range[1]}`}
                size="sm"
                selected={ages.includes(b.id)}
                onPress={() => setAges((x) => (x.includes(b.id) ? x.filter((y) => y !== b.id) : [...x, b.id]))}
              />
            ))}
          </View>
        </View>

        <Field
          label="Tip for other parents (optional)"
          value={note}
          onChangeText={(t) => setNote(t.slice(0, 280))}
          placeholder="Best time to go, where to park, what to bring…"
          multiline
          hint={`${280 - note.length} characters left · Posted as “${author}”. Never your name or your kids’ names.`}
        />
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: Math.max(insets.bottom, 16), backgroundColor: c.bg }}>
        <Button title={existing ? 'Update vibe check' : 'Post vibe check'} size="lg" full disabled={!score} onPress={submit} icon="send" />
      </View>
    </View>
  );
}
