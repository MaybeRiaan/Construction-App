import { useNavigation } from '@react-navigation/native';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORY_BY_ID } from '../../data/categories';
import { LOVED, REJECT_REASON_BY_ID, SCOUT_POINTS } from '../../data/scouts';
import { communityPlaceId } from '../../domain/contribute';
import { useCommunity } from '../../state/CommunityProvider';
import { usePlaceData } from '../../state/PlacesProvider';
import { useScout, type ScoutItem } from '../../state/useScout';
import { neu } from '../../theme/neu';
import { useTheme } from '../../theme/ThemeProvider';
import { radii } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { Icon, type IconName } from '../../ui/Icon';
import { Pill, type PillTone } from '../../ui/Pill';
import { Press } from '../../ui/Press';
import { ProgressBar } from '../../ui/ProgressBar';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { SectionHeader } from '../../ui/Section';
import { Surface } from '../../ui/Surface';
import { T } from '../../ui/Text';

const STATUS: Record<ScoutItem['state'], { label: string; tone: PillTone; icon: IconName }> = {
  local: { label: 'On this phone', tone: 'neutral', icon: 'clock' },
  pending: { label: 'In review', tone: 'info', icon: 'clock' },
  approved: { label: 'Live', tone: 'success', icon: 'checkCircle' },
  rejected: { label: 'Not added', tone: 'neutral', icon: 'info' },
};

function day(iso: string): string {
  return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short' });
}

/** Your added places, their review status, and the Scout points they earned. */
export function ScoutScreen() {
  const { c } = useTheme();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const scout = useScout();
  const community = useCommunity();
  const data = usePlaceData();
  const next = scout.rank.next;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title="Your places" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32, gap: 22 }}>
        <View style={{ backgroundColor: c.ink, borderRadius: radii.lg, padding: 18, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="award" size={18} color={c.accent} />
            <T variant="label" color={c.onInk} style={{ opacity: 0.8 }}>
              Scout points
            </T>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
            <T variant="number" color={c.onInk} style={{ fontSize: 44, lineHeight: 46 }}>
              {scout.points}
            </T>
            <View style={{ backgroundColor: c.accent, borderRadius: 12, height: 24, paddingHorizontal: 10, justifyContent: 'center', marginBottom: 8 }}>
              <T variant="smallStrong" color={c.onAccent}>
                {scout.rank.title}
              </T>
            </View>
          </View>
          {next ? (
            <>
              <ProgressBar value={(scout.points - scout.rank.min) / (next.min - scout.rank.min)} />
              <T variant="small" color={c.onInk} style={{ opacity: 0.8 }}>
                {next.min - scout.points} to {next.title}
              </T>
            </>
          ) : null}
        </View>

        <Surface depth="insetSm" radius={radii.lg} style={{ padding: 16, gap: 10 }}>
          <T variant="bodyStrong">How points work</T>
          {[
            ['checkCircle', `+${SCOUT_POINTS.added} when a place you add goes live`],
            ['sparkles', `+${SCOUT_POINTS.loved} when ${LOVED.checks} other families rate it a vibe`],
            ['gift', 'Save them up: rewards from partner venues are on the way'],
          ].map(([icon, text]) => (
            <View key={text} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Icon name={icon as IconName} size={16} color={c.inkSoft} />
              <T variant="small" tone="soft" style={{ flex: 1 }}>
                {text}
              </T>
            </View>
          ))}
        </Surface>

        <Button title="Add a place" icon="plus" variant="accent" size="lg" full onPress={() => nav.navigate('AddPlace')} />

        {scout.items.length ? (
          <View style={{ gap: 12 }}>
            <SectionHeader title="Places you added" eyebrow={`${scout.live} live · ${scout.waiting} waiting`} style={{ paddingHorizontal: 0 }} />
            {scout.items.map(({ submission: s, state, review }) => {
              const status = STATUS[state];
              const placeId = review?.placeId ?? communityPlaceId(s.id);
              const live = state === 'approved' && Boolean(data.byId[placeId]);
              const note =
                state === 'rejected'
                  ? (review?.reason ? REJECT_REASON_BY_ID[review.reason].label : 'Not added')
                  : state === 'approved'
                    ? `Live since ${day(review?.reviewedAt ?? s.createdAt)} · +${SCOUT_POINTS.added}`
                    : state === 'local'
                      ? community.canSubmit
                        ? 'Will be sent when you’re online'
                        : 'This preview is read-only for you'
                      : `Added ${day(s.createdAt)}`;
              return (
                <Press
                  key={s.id}
                  disabled={!live}
                  onPress={() => nav.navigate('Place', { id: placeId })}
                  accessibilityRole={live ? 'button' : undefined}
                  accessibilityLabel={`${s.name}, ${status.label}`}
                  style={[neu(c, 'raisedSm'), { borderRadius: radii.lg, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }]}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: CATEGORY_BY_ID[s.category].color, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={CATEGORY_BY_ID[s.category].icon} size={19} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T variant="bodyStrong" numberOfLines={1}>
                      {s.name}
                    </T>
                    <T variant="micro" tone="muted" numberOfLines={1}>
                      {note}
                    </T>
                  </View>
                  <Pill label={status.label} tone={status.tone} icon={status.icon} />
                </Press>
              );
            })}
          </View>
        ) : (
          <EmptyState icon="pin" title="No places yet" body="Add a playground, café or walk you love and help other families find it." />
        )}

        {scout.lines.length ? (
          <View style={{ gap: 10 }}>
            <SectionHeader title="Points earned" style={{ paddingHorizontal: 0 }} />
            {scout.lines.map((l) => (
              <View key={l.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <T variant="bodyStrong" tone="success" style={{ width: 44 }}>
                  +{l.points}
                </T>
                <T variant="small" style={{ flex: 1 }} numberOfLines={1}>
                  {l.label}
                </T>
                <T variant="micro" tone="muted">
                  {day(l.at)}
                </T>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
