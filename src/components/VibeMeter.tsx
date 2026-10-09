import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { VIBE_LEVELS, VIBE_TAG_BY_ID } from '../data/vibes';
import type { VibeStats } from '../domain/types';
import { vibePercent, vibeScore, vibeVerdict } from '../domain/vibe';
import { useTheme } from '../theme/ThemeProvider';
import { Icon } from '../ui/Icon';
import { Pill } from '../ui/Pill';
import { Surface } from '../ui/Surface';
import { T } from '../ui/Text';

function arc(score: number) {
  const r = 80;
  const t = Math.PI - (Math.PI * Math.max(0.5, Math.min(100, score))) / 100;
  const x = 100 + r * Math.cos(t);
  const y = 100 - r * Math.sin(t);
  return `M20 100 A80 80 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`;
}

/** The headline rating: a 0–100 gauge plus how parents voted. */
export function VibeMeter({ stats }: { stats?: VibeStats }) {
  const { c } = useTheme();
  const verdict = vibeVerdict(stats);
  const score = stats && stats.count ? vibeScore(stats.avg) : 0;
  const pct = vibePercent(stats);
  const fill = verdict.tone === 'hot' ? c.accent : verdict.tone === 'cold' ? c.danger : c.ink;
  const max = Math.max(1, ...(stats?.dist ?? [1]));
  const t = Math.PI - (Math.PI * Math.max(0.5, score)) / 100;
  return (
    <Surface depth="raised" radius={26} style={{ padding: 18, gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ width: 150, height: 92 }}>
          <Svg width={150} height={92} viewBox="0 0 200 116">
            <Path d="M20 100 A80 80 0 0 1 180 100" stroke={c.well} strokeWidth={18} strokeLinecap="round" fill="none" />
            {stats?.count ? <Path d={arc(score)} stroke={fill} strokeWidth={18} strokeLinecap="round" fill="none" /> : null}
            {stats?.count ? <Circle cx={100 + 80 * Math.cos(t)} cy={100 - 80 * Math.sin(t)} r={7} fill={c.bg} stroke={fill} strokeWidth={4} /> : null}
          </Svg>
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' }}>
            <T variant="number" style={{ fontSize: 34, lineHeight: 36 }}>
              {stats?.count ? score : '–'}
            </T>
          </View>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <T variant="label" tone="muted">
            Vibe meter
          </T>
          <T variant="h2">{verdict.label}</T>
          <T variant="small" tone="muted">
            {stats?.count ? `${pct}% of ${stats.count} parents say it’s a vibe` : 'No vibe checks yet. Be the first.'}
          </T>
        </View>
      </View>
      {stats?.count ? (
        <View style={{ gap: 7 }}>
          {[...VIBE_LEVELS].reverse().map((lvl) => {
            const n = stats.dist[lvl.score - 1];
            return (
              <View key={lvl.score} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon name={lvl.icon} size={15} color={c.inkSoft} />
                <T variant="micro" tone="soft" style={{ width: 70 }}>
                  {lvl.short}
                </T>
                <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: c.well, overflow: 'hidden' }}>
                  <View style={{ width: `${(n / max) * 100}%`, height: 8, borderRadius: 4, backgroundColor: lvl.score >= 4 ? fill : c.faint }} />
                </View>
                <T variant="micro" tone="muted" style={{ width: 28, textAlign: 'right', fontVariant: ['tabular-nums'] }}>
                  {n}
                </T>
              </View>
            );
          })}
        </View>
      ) : null}
      {stats?.topTags.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {stats.topTags.slice(0, 5).map((t2) => {
            const def = VIBE_TAG_BY_ID[t2];
            if (!def) return null;
            return <Pill key={t2} label={def.label} tone={def.tone === 'good' ? 'success' : 'sponsored'} icon={def.tone === 'good' ? 'check' : 'info'} />;
          })}
        </View>
      ) : null}
    </Surface>
  );
}
