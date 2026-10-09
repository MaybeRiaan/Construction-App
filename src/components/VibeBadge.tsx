import { View } from 'react-native';
import type { VibeStats } from '../domain/types';
import { vibeScore, vibeVerdict } from '../domain/vibe';
import { useTheme } from '../theme/ThemeProvider';
import { Icon, type IconName } from '../ui/Icon';
import { T } from '../ui/Text';

const TONE_ICON: Record<string, IconName> = { hot: 'flame', good: 'sparkles', mixed: 'meh', cold: 'frown', new: 'sparkle' };

export function vibeColors(tone: string, c: ReturnType<typeof useTheme>['c']) {
  switch (tone) {
    case 'hot':
      return { bg: c.accent, fg: c.onAccent };
    case 'good':
      return { bg: c.ink, fg: c.onInk };
    case 'mixed':
      return { bg: c.well, fg: c.inkSoft };
    case 'cold':
      return { bg: c.well, fg: c.danger };
    default:
      return { bg: c.well, fg: c.muted };
  }
}

/** Compact Vibe Meter reading: "92 Total vibe". */
export function VibeBadge({ stats, compact }: { stats?: VibeStats; compact?: boolean }) {
  const { c } = useTheme();
  const v = vibeVerdict(stats);
  const { bg, fg } = vibeColors(v.tone, c);
  const score = stats && stats.count ? vibeScore(stats.avg) : null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: bg, borderRadius: 999, paddingHorizontal: 9, height: 24, alignSelf: 'flex-start' }}>
      <Icon name={TONE_ICON[v.tone]} size={12} color={fg} strokeWidth={2.6} />
      {score != null ? (
        <T variant="micro" color={fg} style={{ fontSize: 12, fontVariant: ['tabular-nums'] }}>
          {score}
        </T>
      ) : null}
      {!compact || score == null ? (
        <T variant="micro" color={fg} style={{ fontSize: 11.5 }}>
          {v.label}
        </T>
      ) : null}
    </View>
  );
}
