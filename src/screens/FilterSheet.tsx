import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { colors, radii, spacing } from '@/lib/theme';
import { t, type Lang } from '@/lib/i18n';
import { DISTRICT_KEYS, type DistrictKey } from '@/lib/districts';

export type Filters = {
  districts: DistrictKey[];
  uses: string[];
  priceMin: number | null;
  priceMax: number | null;
  areaMin: number | null;
  areaMax: number | null;
  electricity: boolean;
  water: boolean;
  road: boolean;
  hasPhotos: boolean;
};

export const EMPTY_FILTERS: Filters = {
  districts: [],
  uses: [],
  priceMin: null,
  priceMax: null,
  areaMin: null,
  areaMax: null,
  electricity: false,
  water: false,
  road: false,
  hasPhotos: false,
};

const USES = ['residential', 'agricultural', 'commercial', 'industrial'];

export function countActiveFilters(f: Filters): number {
  let n = 0;
  if (f.districts.length > 0) n++;
  if (f.uses.length > 0) n++;
  if (f.priceMin !== null || f.priceMax !== null) n++;
  if (f.areaMin !== null || f.areaMax !== null) n++;
  if (f.electricity) n++;
  if (f.water) n++;
  if (f.road) n++;
  if (f.hasPhotos) n++;
  return n;
}

type Props = {
  visible: boolean;
  initial: Filters;
  lang: Lang;
  resultsCount?: number;
  onClose: () => void;
  onApply: (filters: Filters) => void;
};

export default function FilterSheet({
  visible,
  initial,
  lang,
  resultsCount,
  onClose,
  onApply,
}: Props) {
  const [f, setF] = useState<Filters>(initial);

  // Re-sync when sheet reopens with different state
  useEffect(() => {
    if (visible) setF(initial);
  }, [visible, initial]);

  const toggleDistrict = (d: DistrictKey) => {
    setF(prev => ({
      ...prev,
      districts: prev.districts.includes(d)
        ? prev.districts.filter(x => x !== d)
        : [...prev.districts, d],
    }));
  };

  const toggleUse = (u: string) => {
    setF(prev => ({
      ...prev,
      uses: prev.uses.includes(u)
        ? prev.uses.filter(x => x !== u)
        : [...prev.uses, u],
    }));
  };

  const reset = () => setF(EMPTY_FILTERS);

  const apply = () => {
    onApply(f);
    onClose();
  };

  const parseNum = (s: string): number | null => {
    const n = Number(s.replace(/[^0-9]/g, ''));
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={s.backdrop} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.handle} />
        <View style={s.header}>
          <Text style={s.title}>{t(lang, 'filters')}</Text>
          <Pressable onPress={reset} hitSlop={8}>
            <Text style={s.resetText}>{t(lang, 'reset')}</Text>
          </Pressable>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Districts */}
          <Section label={t(lang, 'filter_district')}>
            <View style={s.chipsWrap}>
              {DISTRICT_KEYS.map(d => {
                const on = f.districts.includes(d);
                return (
                  <Pressable
                    key={d}
                    onPress={() => toggleDistrict(d)}
                    style={[s.chip, on && s.chipOn]}
                  >
                    <Text style={[s.chipText, on && s.chipTextOn]}>
                      {t(lang, `d_${d}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          {/* Use */}
          <Section label={t(lang, 'filter_use')}>
            <View style={s.chipsWrap}>
              {USES.map(u => {
                const on = f.uses.includes(u);
                return (
                  <Pressable
                    key={u}
                    onPress={() => toggleUse(u)}
                    style={[s.chip, on && s.chipOn]}
                  >
                    <Text style={[s.chipText, on && s.chipTextOn]}>
                      {t(lang, `use_${u}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          {/* Price range */}
          <Section label={t(lang, 'price_range')}>
            <View style={s.rangeRow}>
              <TextInput
                style={s.rangeInput}
                value={f.priceMin?.toString() ?? ''}
                onChangeText={v =>
                  setF(p => ({ ...p, priceMin: parseNum(v) }))
                }
                keyboardType="numeric"
                placeholder={t(lang, 'min')}
                placeholderTextColor={colors.muted}
              />
              <Text style={s.rangeDash}>—</Text>
              <TextInput
                style={s.rangeInput}
                value={f.priceMax?.toString() ?? ''}
                onChangeText={v =>
                  setF(p => ({ ...p, priceMax: parseNum(v) }))
                }
                keyboardType="numeric"
                placeholder={t(lang, 'max')}
                placeholderTextColor={colors.muted}
              />
            </View>
          </Section>

          {/* Area range */}
          <Section label={`${t(lang, 'area_range')} (m²)`}>
            <View style={s.rangeRow}>
              <TextInput
                style={s.rangeInput}
                value={f.areaMin?.toString() ?? ''}
                onChangeText={v =>
                  setF(p => ({ ...p, areaMin: parseNum(v) }))
                }
                keyboardType="numeric"
                placeholder={t(lang, 'min')}
                placeholderTextColor={colors.muted}
              />
              <Text style={s.rangeDash}>—</Text>
              <TextInput
                style={s.rangeInput}
                value={f.areaMax?.toString() ?? ''}
                onChangeText={v =>
                  setF(p => ({ ...p, areaMax: parseNum(v) }))
                }
                keyboardType="numeric"
                placeholder={t(lang, 'max')}
                placeholderTextColor={colors.muted}
              />
            </View>
          </Section>

          {/* Utilities */}
          <Section label={t(lang, 'field_utilities')}>
            <View style={s.chipsWrap}>
              <Toggle
                label={t(lang, 'utility_electricity')}
                value={f.electricity}
                onChange={v => setF(p => ({ ...p, electricity: v }))}
              />
              <Toggle
                label={t(lang, 'utility_water')}
                value={f.water}
                onChange={v => setF(p => ({ ...p, water: v }))}
              />
              <Toggle
                label={t(lang, 'utility_road')}
                value={f.road}
                onChange={v => setF(p => ({ ...p, road: v }))}
              />
              <Toggle
                label={t(lang, 'has_photos_only')}
                value={f.hasPhotos}
                onChange={v => setF(p => ({ ...p, hasPhotos: v }))}
              />
            </View>
          </Section>
        </ScrollView>

        {/* Apply button with result count */}
        <View style={s.footer}>
          <TouchableOpacity style={s.cta} onPress={apply}>
            <Text style={s.ctaText}>
              {t(lang, 'apply')}
              {typeof resultsCount === 'number' && (
                <Text style={s.ctaCount}>
                  {'  '}({resultsCount} {t(lang, 'results_count')})
                </Text>
              )}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={[s.chip, value && s.chipOnAlt]}
    >
      <Text style={[s.chipText, value && s.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '85%',
    backgroundColor: colors.panel,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    elevation: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  resetText: { color: colors.brandSoft, fontSize: 13, fontWeight: '700' },

  scroll: { flexGrow: 0 },
  scrollContent: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 32 },

  section: { gap: spacing.sm },
  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: colors.panel2,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipOnAlt: { backgroundColor: colors.brandSoft, borderColor: colors.brandSoft },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: '#fff', fontWeight: '700' },

  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rangeInput: {
    flex: 1,
    backgroundColor: colors.panel2,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  rangeDash: { color: colors.muted, fontSize: 16 },

  footer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.panel,
  },
  cta: {
    backgroundColor: colors.brand,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  ctaCount: { fontWeight: '600', fontSize: 13, opacity: 0.85 },
});
