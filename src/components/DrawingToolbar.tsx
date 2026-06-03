import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, radii, spacing } from '@/lib/theme';
import { t, type Lang } from '@/lib/i18n';
import { fmtArea, geodesicArea, perimeter, fmtLen, type LatLng } from '@/lib/geometry';

const TOP_INSET = Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 44;

type Props = {
  lang: Lang;
  drawnCoords: LatLng[];
  onCancel: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canRedo: boolean;
  onFinish: () => void;
  onHelp?: () => void;
};

/**
 * Two-piece toolbar shown while drawing:
 *  - Top banner with hint + corner count + live area
 *  - Bottom bar with Cancel / Undo / Finish buttons
 */
export default function DrawingToolbar({
  lang,
  drawnCoords,
  onCancel,
  onUndo,
  onRedo,
  canRedo,
  onFinish,
  onHelp,
}: Props) {
  const inY = useSharedValue(1); // 1 = off-screen

  useEffect(() => {
    inY.value = withSpring(0, { damping: 18, stiffness: 180 });
  }, [inY]);

  const topStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: inY.value * -120 }],
  }));
  const bottomStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: inY.value * 120 }],
  }));

  const enoughPoints = drawnCoords.length >= 3;

  return (
    <>
      <Animated.View style={[s.banner, { top: TOP_INSET + 8 }, topStyle]}>
        <View style={{ flex: 1 }}>
          <Text style={s.bannerText}>{t(lang, 'draw_hint')}</Text>
          <Text style={s.bannerCount}>
            {drawnCoords.length} •{' '}
            {enoughPoints ? fmtArea(geodesicArea(drawnCoords)) : '—'}
            {drawnCoords.length >= 2
              ? ` · ${fmtLen(perimeter(drawnCoords, enoughPoints))}`
              : ''}
          </Text>
        </View>
        {onHelp && (
          <TouchableOpacity style={s.helpBtn} onPress={onHelp} hitSlop={8}>
            <Text style={s.helpText}>؟</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      <Animated.View style={[s.bar, bottomStyle]}>
        <TouchableOpacity style={s.btnGhost} onPress={onCancel}>
          <Text style={s.btnGhostText}>{t(lang, 'cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btnGhost, s.btnCompact, drawnCoords.length === 0 && s.btnDisabled]}
          onPress={onUndo}
          disabled={drawnCoords.length === 0}
        >
          <Text style={s.btnGhostText}>{t(lang, 'undo')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btnGhost, s.btnCompact, !canRedo && s.btnDisabled]}
          onPress={onRedo}
          disabled={!canRedo}
        >
          <Text style={s.btnGhostText}>{t(lang, 'redo')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btnPrimary, !enoughPoints && s.btnDisabled]}
          onPress={onFinish}
          disabled={!enoughPoints}
        >
          <Text style={s.btnPrimaryText}>{t(lang, 'finish')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const s = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 10,
  },
  helpBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  bannerText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  bannerCount: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 12,
    marginTop: 4,
  },

  bar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.xl,
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 10,
  },
  btnGhost: {
    flex: 1,
    backgroundColor: colors.panel2,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnCompact: { flex: 0.8 },
  btnGhostText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  btnPrimary: {
    flex: 1.4,
    backgroundColor: colors.brand,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.4 },
});
