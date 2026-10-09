import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeMedal } from '../../components/hunt/BadgeMedal';
import { BingoGrid } from '../../components/hunt/BingoGrid';
import { RaceLanes } from '../../components/hunt/RaceLanes';
import { BADGES } from '../../data/challenges';
import { allChallenges } from '../../domain/game';
import { useHunt } from '../../state/hunt';
import { useSettings } from '../../state/settings';
import { neu } from '../../theme/neu';
import { useTheme } from '../../theme/ThemeProvider';
import { hazard, radii } from '../../theme/tokens';
import { Icon } from '../../ui/Icon';
import { Pill } from '../../ui/Pill';
import { ProgressBar } from '../../ui/ProgressBar';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { Surface } from '../../ui/Surface';
import { T } from '../../ui/Text';

export function ChallengesScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const spots = useHunt((s) => s.spots);
  const hunts = useHunt((s) => s.hunts);
  const claimed = useHunt((s) => s.claimed);
  const kids = useSettings((s) => s.kids);
  const list = allChallenges({ spots, hunts, now: new Date() }, claimed);
  const bingo = list.find((x) => x.def.id === 'bingo')!;
  const earned = new Set(Object.keys(claimed).map((k) => k.split('@')[0]));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title="Challenges" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 22 }}>
        <Surface depth="raised" radius={radii.xl} style={{ padding: 16, gap: 14, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' }}>
            <Icon name="grid" size={20} color={c.accentDeep} />
            <View style={{ flex: 1 }}>
              <T variant="stencil">DIGGER BINGO</T>
              <T variant="small" tone="muted">
                New card every Monday. Three in a row wins +100 XP.
              </T>
            </View>
            {bingo.done ? <Pill label="BINGO!" tone="accent" icon="party" /> : null}
          </View>
          <BingoGrid spots={spots} />
          <T variant="micro" tone="muted">
            {bingo.detail}
          </T>
        </Surface>

        {kids.length ? (
          <Surface depth="raised" radius={radii.xl} style={{ padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Icon name="flag" size={20} color={c.accentDeep} />
              <View style={{ flex: 1 }}>
                <T variant="h3">Family race</T>
                <T variant="small" tone="muted">
                  First to spot 10 different machines wins. Pick who’s spotting on each snap.
                </T>
              </View>
            </View>
            <RaceLanes kids={kids} spots={spots} />
          </Surface>
        ) : null}

        <View style={{ gap: 12 }}>
          <T variant="h2">All challenges</T>
          {list
            .filter((x) => x.def.id !== 'bingo')
            .map((ch) => (
              <View key={ch.def.id} style={[neu(c, ch.done ? 'insetSm' : 'raised'), { borderRadius: radii.lg, padding: 14, gap: 10 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: ch.done ? hazard.yellow : c.ink, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={ch.done ? 'check' : ch.def.icon} size={19} color={ch.done ? hazard.black : hazard.yellow} strokeWidth={ch.done ? 3 : 2.2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <T variant="bodyStrong">{ch.def.title}</T>
                    <T variant="small" tone="muted">
                      {ch.detail ?? ch.def.description}
                    </T>
                  </View>
                  <Pill label={ch.done ? (ch.def.cadence === 'daily' ? 'Done today' : 'Done') : `+${ch.def.xp} XP`} tone={ch.done ? 'success' : 'accent'} />
                </View>
                {!ch.done ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ProgressBar value={ch.progress / ch.target} height={10} style={{ flex: 1 }} />
                    <T variant="micro" tone="muted" style={{ fontVariant: ['tabular-nums'] }}>
                      {ch.progress}/{ch.target}
                    </T>
                  </View>
                ) : null}
              </View>
            ))}
        </View>

        <View style={{ gap: 12 }}>
          <T variant="h2">Badges</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 }}>
            {BADGES.map((b) => {
              const has = [...earned].some((id) => list.find((x) => x.def.id === id)?.def.badge === b.id);
              return <BadgeMedal key={b.id} badge={b} earned={has} size={58} />;
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
