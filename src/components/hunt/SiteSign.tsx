import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { hazard, radii } from '../../theme/tokens';
import { Hazard } from '../../ui/Hazard';
import { T } from '../../ui/Text';

/** A construction-site sign: hazard band, ink panel, stencil headline. */
export function SiteSign({ eyebrow, title, children, style }: { eyebrow?: string; title: string; children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ borderRadius: radii.lg, overflow: 'hidden', backgroundColor: hazard.black }, style]}>
      <Hazard height={12} />
      <View style={{ padding: 16, gap: 6 }}>
        {eyebrow ? (
          <T variant="label" color={hazard.yellow} style={{ opacity: 0.85 }}>
            {eyebrow}
          </T>
        ) : null}
        <T variant="stencilXL" color={hazard.yellow} style={{ textTransform: 'uppercase' }}>
          {title}
        </T>
        {children}
      </View>
    </View>
  );
}
