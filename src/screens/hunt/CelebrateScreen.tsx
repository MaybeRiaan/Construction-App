import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VehicleArt } from '../../art/VehicleArt';
import { BADGE_BY_ID } from '../../data/challenges';
import { RARITY, VEHICLE_BY_ID } from '../../data/vehicles';
import { levelFor } from '../../domain/game';
import { useUi } from '../../state/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { hazard, radii } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { Hazard } from '../../ui/Hazard';
import { Icon } from '../../ui/Icon';
import { Press } from '../../ui/Press';
import { T } from '../../ui/Text';

const COLORS = [hazard.yellow, '#FF8A1F', '#2C86F0', '#2E9E62', '#E8457A', '#FFFFFF'];
const native = Platform.OS !== 'web';

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        x: Math.random(),
        delay: Math.random() * 500,
        dur: 1800 + Math.random() * 1400,
        rot: (Math.random() - 0.5) * 900,
        w: 7 + Math.random() * 7,
        h: 10 + Math.random() * 10,
        color: COLORS[i % COLORS.length],
        drift: (Math.random() - 0.5) * 80,
      })),
    [],
  );
  const t = useRef(pieces.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.parallel(
      t.map((v, i) => Animated.timing(v, { toValue: 1, duration: pieces[i].dur, delay: pieces[i].delay, easing: Easing.in(Easing.quad), useNativeDriver: native })),
    ).start();
  }, [t, pieces]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: `${p.x * 100}%`,
            top: -20,
            width: p.w,
            height: p.h,
            borderRadius: 2,
            backgroundColor: p.color,
            opacity: t[i].interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateY: t[i].interpolate({ inputRange: [0, 1], outputRange: [0, 900] }) },
              { translateX: t[i].interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
              { rotate: t[i].interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rot}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const k = Math.min(1, (Date.now() - start) / 900);
      setN(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k >= 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [to]);
  return <>{n}</>;
}

export function CelebrateScreen() {
  const { c } = useTheme();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const cel = useUi((s) => s.celebration);
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: native, tension: 60, friction: 6 }).start();
  }, [pop]);

  if (!cel) {
    return (
      <View style={{ flex: 1, backgroundColor: hazard.black, alignItems: 'center', justifyContent: 'center' }}>
        <Button title="Back" variant="accent" onPress={() => nav.goBack()} />
      </View>
    );
  }

  const spot = cel.spot;
  const v = spot ? VEHICLE_BY_ID[spot.typeId] : null;
  const before = levelFor(cel.xpBefore);
  const after = levelFor(cel.xpAfter);
  const levelUp = cel.kind !== 'hunt' && after.level > before.level;
  const bonus = cel.completed.reduce((a, x) => a + x.def.xp, 0);
  const headline =
    cel.kind === 'hunt'
      ? 'HUNT COMPLETE!'
      : cel.kind === 'found'
        ? `YOU FOUND ${spot?.nickname?.toUpperCase() ?? 'IT'}!`
        : cel.firstOfType
          ? 'NEW MACHINE!'
          : 'SPOTTED!';

  return (
    <View style={{ flex: 1, backgroundColor: hazard.black }}>
      <Hazard height={14} style={{ marginTop: insets.top }} />
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 140, alignItems: 'center', gap: 18 }}>
        <Animated.View style={{ alignItems: 'center', gap: 10, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }], opacity: pop }}>
          <T variant="stencilXL" color={hazard.yellow} center style={{ fontSize: 44, lineHeight: 46, marginTop: 8 }}>
            {headline}
          </T>
          {cel.kind === 'hunt' && cel.hunt ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 6, maxWidth: 340 }}>
              {cel.hunt.spots.map((s) => (
                <View key={s.id} style={{ width: 96, height: 72, borderRadius: radii.md, backgroundColor: '#23262B', alignItems: 'center', justifyContent: 'center' }}>
                  <VehicleArt type={s.typeId} width={84} colour={s.colour} />
                </View>
              ))}
            </View>
          ) : spot ? (
            <View style={{ alignItems: 'center', gap: 8 }}>
              {spot.photo ? <Image source={{ uri: spot.photo }} style={{ width: 150, height: 112, borderRadius: radii.lg, borderWidth: 4, borderColor: hazard.yellow }} /> : null}
              <VehicleArt type={spot.typeId} width={240} colour={spot.colour} />
            </View>
          ) : null}
          {v ? (
            <T variant="h2" color="#FFFFFF" center>
              {spot?.nickname && cel.kind !== 'found' ? `${spot.nickname} the ${v.name.toLowerCase()}` : v.name}
            </T>
          ) : cel.hunt ? (
            <T variant="h3" color="#FFFFFF" center style={{ opacity: 0.85 }}>
              {cel.hunt.spots.length} spotted · {cel.hunt.newTypes} new for your Yard
            </T>
          ) : null}
          {v ? (
            <T variant="small" color="#FFFFFF" center style={{ opacity: 0.75, maxWidth: 320 }}>
              {RARITY[v.rarity].label} · {v.job}
            </T>
          ) : null}
        </Animated.View>

        <View style={{ backgroundColor: hazard.yellow, borderRadius: radii.xl, paddingVertical: 14, paddingHorizontal: 26, alignItems: 'center' }}>
          <T variant="stencilXL" color={hazard.black} style={{ fontSize: 48, lineHeight: 50 }}>
            +<CountUp to={cel.xp + (cel.kind === 'hunt' ? 0 : bonus)} /> XP
          </T>
          {levelUp ? (
            <T variant="smallStrong" color={hazard.black}>
              Level up! You’re now a {after.title}
            </T>
          ) : null}
        </View>

        {cel.hadPeople ? (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', maxWidth: 340 }}>
            <Icon name="shield" size={16} color="#FFFFFF" />
            <T variant="small" color="#FFFFFF" style={{ opacity: 0.8, flex: 1 }}>
              This photo had a person in it, so it stays private to your family.
            </T>
          </View>
        ) : null}

        {cel.completed.length ? (
          <View style={{ alignSelf: 'stretch', gap: 10 }}>
            <T variant="label" color={hazard.yellow} center>
              Challenge complete
            </T>
            {cel.completed.map((ch) => {
              const badge = ch.def.badge ? BADGE_BY_ID[ch.def.badge] : null;
              return (
                <View key={ch.def.id} style={{ backgroundColor: '#23262B', borderRadius: radii.lg, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: badge?.color ?? hazard.yellow, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFFFFF' }}>
                    <Icon name={badge?.icon ?? ch.def.icon} size={20} color={badge?.color === '#FFC21A' ? hazard.black : '#FFFFFF'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <T variant="bodyStrong" color="#FFFFFF">
                      {ch.def.title}
                    </T>
                    <T variant="small" color="#FFFFFF" style={{ opacity: 0.7 }}>
                      {badge ? `Badge: ${badge.name}` : ch.def.description}
                    </T>
                  </View>
                  <T variant="smallStrong" color={hazard.yellow}>
                    +{ch.def.xp}
                  </T>
                </View>
              );
            })}
          </View>
        ) : null}

        {v && cel.kind !== 'hunt' ? (
          <View style={{ alignSelf: 'stretch', backgroundColor: '#23262B', borderRadius: radii.lg, padding: 14, flexDirection: 'row', gap: 10 }}>
            <Icon name="lightbulb" size={18} color={hazard.yellow} />
            <T variant="small" color="#FFFFFF" style={{ flex: 1, opacity: 0.9 }}>
              {v.facts[Math.floor((spot?.createdAt.length ?? 0) % v.facts.length)]}
            </T>
          </View>
        ) : null}
      </ScrollView>
      <Confetti />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: Math.max(insets.bottom, 16), gap: 6, backgroundColor: hazard.black }}>
        <Button title={cel.kind === 'hunt' ? 'Back to base' : 'Keep hunting'} variant="accent" size="lg" full onPress={() => nav.goBack()} />
        {spot && cel.kind !== 'hunt' ? (
          <Press onPress={() => nav.navigate('Vehicle', { id: spot.typeId })} accessibilityRole="button" style={{ alignSelf: 'center', padding: 8 }}>
            <T variant="bodyStrong" color="#FFFFFF">
              See it in my Yard
            </T>
          </Press>
        ) : null}
      </View>
    </View>
  );
}
