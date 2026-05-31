import React, { useEffect } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { colors, radii, spacing } from '@/lib/theme';

type Props = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocateMe?: () => void;
  topOffset: number;
};

/**
 * Vertical FAB stack on the right side of the map.
 * Currently: zoom in, divider, zoom out. Reserved slot for "locate me".
 */
export default function MapFabStack({
  onZoomIn,
  onZoomOut,
  onLocateMe,
  topOffset,
}: Props) {
  const slide = useSharedValue(80);

  useEffect(() => {
    slide.value = withDelay(
      150,
      withSpring(0, { damping: 16, stiffness: 160 }),
    );
  }, [slide]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slide.value }],
  }));

  return (
    <Animated.View
      style={[s.wrap, { top: topOffset }, wrapStyle]}
      pointerEvents="box-none"
    >
      <View style={s.stack}>
        <Pressable style={s.btn} onPress={onZoomIn} hitSlop={6}>
          <Text style={s.btnText}>+</Text>
        </Pressable>
        <View style={s.divider} />
        <Pressable style={s.btn} onPress={onZoomOut} hitSlop={6}>
          <Text style={s.btnText}>−</Text>
        </Pressable>
      </View>

      {onLocateMe && (
        <Pressable style={s.locateBtn} onPress={onLocateMe} hitSlop={6}>
          <Text style={s.locateText}>⌖</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: spacing.md,
    gap: spacing.sm,
    zIndex: 10,
  },
  stack: {
    backgroundColor: colors.panel,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  btn: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: colors.text, fontSize: 22, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border },

  locateBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  locateText: { color: colors.brandSoft, fontSize: 22, fontWeight: '700' },
});
