import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, radii, spacing } from '@/lib/theme';

type Icon = 'heart' | 'pin' | 'wifi-off' | 'search';

function EmptyIcon({ icon, size = 64 }: { icon: Icon; size?: number }) {
  const c = colors.muted;
  switch (icon) {
    case 'heart':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            stroke={c}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'pin':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
            stroke={c}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx={12} cy={10} r={3} stroke={c} strokeWidth={1.5} />
        </Svg>
      );
    case 'wifi-off':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"
            stroke={c}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'search':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={11} cy={11} r={8} stroke={c} strokeWidth={1.5} />
          <Path d="m21 21-4.35-4.35" stroke={c} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M8 11h6M11 8v6" stroke={c} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
      );
  }
}

type Props = {
  icon: Icon;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: Props) {
  return (
    <View style={s.root}>
      <View style={s.iconWrap}>
        <EmptyIcon icon={icon} size={56} />
      </View>
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={s.btn} onPress={onAction}>
          <Text style={s.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: radii.xl,
    backgroundColor: colors.panel2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  sub: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  btn: {
    marginTop: spacing.md,
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
