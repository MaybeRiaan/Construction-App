import { useEffect, useState, type ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { SafeAreaFrameContext, SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { LogoMark } from '../art/Logo';
import { useTheme } from '../theme/ThemeProvider';
import { hazard } from '../theme/tokens';
import { Icon, type IconName } from '../ui/Icon';
import { T } from '../ui/Text';

/**
 * Web: on a wide screen, show the app inside a phone so it reads as the
 * mobile app it is; on a phone-sized screen, fill the viewport. Safe-area
 * insets are simulated inside the frame and zero when filling (the host page
 * already pads for the notch).
 */

const PHONE_W = 390;
const PHONE_H = 844;
const FILL_INSETS = { top: 6, left: 0, right: 0, bottom: 0 };

function StatusBarMock() {
  const { c } = useTheme();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 20000);
    return () => clearInterval(t);
  }, []);
  const time = now.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit', hour12: false });
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 50, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 30, zIndex: 999 }}>
      <T variant="bodyStrong" style={{ flex: 1, fontSize: 15 }}>
        {time}
      </T>
      <View style={{ width: 122, height: 35, borderRadius: 18, backgroundColor: '#000000' }} />
      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 6, alignItems: 'center' }}>
        <Icon name="signal" size={15} color={c.ink} strokeWidth={2.6} />
        <Icon name="wifi" size={15} color={c.ink} strokeWidth={2.6} />
        <Icon name="battery" size={20} color={c.ink} strokeWidth={2} />
      </View>
    </View>
  );
}

const TIPS: { icon: IconName; text: string }[] = [
  { icon: 'pin', text: 'Tap a pin or a card to open a place' },
  { icon: 'radar', text: 'Drag your radar range from 1 to 50 km' },
  { icon: 'sparkles', text: 'Try “Ask” for a plain-English search' },
  { icon: 'hardHat', text: 'Start a Hard Hat Hunt and snap a digger' },
  { icon: 'thumbsUp', text: 'Vote on the best machine names' },
];

function SidePanel() {
  const { c } = useTheme();
  return (
    <View style={{ width: 300, gap: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <LogoMark size={48} />
        <View>
          <T variant="h1">Playdar</T>
          <T variant="label" tone="muted">
            Interactive prototype
          </T>
        </View>
      </View>
      <T variant="body" tone="soft">
        Things to do with kids nearby, rated by parents, plus Hard Hat Hunt: a construction-spotting game for the car ride.
      </T>
      <View style={{ gap: 12 }}>
        {TIPS.map((t) => (
          <View key={t.text} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.icon === 'hardHat' ? hazard.yellow : c.ink, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={t.icon} size={15} color={t.icon === 'hardHat' ? hazard.black : c.onInk} />
            </View>
            <T variant="smallStrong" tone="soft" style={{ flex: 1 }}>
              {t.text}
            </T>
          </View>
        ))}
      </View>
      <T variant="micro" tone="faint">
        Riverbend is a demo town. On a phone, the app finds real places near you.
      </T>
    </View>
  );
}

/**
 * Browsers scroll even overflow-hidden containers to reveal a focused input
 * or a scrollIntoView target, which would slide the whole app inside the
 * frame. Snap any non-scrolling container back to 0.
 */
function useLockClippedScroll() {
  useEffect(() => {
    const scroller = new WeakMap<Element, boolean>();
    const isScroller = (el: Element) => {
      let v = scroller.get(el);
      if (v === undefined) {
        const cs = getComputedStyle(el);
        v = /(auto|scroll)/.test(`${cs.overflowY} ${cs.overflowX}`);
        scroller.set(el, v);
      }
      return v;
    };
    const onScroll = (e: Event) => {
      const el = e.target;
      if (el === document) {
        if (window.scrollX || window.scrollY) window.scrollTo(0, 0);
        return;
      }
      if (!(el instanceof Element)) return;
      if ((el.scrollTop || el.scrollLeft) && !isScroller(el)) {
        el.scrollTop = 0;
        el.scrollLeft = 0;
      }
    };
    document.addEventListener('scroll', onScroll, true);
    return () => document.removeEventListener('scroll', onScroll, true);
  }, []);
}

export function AppShell({ children }: { children: ReactNode }) {
  const { c, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const framed = width >= 760 && height >= 620;
  useLockClippedScroll();

  if (!framed) {
    return (
      <SafeAreaInsetsContext.Provider value={FILL_INSETS}>
        <SafeAreaFrameContext.Provider value={{ x: 0, y: 0, width, height }}>
          <View style={{ flex: 1, backgroundColor: c.bg }}>{children}</View>
        </SafeAreaFrameContext.Provider>
      </SafeAreaInsetsContext.Provider>
    );
  }

  const phoneH = Math.min(PHONE_H, height - 44);
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 64, backgroundColor: isDark ? '#141619' : '#DCE1E8' }}>
      {width >= 1100 ? <SidePanel /> : null}
      <View
        style={{
          width: PHONE_W + 22,
          height: phoneH + 22,
          borderRadius: 60,
          padding: 11,
          backgroundColor: '#0C0D0F',
          boxShadow: isDark ? '0px 30px 80px rgba(0,0,0,0.6)' : '0px 40px 80px rgba(36,48,68,0.35), 0px 0px 0px 2px #2A2D33',
        }}
      >
        <View style={{ width: PHONE_W, height: phoneH, borderRadius: 50, overflow: 'hidden', backgroundColor: c.bg }}>
          <SafeAreaInsetsContext.Provider value={{ top: 50, bottom: 22, left: 0, right: 0 }}>
            <SafeAreaFrameContext.Provider value={{ x: 0, y: 0, width: PHONE_W, height: phoneH }}>
              <View style={{ flex: 1 }}>{children}</View>
            </SafeAreaFrameContext.Provider>
          </SafeAreaInsetsContext.Provider>
          <StatusBarMock />
          <View pointerEvents="none" style={{ position: 'absolute', bottom: 8, left: 0, right: 0, alignItems: 'center', zIndex: 999 }}>
            <View style={{ width: 134, height: 5, borderRadius: 3, backgroundColor: c.ink, opacity: 0.85 }} />
          </View>
        </View>
      </View>
    </View>
  );
}
