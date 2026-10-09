import { forwardRef } from 'react';
import { Platform, TextInput, View, type TextInputProps } from 'react-native';
import { neu } from '../theme/neu';
import { useTheme } from '../theme/ThemeProvider';
import { radii } from '../theme/tokens';
import { font } from '../theme/typography';
import { Icon, type IconName } from './Icon';
import { T } from './Text';

export interface FieldProps extends TextInputProps {
  label?: string;
  icon?: IconName;
  hint?: string;
}

export const Field = forwardRef<TextInput, FieldProps>(function Field({ label, icon, hint, style, multiline, ...rest }, ref) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      {label ? (
        <T variant="label" tone="muted">
          {label}
        </T>
      ) : null}
      <View
        style={[
          neu(c, 'insetSm'),
          { borderRadius: radii.md, flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center', paddingHorizontal: 14, gap: 10, minHeight: 50 },
        ]}
      >
        {icon ? <Icon name={icon} size={18} color={c.muted} /> : null}
        <TextInput
          ref={ref}
          accessibilityLabel={rest.accessibilityLabel ?? label ?? rest.placeholder}
          placeholderTextColor={c.faint}
          multiline={multiline}
          style={[
            font('body', 500),
            {
              flex: 1,
              fontSize: 16,
              color: c.ink,
              paddingVertical: multiline ? 14 : 12,
              minHeight: multiline ? 96 : undefined,
              textAlignVertical: multiline ? 'top' : 'center',
            },
            Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null,
            style,
          ]}
          {...rest}
        />
      </View>
      {hint ? (
        <T variant="micro" tone="muted">
          {hint}
        </T>
      ) : null}
    </View>
  );
});
