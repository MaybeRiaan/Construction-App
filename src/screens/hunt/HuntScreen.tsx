import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VehicleArt } from '../../art/VehicleArt';
import { BingoGrid } from '../../components/hunt/BingoGrid';
import { RaceLanes } from '../../components/hunt/RaceLanes';
import { SiteSign } from '../../components/hunt/SiteSign';
import { MachineCard } from '../../components/MachineCard';
import { SpotCard } from '../../components/SpotCard';
import { VEHICLE_BY_ID, VEHICLES } from '../../data/vehicles';
import { allChallenges, dailyMissionType, levelFor } from '../../domain/game';
import { distanceM, formatDistance } from '../../domain/geo';
import type { Spot } from '../../domain/types';
import { AppMap } from '../../map/AppMap';
import type { AppMapHandle, MapMarker } from '../../map/types';
import { useTabBarSpace } from '../../navigation/TabBar';
import { haptics } from '../../services/haptics';
import { useCommunity } from '../../state/CommunityProvider';
import { totalXp, useHunt } from '../../state/hunt';
import { useLocation } from '../../state/LocationProvider';
import { useSettings } from '../../state/settings';
import { useUi } from '../../state/ui';
import { useHuntTracker } from '../../state/useHuntTracker';
import { neu } from '../../theme/neu';
import { useTheme } from '../../theme/ThemeProvider';
import { hazard, radii } from '../../theme/tokens';
import { Avatar } from '../../ui/Avatar';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { Hazard } from '../../ui/Hazard';
import { Icon } from '../../ui/Icon';
import { Pill } from '../../ui/Pill';
import { Press } from '../../ui/Press';
import { ProgressBar } from '../../ui/ProgressBar';
import { SectionHeader } from '../../ui/Section';
import { Surface } from '../../ui/Surface';
import { T } from '../../ui/Text';

function useClock(start?: string): string {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!start) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [start]);
  if (!start) return '0:00';
  const s = Math.max(0, Math.floor((now - new Date(start).getTime()) / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function spotMarker(s: Spot, selected = false): MapMarker {
  return {
    id: s.id,
    coordinate: s.coordinate,
    kind: 'spot',
    color: hazard.yellow,
    icon: 'hardHat',
    vehicle: s.typeId,
    label: s.nickname ?? VEHICLE_BY_ID[s.typeId].name,
    mine: s.ownerId === 'me',
    muted: s.sample,
    selected,
  };
}

function ActiveHunt() {
  const { c } = useTheme();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const { origin } = useLocation();
  const community = useCommunity();
  const hunt = useHunt((s) => s.activeHunt)!;
  const mySpots = useHunt((s) => s.spots);
  const endHunt = useHunt((s) => s.endHunt);
  const setCelebration = useUi((s) => s.setCelebration);
  const { position, simulated } = useHuntTracker();
  const clock = useClock(hunt.startedAt);
  const map = useRef<AppMapHandle>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const units = useSettings((s) => s.units);

  const huntSpots = useMemo(() => mySpots.filter((s) => hunt.spotIds.includes(s.id)), [mySpots, hunt.spotIds]);
  const famous = useMemo(() => community.allSpots.filter((s) => s.nickname && s.ownerId !== 'me'), [community.allSpots]);
  const near = useMemo(() => {
    let best: { s: Spot; d: number } | null = null;
    for (const s of famous) {
      const d = distanceM(position, s.coordinate);
      if (d < 450 && (!best || d < best.d)) best = { s, d };
    }
    return best;
  }, [famous, position]);
  const markers = useMemo(() => [...famous.map((s) => spotMarker(s)), ...huntSpots.map((s) => spotMarker({ ...s, ownerId: 'me' }))], [famous, huntSpots]);
  const mission = dailyMissionType(new Date());

  useEffect(() => {
    if (near) haptics.press();
  }, [near?.s.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the camera on the car in the demo.
  useEffect(() => {
    map.current?.focus(position);
  }, [position]);

  const finish = () => {
    const summary = endHunt();
    setConfirmEnd(false);
    if (summary && (summary.spots.length || summary.completed.length)) {
      setCelebration({ kind: 'hunt', xp: summary.session.xpEarned, completed: summary.completed, xpBefore: 0, xpAfter: 0, hunt: summary });
      nav.navigate('Celebrate');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.map.land }}>
      <AppMap
        ref={map}
        origin={origin}
        markers={markers}
        trail={hunt.path}
        you={position}
        showUser
        padding={{ top: insets.top + 100, bottom: tabSpace + 160 }}
        onMarkerPress={(id) => nav.navigate('SpotDetail', { id })}
      />
      <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View style={{ backgroundColor: hazard.black, paddingTop: insets.top + 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, gap: 12 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.danger }} />
            <T variant="stencil" color={hazard.yellow} style={{ flex: 1 }}>
              HUNT IN PROGRESS
            </T>
            <Button title="End" variant="accent" size="sm" onPress={() => setConfirmEnd(true)} />
          </View>
          <Hazard height={8} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, padding: 14 }}>
          {[
            { icon: 'timer' as const, value: clock, label: 'Time' },
            { icon: 'route' as const, value: formatDistance(hunt.distanceM, units), label: simulated ? 'Demo drive' : 'Driven' },
            { icon: 'hardHat' as const, value: String(huntSpots.length), label: 'Spotted' },
          ].map((s) => (
            <View key={s.label} style={[neu(c, 'float'), { flex: 1, borderRadius: radii.md, paddingVertical: 10, paddingHorizontal: 12, gap: 2 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name={s.icon} size={14} color={c.muted} />
                <T variant="micro" tone="muted">
                  {s.label}
                </T>
              </View>
              <T variant="h2" style={{ fontVariant: ['tabular-nums'] }}>
                {s.value}
              </T>
            </View>
          ))}
        </View>
        {near ? (
          <Press
            onPress={() => nav.navigate('SpotDetail', { id: near.s.id })}
            accessibilityRole="button"
            style={{ marginHorizontal: 14, borderRadius: radii.lg, backgroundColor: hazard.yellow, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, boxShadow: c.floatShadow }}
          >
            <VehicleArt type={near.s.typeId} width={64} />
            <View style={{ flex: 1 }}>
              <T variant="stencilSm" color={hazard.black}>
                FAMOUS MACHINE NEARBY!
              </T>
              <T variant="smallStrong" color={hazard.black}>
                {near.s.nickname} is about {formatDistance(near.d, units)} away. Can you find it?
              </T>
            </View>
            <Icon name="chevronRight" size={18} color={hazard.black} />
          </Press>
        ) : null}
      </View>

      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: tabSpace + 8, alignItems: 'center', gap: 10 }}>
        <View style={[neu(c, 'float'), { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 14, height: 36 }]}>
          <Icon name="target" size={15} color={c.accentDeep} />
          <T variant="smallStrong">Mission: spot a {VEHICLE_BY_ID[mission].name.toLowerCase()}</T>
        </View>
        <Press
          onPress={() => {
            haptics.heavy();
            nav.navigate('Spot');
          }}
          accessibilityRole="button"
          accessibilityLabel="Spot a machine"
          scaleTo={0.92}
          style={{ width: 104, height: 104, borderRadius: 52, backgroundColor: hazard.yellow, alignItems: 'center', justifyContent: 'center', borderWidth: 6, borderColor: hazard.black, boxShadow: '0px 12px 26px rgba(16,18,22,0.4)' }}
        >
          <Icon name="camera" size={34} color={hazard.black} strokeWidth={2.4} />
          <T variant="stencilSm" color={hazard.black}>
            SPOT!
          </T>
        </Press>
      </View>

      {confirmEnd ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.scrim, justifyContent: 'center', padding: 24 }}>
          <Surface depth="flat" radius={radii.xl} style={{ padding: 20, gap: 14, backgroundColor: c.bg }}>
            <T variant="h2">End this hunt?</T>
            <T variant="body" tone="muted">
              {huntSpots.length
                ? `You spotted ${huntSpots.length} ${huntSpots.length === 1 ? 'machine' : 'machines'} in ${clock}. Nice work, crew.`
                : 'Nothing spotted yet. Keep your eyes peeled for cranes and cones!'}
            </T>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Keep hunting" variant="soft" style={{ flex: 1 }} onPress={() => setConfirmEnd(false)} />
              <Button title="End hunt" variant="primary" style={{ flex: 1 }} onPress={finish} />
            </View>
          </Surface>
        </View>
      ) : null}
    </View>
  );
}

function HuntHub() {
  const { c } = useTheme();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const { origin } = useLocation();
  const community = useCommunity();
  const spots = useHunt((s) => s.spots);
  const hunts = useHunt((s) => s.hunts);
  const claimed = useHunt((s) => s.claimed);
  const startHunt = useHunt((s) => s.startHunt);
  const kids = useSettings((s) => s.kids);
  const activeKidId = useSettings((s) => s.activeKidId);
  const setActiveKid = useSettings((s) => s.setActiveKid);
  const teamName = useSettings((s) => s.teamName);

  const xp = totalXp({ spots, claimed });
  const level = levelFor(xp);
  const now = new Date();
  const challenges = allChallenges({ spots, hunts, now }, claimed);
  const daily = challenges.find((x) => x.def.id === 'daily')!;
  const mission = dailyMissionType(now);
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of spots) m[s.typeId] = (m[s.typeId] ?? 0) + 1;
    return m;
  }, [spots]);
  const typesFound = Object.keys(counts).length;
  const famous = useMemo(
    () =>
      community.allSpots
        .filter((s) => s.nickname && s.ownerId !== 'me')
        .map((s) => ({ s, d: distanceM(origin, s.coordinate) }))
        .sort((a, b) => community.voteCount(b.s.id) - community.voteCount(a.s.id))
        .slice(0, 3),
    [community, origin],
  );
  const rank = community.leaderboard.findIndex((e) => e.isMe) + 1;
  const activeKid = kids.find((k) => k.id === activeKidId);
  const yardPreview = useMemo(
    () => [...VEHICLES].sort((a, b) => (counts[b.id] ? 1 : 0) - (counts[a.id] ? 1 : 0)).slice(0, 6),
    [counts],
  );
  const highlights = challenges.filter((x) => ['big-ten', 'rainbow', 'cranes', 'road-crew', 'name-game', 'famous'].includes(x.def.id) && !x.done).slice(0, 3);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: tabSpace + 24, gap: 22 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <SiteSign eyebrow={`${teamName} · Level ${level.level}`} title="Hard Hat Hunt">
          <T variant="body" color="#FFFFFF" style={{ opacity: 0.85 }}>
            Spot construction machines on the go. Snap them, name them, collect them all.
          </T>
        </SiteSign>
      </View>

      {/* Player card */}
      <View style={{ paddingHorizontal: 20 }}>
        <Surface depth="raised" radius={radii.xl} style={{ padding: 16, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {activeKid ? (
              <Avatar id={activeKid.avatar} size={52} />
            ) : (
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: hazard.yellow, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="hardHat" size={26} color={hazard.black} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <T variant="label" tone="muted">
                Level {level.level}
              </T>
              <T variant="h2">{level.title}</T>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <T variant="number" style={{ fontSize: 26 }}>
                {xp}
              </T>
              <T variant="micro" tone="muted">
                XP
              </T>
            </View>
          </View>
          <ProgressBar value={level.progress} height={14} />
          <T variant="micro" tone="muted">
            {level.next ? `${level.next - xp} XP to ${level.nextTitle}` : 'Top level reached!'}
          </T>
          {kids.length ? (
            <View style={{ gap: 8 }}>
              <T variant="label" tone="muted">
                Who’s spotting?
              </T>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <Chip label="Whole family" size="sm" icon="users" selected={!activeKidId} onPress={() => setActiveKid(null)} />
                {kids.map((k) => (
                  <Chip key={k.id} label={k.name} size="sm" selected={activeKidId === k.id} onPress={() => setActiveKid(k.id)} />
                ))}
              </ScrollView>
            </View>
          ) : null}
        </Surface>
      </View>

      {/* Start */}
      <View style={{ paddingHorizontal: 20, flexDirection: 'row', gap: 12 }}>
        <Press
          onPress={() => {
            haptics.heavy();
            startHunt(origin);
          }}
          accessibilityRole="button"
          accessibilityLabel="Start a hunt"
          scaleTo={0.97}
          style={{ flex: 1, height: 76, borderRadius: radii.xl, backgroundColor: hazard.yellow, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: '0px 10px 22px rgba(226,161,0,0.35)' }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: hazard.black, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="play" size={20} color={hazard.yellow} fill={hazard.yellow} />
          </View>
          <View>
            <T variant="stencil" color={hazard.black}>
              START A HUNT
            </T>
            <T variant="micro" color={hazard.black} style={{ opacity: 0.75 }}>
              Tracks your trip and spots
            </T>
          </View>
        </Press>
        <Press
          onPress={() => nav.navigate('Spot')}
          accessibilityRole="button"
          accessibilityLabel="Quick spot"
          scaleTo={0.94}
          style={{ width: 76, height: 76, borderRadius: radii.xl, backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center', gap: 2 }}
        >
          <Icon name="camera" size={24} color={c.onInk} />
          <T variant="micro" color={c.onInk}>
            Quick spot
          </T>
        </Press>
      </View>

      {/* Daily mission */}
      <View style={{ paddingHorizontal: 20 }}>
        <View style={[neu(c, 'raised'), { borderRadius: radii.xl, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
          <View style={{ width: 96, height: 72, borderRadius: radii.md, backgroundColor: c.scheme === 'dark' ? '#2A2F37' : '#F6F1DC', alignItems: 'center', justifyContent: 'center' }}>
            <VehicleArt type={mission} width={84} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <T variant="label" tone="muted">
              Today’s mission
            </T>
            <T variant="h3">Spot a {VEHICLE_BY_ID[mission].name.toLowerCase()}</T>
            <T variant="micro" tone="muted" numberOfLines={2}>
              Tip: {VEHICLE_BY_ID[mission].lookFor}
            </T>
          </View>
          {daily.done ? <Pill label="Done!" tone="success" icon="check" /> : <Pill label="+30 XP" tone="accent" />}
        </View>
      </View>

      {/* Bingo + challenges */}
      <View>
        <SectionHeader title="Challenges" eyebrow="Fill the card, win the week" action="All" onAction={() => nav.navigate('Challenges')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingVertical: 6 }}>
          <Press onPress={() => nav.navigate('Challenges')} accessibilityRole="button" style={[neu(c, 'raised'), { width: 200, borderRadius: radii.lg, padding: 14, gap: 10 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T variant="stencilSm">DIGGER BINGO</T>
              <Icon name="grid" size={16} color={c.muted} />
            </View>
            <BingoGrid spots={spots} size="sm" />
            <T variant="micro" tone="muted">
              {challenges.find((x) => x.def.id === 'bingo')?.detail}
            </T>
          </Press>
          {highlights.map((ch) => (
            <Press key={ch.def.id} onPress={() => nav.navigate('Challenges')} accessibilityRole="button" style={[neu(c, 'raised'), { width: 200, borderRadius: radii.lg, padding: 14, gap: 10, justifyContent: 'space-between' }]}>
              <View style={{ gap: 8 }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={ch.def.icon} size={18} color={hazard.yellow} />
                </View>
                <T variant="h3" numberOfLines={1}>
                  {ch.def.title}
                </T>
                <T variant="micro" tone="muted" numberOfLines={3}>
                  {ch.def.description}
                </T>
              </View>
              <View style={{ gap: 6 }}>
                <ProgressBar value={ch.progress / ch.target} height={10} />
                <T variant="micro" tone="muted" style={{ fontVariant: ['tabular-nums'] }}>
                  {ch.progress}/{ch.target} · +{ch.def.xp} XP
                </T>
              </View>
            </Press>
          ))}
        </ScrollView>
      </View>

      {kids.length > 1 ? (
        <View style={{ paddingHorizontal: 20 }}>
          <Surface depth="raised" radius={radii.xl} style={{ padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="flag" size={18} color={c.accentDeep} />
              <T variant="h3" style={{ flex: 1 }}>
                Family race: first to 10
              </T>
            </View>
            <RaceLanes kids={kids} spots={spots} />
          </Surface>
        </View>
      ) : null}

      {/* Yard preview */}
      <View>
        <SectionHeader title="Your Yard" eyebrow={`${typesFound} of ${VEHICLES.length} machines`} action="Open" onAction={() => nav.navigate('Yard')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingVertical: 6 }}>
          {yardPreview.map((v) => (
            <MachineCard key={v.id} v={v} count={counts[v.id] ?? 0} width={138} onPress={() => nav.navigate('Vehicle', { id: v.id })} />
          ))}
        </ScrollView>
      </View>

      {/* Famous machines */}
      <View>
        <SectionHeader title="Famous machines" eyebrow="Named by local hunters" action="Vote" onAction={() => nav.navigate('Fame')} />
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {famous.map(({ s, d }) => (
            <SpotCard key={s.id} spot={s} distanceM={d} onPress={() => nav.navigate('SpotDetail', { id: s.id })} />
          ))}
        </View>
      </View>

      {/* Leaderboard teaser */}
      <View style={{ paddingHorizontal: 20 }}>
        <Press onPress={() => nav.navigate('Leaderboard')} accessibilityRole="button" style={{ borderRadius: radii.xl, backgroundColor: c.ink, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: hazard.yellow, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="trophy" size={22} color={hazard.black} />
          </View>
          <View style={{ flex: 1 }}>
            <T variant="label" color={hazard.yellow}>
              This week near you
            </T>
            <T variant="h3" color={c.onInk}>
              {rank ? `You’re #${rank} of ${community.leaderboard.length}` : 'Join the leaderboard'}
            </T>
          </View>
          <Icon name="chevronRight" size={20} color={c.onInk} />
        </Press>
      </View>

      <T variant="micro" tone="faint" center style={{ paddingHorizontal: 30 }}>
        Grown-ups: spot from the passenger seat or the footpath, never near a work zone.
      </T>
    </ScrollView>
  );
}

export function HuntScreen() {
  const active = useHunt((s) => Boolean(s.activeHunt));
  return active ? <ActiveHunt /> : <HuntHub />;
}

