import React, { useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { colors, radii, spacing } from '@/lib/theme';
import { t, type Lang } from '@/lib/i18n';

const TOP_INSET = Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 44;

type Props = {
  lang: Lang;
  searchText: string;
  onSearchTextChange: (v: string) => void;
  onSubmitSearch: () => void;
  onClearAll: () => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
  resultsCount?: number;
  showResults: boolean;
};

/**
 * Floating top bar: rounded pill search input + filter button + optional
 * results badge. Animates in on mount.
 */
export default function MapTopBar({
  lang,
  searchText,
  onSearchTextChange,
  onSubmitSearch,
  onClearAll,
  onOpenFilters,
  activeFilterCount,
  resultsCount,
  showResults,
}: Props) {
  const slide = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    slide.value = withTiming(0, { duration: 350 });
    opacity.value = withTiming(1, { duration: 350 });
  }, [slide, opacity]);

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slide.value }],
    opacity: opacity.value,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: slide.value * 0.5 }],
  }));

  const showClear = searchText.length > 0 || activeFilterCount > 0;

  return (
    <>
      <Animated.View
        style={[s.bar, { top: TOP_INSET + 8 }, barStyle]}
        pointerEvents="box-none"
      >
        <View style={s.inputWrap}>
          <Text style={s.icon}>🔍</Text>
          <TextInput
            style={s.input}
            value={searchText}
            onChangeText={onSearchTextChange}
            onSubmitEditing={onSubmitSearch}
            returnKeyType="search"
            placeholder={t(lang, 'search_placeholder')}
            placeholderTextColor={colors.muted}
          />
          {showClear && (
            <Pressable
              onPress={onClearAll}
              hitSlop={8}
              style={s.clearBtn}
            >
              <Text style={s.clearText}>✕</Text>
            </Pressable>
          )}
        </View>

        <Pressable style={s.filterBtn} onPress={onOpenFilters} hitSlop={6}>
          <Text style={s.filterIcon}>⚙</Text>
          {activeFilterCount > 0 && (
            <View style={s.filterDot}>
              <Text style={s.filterDotText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </Animated.View>

      {showResults && (
        <Animated.View
          style={[s.resultsBadge, { top: TOP_INSET + 62 }, badgeStyle]}
        >
          <Text style={s.resultsBadgeText}>
            {resultsCount ?? 0} {t(lang, 'results_count')}
          </Text>
        </Animated.View>
      )}
    </>
  );
}

const s = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    zIndex: 10,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 46,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  icon: { fontSize: 14, marginRight: 6 },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.panel2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: { color: colors.muted, fontSize: 11, fontWeight: '700' },

  filterBtn: {
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
  filterIcon: { color: colors.text, fontSize: 18, fontWeight: '700' },
  filterDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.brand,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  filterDotText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  resultsBadge: {
    position: 'absolute',
    alignSelf: 'center',
    left: 0,
    right: 0,
    marginHorizontal: 'auto',
    backgroundColor: colors.panel,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.brandSoft,
    paddingHorizontal: 14,
    paddingVertical: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    alignItems: 'center',
    zIndex: 10,
    maxWidth: 160,
  },
  resultsBadgeText: {
    color: colors.brandSoft,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
