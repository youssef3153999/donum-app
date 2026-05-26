import React, { useEffect, useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, radii, spacing } from '@/lib/theme';
import { t, type Lang } from '@/lib/i18n';
import { fetchMarketStats, type MarketStats } from '@/data/plots';
import {
  annualGrowthRate,
  projectValue,
  projectionSeries,
  totalROI,
} from '@/lib/marketEstimates';

type Props = {
  visible: boolean;
  lang: Lang;
  district: string;
  use: string;
  initialPrice: number;
  initialArea: number;
  currency: string;
  onClose: () => void;
};

const YEAR_OPTIONS = [3, 5, 10];

export default function InvestmentCalculator({
  visible,
  lang,
  district,
  use,
  initialPrice,
  initialArea,
  currency,
  onClose,
}: Props) {
  const [price, setPrice] = useState(String(initialPrice));
  const [years, setYears] = useState<number>(5);
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Reset values on open
  useEffect(() => {
    if (visible) {
      setPrice(String(initialPrice));
      setYears(5);
      setLoading(true);
      fetchMarketStats(district, use).then(s => {
        setStats(s);
        setLoading(false);
      });
    }
  }, [visible, district, use, initialPrice]);

  const priceNum = Number(price) || 0;
  const growthRate = annualGrowthRate(district, use);
  const series = useMemo(
    () => projectionSeries(priceNum, years, growthRate),
    [priceNum, years, growthRate],
  );
  const projected = projectValue(priceNum, years, growthRate);
  const roi = totalROI(priceNum, projected);
  const annualRoi = years > 0 ? Math.pow(1 + roi, 1 / years) - 1 : 0;

  // Compare to market avg
  const pricePerM2 = initialArea > 0 ? priceNum / initialArea : 0;
  let marketDelta: { pct: number; label: 'above' | 'below' | 'at' } | null =
    null;
  if (stats && pricePerM2 > 0) {
    const diff = (pricePerM2 - stats.avgPricePerM2) / stats.avgPricePerM2;
    if (Math.abs(diff) < 0.03) marketDelta = { pct: 0, label: 'at' };
    else if (diff < 0)
      marketDelta = { pct: Math.abs(diff) * 100, label: 'below' };
    else marketDelta = { pct: diff * 100, label: 'above' };
  }

  const formatNum = (n: number): string => {
    if (!Number.isFinite(n)) return '0';
    return Math.round(n).toLocaleString();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={s.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        style={s.sheet}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.handle} />

        <View style={s.header}>
          <Text style={s.title}>{t(lang, 'investment_calc')}</Text>
          <Pressable onPress={onClose} hitSlop={10} style={s.closeBtn}>
            <Text style={s.closeText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Purchase price input */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>{t(lang, 'purchase_price')}</Text>
            <View style={s.priceInputRow}>
              <TextInput
                style={s.priceInput}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholderTextColor={colors.muted}
              />
              <Text style={s.currencyLabel}>{currency}</Text>
            </View>
          </View>

          {/* Years selector */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>{t(lang, 'years_label')}</Text>
            <View style={s.yearsRow}>
              {YEAR_OPTIONS.map(y => (
                <Pressable
                  key={y}
                  style={[s.yearChip, years === y && s.yearChipOn]}
                  onPress={() => setYears(y)}
                >
                  <Text
                    style={[s.yearChipText, years === y && s.yearChipTextOn]}
                  >
                    {y}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Market comparison */}
          {loading ? (
            <View style={s.loadingBox}>
              <ActivityIndicator color={colors.brandSoft} />
            </View>
          ) : marketDelta ? (
            <View
              style={[
                s.marketBox,
                marketDelta.label === 'below' && s.marketBoxGood,
                marketDelta.label === 'above' && s.marketBoxBad,
                marketDelta.label === 'at' && s.marketBoxNeutral,
              ]}
            >
              <Text style={s.marketLabel}>{t(lang, 'market_avg_price')}</Text>
              <Text style={s.marketValue}>
                {formatNum(stats!.avgPricePerM2)} {stats!.currency} /m²
              </Text>
              <Text style={s.marketSamples}>
                {stats!.count} {t(lang, 'comparable_plots')}
              </Text>
              {marketDelta.label !== 'at' && (
                <Text
                  style={[
                    s.marketDelta,
                    marketDelta.label === 'below' && { color: colors.ok },
                    marketDelta.label === 'above' && { color: colors.danger },
                  ]}
                >
                  {marketDelta.label === 'below'
                    ? `▼ ${t(lang, 'below_market')} ${marketDelta.pct.toFixed(1)}%`
                    : `▲ ${t(lang, 'above_market')} ${marketDelta.pct.toFixed(1)}%`}
                </Text>
              )}
              {marketDelta.label === 'at' && (
                <Text style={[s.marketDelta, { color: colors.muted }]}>
                  {t(lang, 'at_market')}
                </Text>
              )}
            </View>
          ) : (
            <View style={s.marketBoxEmpty}>
              <Text style={s.marketEmptyText}>
                {t(lang, 'not_enough_data')}
              </Text>
            </View>
          )}

          {/* Projected value */}
          <View style={s.projectionCard}>
            <Text style={s.projectionLabel}>{t(lang, 'projected_value')}</Text>
            <Text style={s.projectionValue}>
              {formatNum(projected)} {currency}
            </Text>
            <Text style={s.projectionYears}>
              {t(lang, 'after_years').replace('{n}', String(years))}
            </Text>

            <View style={s.divider} />

            <View style={s.statsRow}>
              <View style={s.statBox}>
                <Text style={s.statLabel}>{t(lang, 'total_roi')}</Text>
                <Text
                  style={[
                    s.statValue,
                    { color: roi > 0 ? colors.ok : colors.danger },
                  ]}
                >
                  {roi > 0 ? '+' : ''}
                  {(roi * 100).toFixed(1)}%
                </Text>
              </View>
              <View style={s.statBox}>
                <Text style={s.statLabel}>{t(lang, 'annual_roi')}</Text>
                <Text style={s.statValue}>
                  {(annualRoi * 100).toFixed(1)}%
                </Text>
              </View>
              <View style={s.statBox}>
                <Text style={s.statLabel}>{t(lang, 'annual_growth')}</Text>
                <Text style={s.statValue}>
                  {(growthRate * 100).toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>

          {/* Mini timeline chart (text-based bars) */}
          <View style={s.chartCard}>
            {series.map(pt => {
              const widthPct =
                series.length > 1
                  ? ((pt.value - series[0].value) /
                      (series[series.length - 1].value - series[0].value || 1)) *
                      80 +
                    20
                  : 100;
              return (
                <View key={pt.year} style={s.chartRow}>
                  <Text style={s.chartYear}>
                    {pt.year === 0
                      ? t(lang, 'purchase_price').slice(0, 6)
                      : `+${pt.year}y`}
                  </Text>
                  <View style={s.chartBarTrack}>
                    <View
                      style={[
                        s.chartBarFill,
                        {
                          width: `${Math.min(100, Math.max(10, widthPct))}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={s.chartValue}>
                    {formatNum(pt.value)}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Disclaimer */}
          <Text style={s.disclaimer}>
            ⚠ {t(lang, 'investment_disclaimer')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
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
    maxHeight: '90%',
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
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.panel2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: colors.muted, fontSize: 14, fontWeight: '600' },

  scroll: { flexGrow: 0 },
  scrollContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },

  field: { gap: 6 },
  fieldLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panel2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  priceInput: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    paddingVertical: 12,
  },
  currencyLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },

  yearsRow: { flexDirection: 'row', gap: 8 },
  yearChip: {
    flex: 1,
    backgroundColor: colors.panel2,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  yearChipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  yearChipText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  yearChipTextOn: { color: '#fff' },

  loadingBox: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.panel2,
    borderRadius: radii.md,
  },
  marketBox: {
    backgroundColor: colors.panel2,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  marketBoxGood: {
    backgroundColor: 'rgba(63, 176, 124, 0.08)',
    borderColor: colors.ok,
  },
  marketBoxBad: {
    backgroundColor: 'rgba(196, 75, 61, 0.08)',
    borderColor: colors.danger,
  },
  marketBoxNeutral: {
    borderColor: colors.border,
  },
  marketBoxEmpty: {
    backgroundColor: colors.panel2,
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  marketEmptyText: { color: colors.muted, fontSize: 12 },
  marketLabel: { color: colors.muted, fontSize: 11, marginBottom: 2 },
  marketValue: { color: colors.text, fontSize: 18, fontWeight: '800' },
  marketSamples: { color: colors.muted, fontSize: 11, marginTop: 2 },
  marketDelta: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 6,
  },

  projectionCard: {
    backgroundColor: colors.panel2,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  projectionLabel: { color: colors.muted, fontSize: 11, marginBottom: 4 },
  projectionValue: {
    color: colors.accent,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  projectionYears: { color: colors.muted, fontSize: 12, marginTop: 2 },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { color: colors.muted, fontSize: 10, marginBottom: 4 },
  statValue: { color: colors.text, fontSize: 14, fontWeight: '800' },

  chartCard: {
    backgroundColor: colors.panel2,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 6,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartYear: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    width: 38,
  },
  chartBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.panel,
    borderRadius: 4,
    overflow: 'hidden',
  },
  chartBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  chartValue: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
    width: 78,
    textAlign: 'right',
  },

  disclaimer: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
    marginTop: 6,
  },
});
