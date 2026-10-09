import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { plural } from '../../domain/id';
import type { LeaderboardEntry } from '../../domain/types';
import { useCommunity } from '../../state/CommunityProvider';
import { neu } from '../../theme/neu';
import { useTheme } from '../../theme/ThemeProvider';
import { hazard, radii } from '../../theme/tokens';
import { Icon } from '../../ui/Icon';
import { Pill } from '../../ui/Pill';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { T } from '../../ui/Text';

function Podium({ e, place }: { e?: LeaderboardEntry; place: 1 | 2 | 3 }) {
  const { c } = useTheme();
  const h = place === 1 ? 130 : place === 2 ? 100 : 80;
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 8 }}>
      {place === 1 ? <Icon name="crown" size={26} color={hazard.yellow} fill={hazard.yellow} /> : null}
      <T variant="smallStrong" center numberOfLines={2} style={{ minHeight: 36 }}>
        {e?.teamName ?? '—'}
      </T>
      <View
        style={[
          { width: '100%', height: h, borderTopLeftRadius: radii.md, borderTopRightRadius: radii.md, alignItems: 'center', paddingTop: 12, gap: 2 },
          place === 1 ? { backgroundColor: hazard.yellow } : neu(c, 'raised'),
          e?.isMe && place !== 1 ? { backgroundColor: c.ink } : null,
        ]}
      >
        <T variant="stencilXL" color={place === 1 ? hazard.black : e?.isMe ? c.onInk : c.ink}>
          {place}
        </T>
        <T variant="micro" color={place === 1 ? hazard.black : e?.isMe ? c.onInk : c.muted}>
          {e ? `${e.xp} XP` : ''}
        </T>
      </View>
    </View>
  );
}

export function LeaderboardScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { leaderboard } = useCommunity();
  const [a, b, d, ...rest] = leaderboard;
  const hasSamples = leaderboard.some((x) => x.sample);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title="Leaderboard" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 18 }}>
        <View style={{ gap: 4 }}>
          <T variant="label" tone="muted">
            This week · families nearby
          </T>
          <T variant="h1">Top hunting crews</T>
          <T variant="small" tone="muted">
            XP from spots and challenges. Resets every Monday. Team names only, never kids’ names.
          </T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 6 }}>
          <Podium e={b} place={2} />
          <Podium e={a} place={1} />
          <Podium e={d} place={3} />
        </View>
        <View style={{ gap: 10 }}>
          {rest.map((e, i) => (
            <View
              key={e.id}
              style={[
                { borderRadius: radii.md, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
                e.isMe ? { backgroundColor: c.ink } : neu(c, 'raisedSm'),
              ]}
            >
              <T variant="stencil" color={e.isMe ? hazard.yellow : c.muted} style={{ width: 30 }}>
                {i + 4}
              </T>
              <View style={{ flex: 1 }}>
                <T variant="bodyStrong" color={e.isMe ? c.onInk : c.ink} numberOfLines={1}>
                  {e.teamName}
                  {e.isMe ? ' (you)' : ''}
                </T>
                <T variant="micro" color={e.isMe ? c.onInk : c.muted} style={{ opacity: e.isMe ? 0.75 : 1 }}>
                  {plural(e.spots, 'spot')} · {plural(e.types, 'machine type')}
                </T>
              </View>
              <T variant="h3" color={e.isMe ? hazard.yellow : c.ink} style={{ fontVariant: ['tabular-nums'] }}>
                {e.xp}
              </T>
            </View>
          ))}
        </View>
        {hasSamples ? (
          <View style={{ alignItems: 'center' }}>
            <Pill label="Includes sample crews from the demo town" tone="neutral" icon="info" />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
