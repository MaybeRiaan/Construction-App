import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaceRow } from '../../components/PlaceCard';
import { search } from '../../domain/search';
import type { RootStackParamList } from '../../navigation/types';
import { AiUnavailableError, askPlaydar, type AskResult } from '../../services/ai';
import { useCommunity } from '../../state/CommunityProvider';
import { usePlaceData } from '../../state/PlacesProvider';
import { usePlaces } from '../../state/places';
import { useSettings } from '../../state/settings';
import { neu } from '../../theme/neu';
import { useTheme } from '../../theme/ThemeProvider';
import { radii } from '../../theme/tokens';
import { font } from '../../theme/typography';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { EmptyState } from '../../ui/EmptyState';
import { Icon } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { Press } from '../../ui/Press';
import { Segmented } from '../../ui/Segmented';
import { T } from '../../ui/Text';

const SUGGESTIONS = ['Splash pad', 'Toddler', 'Dinosaurs', 'Trains', 'Story time', 'Free', 'Diggers', 'Rainy day'];
const ASK_IDEAS = [
  'Somewhere shady with clean toilets for a 2-year-old',
  'Rainy Saturday ideas for a 4 and a 7-year-old',
  'Free things to do within 10 minutes',
  'Where can we watch real diggers working?',
];

type Mode = 'search' | 'ask';

export function SearchScreen() {
  const { c } = useTheme();
  const nav = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Search'>>();
  const insets = useSafeAreaInsets();
  const data = usePlaceData();
  const { ai } = useCommunity();
  const filters = usePlaces((s) => s.filters);
  const recent = usePlaces((s) => s.recentSearches);
  const addRecent = usePlaces((s) => s.addRecentSearch);
  const radiusKm = useSettings((s) => s.radiusKm);
  const kids = useSettings((s) => s.kids);
  const [mode, setMode] = useState<Mode>(route.params?.ask ? 'ask' : 'search');
  const [text, setText] = useState('');
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<AskResult | null>(null);
  const [askError, setAskError] = useState<string | null>(null);
  const ctl = useRef<AbortController | null>(null);
  const input = useRef<TextInput>(null);

  useEffect(() => {
    const t = setTimeout(() => input.current?.focus(), 350);
    return () => {
      clearTimeout(t);
      ctl.current?.abort();
    };
  }, []);

  const kidAges = useMemo(() => kids.map((k) => k.age), [kids]);
  const results = useMemo(() => {
    if (mode !== 'search' || !text.trim()) return [];
    // Search looks a little wider than the radar range so a name always turns up.
    return search(data.places, { filters: { ...filters, categories: [], intent: null }, radiusKm: Math.max(radiusKm, 25), kidAges, text });
  }, [mode, text, data.places, filters, radiusKm, kidAges]);

  const inRange = useMemo(() => search(data.places, { filters: { ...filters, categories: [], intent: null }, radiusKm, kidAges }), [data.places, filters, radiusKm, kidAges]);

  const runAsk = async (q: string) => {
    const question = q.trim();
    if (!question) return;
    setText(question);
    addRecent(question);
    setAnswer(null);
    setAskError(null);
    ctl.current?.abort();
    const c2 = new AbortController();
    ctl.current = c2;
    setAsking(true);
    try {
      setAnswer(await askPlaydar(question, inRange.length ? inRange : data.places, kidAges, c2.signal));
    } catch (e) {
      if (c2.signal.aborted) return;
      const reason = e instanceof AiUnavailableError ? e.reason : 'failed';
      setAskError(
        reason === 'declined'
          ? 'Ask needs permission to use Claude. Allow it when prompted, or use regular search.'
          : reason === 'busy'
            ? 'Ask is busy right now. Try again in a minute.'
            : reason === 'unavailable'
              ? 'Ask runs on Playdar’s AI service, which isn’t connected in this build. Regular search still works.'
              : 'Something went wrong. Try again, or use regular search.',
      );
    } finally {
      if (ctl.current === c2) setAsking(false);
    }
  };

  const open = (id: string) => nav.navigate('Place', { id });
  const aiReady = ai?.ask;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, gap: 12, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <IconButton icon="back" label="Back" onPress={() => nav.goBack()} size={44} />
          <View style={[neu(c, 'insetSm'), { flex: 1, height: 50, borderRadius: 25, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 }]}>
            <Icon name={mode === 'ask' ? 'sparkles' : 'search'} size={18} color={c.muted} />
            <TextInput
              ref={input}
              value={text}
              onChangeText={(t) => {
                setText(t);
                if (mode === 'ask') setAnswer(null);
              }}
              onSubmitEditing={() => (mode === 'ask' ? runAsk(text) : addRecent(text))}
              placeholder={mode === 'ask' ? 'Ask anything about nearby…' : 'Parks, splash pads, story time…'}
              placeholderTextColor={c.faint}
              returnKeyType={mode === 'ask' ? 'send' : 'search'}
              accessibilityLabel={mode === 'ask' ? 'Ask Playdar' : 'Search'}
              style={[font('body', 600), { flex: 1, fontSize: 16, color: c.ink }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
            />
            {text ? <IconButton icon="close" label="Clear" variant="plain" size={30} onPress={() => (setText(''), setAnswer(null))} /> : null}
          </View>
        </View>
        <Segmented<Mode>
          options={[
            { value: 'search', label: 'Search', icon: 'search' },
            { value: 'ask', label: 'Ask Playdar', icon: 'sparkles' },
          ]}
          value={mode}
          onChange={(m) => {
            setMode(m);
            setAnswer(null);
            setAskError(null);
          }}
        />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40, gap: 16 }}>
        {mode === 'search' ? (
          text.trim() ? (
            results.length ? (
              <View style={{ gap: 12 }}>
                <T variant="label" tone="muted">
                  {results.length} {results.length === 1 ? 'match' : 'matches'}
                </T>
                {results.map((p) => (
                  <PlaceRow key={p.id} p={p} onPress={() => (addRecent(text), open(p.id))} />
                ))}
              </View>
            ) : (
              <EmptyState icon="telescope" title="No matches" body={`Nothing nearby matches “${text}”. Try Ask Playdar for a smarter search.`} action="Ask Playdar" onAction={() => (setMode('ask'), runAsk(text))} />
            )
          ) : (
            <View style={{ gap: 20 }}>
              {recent.length ? (
                <View style={{ gap: 10 }}>
                  <T variant="label" tone="muted">
                    Recent
                  </T>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {recent.map((r) => (
                      <Chip key={r} label={r} icon="clock" size="sm" onPress={() => setText(r)} />
                    ))}
                  </View>
                </View>
              ) : null}
              <View style={{ gap: 10 }}>
                <T variant="label" tone="muted">
                  Try
                </T>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {SUGGESTIONS.map((s) => (
                    <Chip key={s} label={s} size="sm" onPress={() => setText(s)} />
                  ))}
                </View>
              </View>
            </View>
          )
        ) : (
          <View style={{ gap: 16 }}>
            {!answer && !asking && !askError ? (
              <View style={{ gap: 12 }}>
                <View style={{ backgroundColor: c.ink, borderRadius: radii.lg, padding: 16, gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon name="sparkles" size={18} color={c.accent} />
                    <T variant="h3" color={c.onInk}>
                      Ask Playdar
                    </T>
                  </View>
                  <T variant="small" color={c.onInk} style={{ opacity: 0.8 }}>
                    Describe what you need in your own words. Playdar reads the {inRange.length} places in your range, their vibe checks and opening hours, then picks the best three.
                  </T>
                  {!aiReady && ai ? (
                    <T variant="micro" color={c.accent} style={{ marginTop: 4 }}>
                      AI isn’t connected in this build. You’ll see what it would do once it is.
                    </T>
                  ) : null}
                </View>
                {ASK_IDEAS.map((q) => (
                  <Press key={q} onPress={() => runAsk(q)} accessibilityRole="button" style={[neu(c, 'raisedSm'), { borderRadius: radii.md, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
                    <Icon name="sparkle" size={16} color={c.muted} />
                    <T variant="bodyStrong" style={{ flex: 1 }}>
                      {q}
                    </T>
                    <Icon name="arrowRight" size={16} color={c.muted} />
                  </Press>
                ))}
              </View>
            ) : null}

            {asking ? (
              <View style={[neu(c, 'raised'), { borderRadius: radii.lg, padding: 20, alignItems: 'center', gap: 12 }]}>
                <ActivityIndicator color={c.ink} />
                <T variant="bodyStrong">Thinking it over…</T>
                <T variant="small" tone="muted" center>
                  Checking vibes, opening hours and ages for “{text}”.
                </T>
                <Button title="Stop" variant="soft" size="sm" onPress={() => (ctl.current?.abort(), setAsking(false))} />
              </View>
            ) : null}

            {askError ? (
              <View style={{ gap: 12 }}>
                <View style={[neu(c, 'insetSm'), { borderRadius: radii.md, padding: 14, flexDirection: 'row', gap: 10 }]}>
                  <Icon name="info" size={18} color={c.muted} />
                  <T variant="small" tone="soft" style={{ flex: 1 }}>
                    {askError}
                  </T>
                </View>
                {text.trim() ? <Button title={`Search for “${text.trim()}” instead`} variant="soft" onPress={() => setMode('search')} /> : null}
              </View>
            ) : null}

            {answer ? (
              <View style={{ gap: 14 }}>
                <View style={{ backgroundColor: c.ink, borderRadius: radii.lg, padding: 16, flexDirection: 'row', gap: 12 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="sparkles" size={17} color={c.onAccent} />
                  </View>
                  <T variant="body" color={c.onInk} style={{ flex: 1 }}>
                    {answer.answer || 'Here are my picks.'}
                  </T>
                </View>
                {answer.picks.map((pick, i) => {
                  const p = data.byId[pick.placeId];
                  if (!p) return null;
                  return (
                    <View key={pick.placeId} style={{ gap: 8 }}>
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 4 }}>
                        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center' }}>
                          <T variant="micro" color={c.onInk}>
                            {i + 1}
                          </T>
                        </View>
                        <T variant="smallStrong" tone="soft" style={{ flex: 1 }}>
                          {pick.why}
                        </T>
                      </View>
                      <PlaceRow p={p} onPress={() => open(p.id)} />
                    </View>
                  );
                })}
                <Button title="Ask something else" variant="soft" icon="refresh" onPress={() => (setAnswer(null), setText(''), input.current?.focus())} />
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
