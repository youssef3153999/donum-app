import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Pressable,
  ScrollView,
  Image,
  Share,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { colors, radii, spacing } from '@/lib/theme';
import { t, type Lang } from '@/lib/i18n';
import { fmtArea, formatPriceCompact, geodesicArea } from '@/lib/geometry';
import { type Plot } from '@/data/plots';
import InvestmentCalculator from '@/screens/InvestmentCalculator';
import ReportSheet from '@/screens/ReportSheet';

const SCREEN_W = Dimensions.get('window').width;
const HERO_H = 220;
const SLIDE_DISTANCE = HERO_H + 500;

type Props = {
  plot: Plot;
  lang: Lang;
  onClose: () => void;
};

/**
 * Bottom sheet with full plot detail: hero gallery, price, utilities,
 * description, investment-calculator entry point, contact actions.
 * Lives over the map; backdrop dim is rendered by the parent.
 */
export default function PlotDetailSheet({ plot, lang, onClose }: Props) {
  const isAr = lang === 'ar';
  const slide = useSharedValue(1); // 1 = off-screen, 0 = visible
  const [activeImg, setActiveImg] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Slide-up entrance (Reanimated v3)
  useEffect(() => {
    slide.value = withSpring(0, {
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    });
  }, [slide]);

  const closeWithAnim = () => {
    slide.value = withTiming(1, { duration: 200 }, finished => {
      if (finished) runOnJS(onClose)();
    });
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slide.value * SLIDE_DISTANCE }],
  }));

  // Derived values
  const title =
    plot.title?.[lang] || plot.title?.en || `Plot in ${plot.district}`;
  const desc = plot.desc?.[lang] || plot.desc?.en || '';
  const area = plot.area_m2 ?? geodesicArea(plot.coords);
  const districtLabel = t(lang, `d_${plot.district}`);
  const useLabel = t(lang, `use_${plot.use}`);
  const pricePerM2 = area > 0 ? Math.round(plot.price / area) : 0;
  const postedDate = useMemo(
    () =>
      plot.created_at
        ? new Date(plot.created_at).toLocaleDateString(
            lang === 'ar' ? 'ar-SY' : lang === 'de' ? 'de-DE' : 'en-US',
            { year: 'numeric', month: 'short', day: 'numeric' },
          )
        : null,
    [plot.created_at, lang],
  );

  const hasPhone = !!plot.phone && plot.phone.trim().length > 0;
  const phoneDigits = hasPhone ? plot.phone!.replace(/[^0-9+]/g, '') : '';
  const images = (plot.images ?? []).filter(Boolean);

  // Actions
  const openWhatsapp = async () => {
    if (!hasPhone) return;
    const num = phoneDigits.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(`${t(lang, 'share_message')}: ${title}`);
    const url = `whatsapp://send?phone=${num}&text=${msg}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) Linking.openURL(url);
    else Linking.openURL(`https://wa.me/${num}?text=${msg}`);
  };

  const callSeller = () => {
    if (!hasPhone) return;
    Linking.openURL(`tel:${phoneDigits}`);
  };

  const sharePlot = async () => {
    try {
      const msg = `${t(lang, 'share_message')}\n${title}\n${plot.price} ${plot.currency} • ${fmtArea(area)}`;
      await Share.share({ message: msg, title });
    } catch {
      /* user cancelled */
    }
  };

  const onGalleryScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (idx !== activeImg) setActiveImg(idx);
  };

  const statusColor =
    plot.status === 'active'
      ? colors.ok
      : plot.status === 'sold'
        ? colors.danger
        : plot.status === 'pending'
          ? colors.warn
          : colors.muted;

  return (
    <Animated.View style={[s.sheet, sheetStyle]}>
      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* HERO */}
        <View style={s.hero}>
          {images.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onGalleryScroll}
                scrollEventThrottle={16}
              >
                {images.map((uri, idx) => (
                  <Image
                    key={`${plot.id}-img-${idx}`}
                    source={{ uri }}
                    style={s.heroImg}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              {images.length > 1 && (
                <>
                  <View style={s.dots}>
                    {images.map((_, i) => (
                      <View
                        key={i}
                        style={[s.dot, i === activeImg && s.dotActive]}
                      />
                    ))}
                  </View>
                  <View style={s.counter}>
                    <Text style={s.counterText}>
                      {activeImg + 1} / {images.length}
                    </Text>
                  </View>
                </>
              )}
            </>
          ) : (
            <View style={[s.heroImg, s.heroEmpty]}>
              <Text style={s.heroEmptyIcon}>🏞</Text>
              <Text style={s.heroEmptyText}>{t(lang, 'no_photos')}</Text>
            </View>
          )}

          {/* Top overlay */}
          <View style={s.heroTop}>
            <Pressable onPress={closeWithAnim} hitSlop={12} style={s.iconCircle}>
              <Text style={s.iconCircleText}>✕</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable onPress={sharePlot} hitSlop={12} style={s.iconCircle}>
              <Text style={s.iconCircleText}>↗</Text>
            </Pressable>
            <Pressable
              onPress={() => setFavorited(v => !v)}
              hitSlop={12}
              style={[s.iconCircle, { marginLeft: 8 }]}
            >
              <Text
                style={[
                  s.iconCircleText,
                  favorited && { color: colors.danger },
                ]}
              >
                {favorited ? '♥' : '♡'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setShowReport(true)}
              hitSlop={12}
              style={[s.iconCircle, { marginLeft: 8 }]}
              accessibilityLabel={t(lang, 'report_listing')}
            >
              <Text style={s.iconCircleText}>⚑</Text>
            </Pressable>
          </View>

          <View style={[s.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={s.statusBadgeText}>
              {t(lang, `status_${plot.status}`)}
            </Text>
          </View>
        </View>

        {/* CONTENT */}
        <View style={s.content}>
          <View style={s.titleRow}>
            <Text
              style={[s.title, { flex: 1, textAlign: isAr ? 'right' : 'left' }]}
              numberOfLines={2}
            >
              {title}
            </Text>
            {plot.owner_verified && (
              <View style={s.verifiedBadge}>
                <Text style={s.verifiedBadgeIcon}>✓</Text>
                <Text style={s.verifiedBadgeText}>
                  {t(lang, 'verified_seller')}
                </Text>
              </View>
            )}
          </View>

          <View style={s.locRow}>
            <Text style={s.locPin}>📍</Text>
            <Text style={s.location} numberOfLines={1}>
              {districtLabel}
            </Text>
            <View style={s.locDot} />
            <Text style={s.useLabel}>{useLabel}</Text>
          </View>

          {/* Hero price */}
          <View style={s.priceHero}>
            <View>
              <Text style={s.priceHeroValue}>
                {formatPriceCompact(plot.price, plot.currency)}
              </Text>
              {pricePerM2 > 0 && (
                <Text style={s.pricePerM2}>
                  {pricePerM2.toLocaleString()} {plot.currency}{' '}
                  {t(lang, 'price_per_m2')}
                </Text>
              )}
            </View>
            <View style={s.areaBadge}>
              <Text style={s.areaBadgeLabel}>{t(lang, 'filter_area')}</Text>
              <Text style={s.areaBadgeValue}>{fmtArea(area)}</Text>
            </View>
          </View>

          {/* Utilities */}
          {(plot.electricity || plot.water || plot.road) && (
            <View style={s.utilRow}>
              {plot.electricity && (
                <Util icon="⚡" label={t(lang, 'utility_electricity')} />
              )}
              {plot.water && <Util icon="💧" label={t(lang, 'utility_water')} />}
              {plot.road && <Util icon="🛣" label={t(lang, 'utility_road')} />}
            </View>
          )}

          {/* Description */}
          <Text style={s.sectionLabel}>{t(lang, 'description')}</Text>
          <Text style={[s.descText, { textAlign: isAr ? 'right' : 'left' }]}>
            {desc.trim().length > 0 ? desc : t(lang, 'no_description')}
          </Text>

          {/* Meta */}
          {(postedDate ||
            (plot.view_count !== undefined && plot.view_count > 0)) && (
            <View style={s.metaRow}>
              {postedDate && (
                <Text style={s.metaText}>
                  📅 {t(lang, 'posted_on')}: {postedDate}
                </Text>
              )}
              {plot.view_count !== undefined && plot.view_count > 0 && (
                <Text style={s.metaText}>
                  👁 {plot.view_count} {t(lang, 'views_count')}
                </Text>
              )}
            </View>
          )}

          {/* Investment calculator CTA */}
          <TouchableOpacity style={s.calcBtn} onPress={() => setShowCalc(true)}>
            <Text style={s.calcBtnIcon}>📊</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.calcBtnTitle}>{t(lang, 'calc_investment')}</Text>
              <Text style={s.calcBtnSubtitle}>{t(lang, 'investment_calc')}</Text>
            </View>
            <Text style={s.calcBtnArrow}>{isAr ? '←' : '→'}</Text>
          </TouchableOpacity>

          <View style={{ height: 90 }} />
        </View>
      </ScrollView>

      {/* Sticky action bar */}
      <View style={s.actions}>
        <TouchableOpacity
          style={[s.actionSecondary, !hasPhone && s.actionDisabled]}
          onPress={callSeller}
          disabled={!hasPhone}
          accessibilityLabel={t(lang, 'call_seller')}
        >
          <Text style={s.actionSecondaryIcon}>☎</Text>
          <Text style={s.actionSecondaryText}>{t(lang, 'call_seller')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.actionPrimary, !hasPhone && s.actionDisabled]}
          onPress={openWhatsapp}
          disabled={!hasPhone}
          accessibilityLabel={t(lang, 'open_whatsapp')}
        >
          <Text style={s.actionPrimaryIcon}>✓</Text>
          <Text style={s.actionPrimaryText}>{t(lang, 'open_whatsapp')}</Text>
        </TouchableOpacity>
      </View>

      <InvestmentCalculator
        visible={showCalc}
        lang={lang}
        district={plot.district}
        use={plot.use}
        initialPrice={plot.price}
        initialArea={area}
        currency={plot.currency}
        onClose={() => setShowCalc(false)}
      />

      <ReportSheet
        visible={showReport}
        plotId={plot.id}
        lang={lang}
        onClose={() => setShowReport(false)}
      />
    </Animated.View>
  );
}

function Util({ icon, label }: { icon?: string; label: string }) {
  return (
    <View style={s.util}>
      {icon && <Text style={s.utilIcon}>{icon}</Text>}
      <Text style={s.utilText}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '88%',
    backgroundColor: colors.panel,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -6 },
  },
  scroll: { flexGrow: 0 },

  // Hero
  hero: {
    width: SCREEN_W,
    height: HERO_H,
    backgroundColor: colors.panel2,
    position: 'relative',
  },
  heroImg: { width: SCREEN_W, height: HERO_H, backgroundColor: colors.panel2 },
  heroEmpty: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  heroEmptyIcon: { fontSize: 56, opacity: 0.35 },
  heroEmptyText: { color: colors.muted, fontSize: 12, fontWeight: '500' },

  heroTop: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(12,17,16,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  iconCircleText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  dots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: { backgroundColor: '#fff', width: 18 },

  counter: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(12,17,16,0.7)',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  counterText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  statusBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Content
  content: { padding: spacing.lg },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(63, 176, 124, 0.15)',
    borderWidth: 1,
    borderColor: colors.ok,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 2,
  },
  verifiedBadgeIcon: { color: colors.ok, fontSize: 11, fontWeight: '900' },
  verifiedBadgeText: { color: colors.ok, fontSize: 10, fontWeight: '800' },

  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  locPin: { fontSize: 12 },
  location: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  locDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.muted,
    marginHorizontal: 4,
  },
  useLabel: { color: colors.brandSoft, fontSize: 13, fontWeight: '600' },

  priceHero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.panel2,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceHeroValue: {
    color: colors.accent,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pricePerM2: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  areaBadge: {
    backgroundColor: colors.panel,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  areaBadgeLabel: { color: colors.muted, fontSize: 10, marginBottom: 2 },
  areaBadgeValue: { color: colors.text, fontSize: 14, fontWeight: '700' },

  utilRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  util: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(184, 84, 50, 0.12)',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(184, 84, 50, 0.25)',
  },
  utilIcon: { fontSize: 12 },
  utilText: { color: colors.brandSoft, fontSize: 12, fontWeight: '700' },

  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  descText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexWrap: 'wrap',
    gap: 8,
  },
  metaText: { color: colors.muted, fontSize: 11 },

  // Calc CTA
  calcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  calcBtnIcon: { fontSize: 24 },
  calcBtnTitle: { color: colors.accent, fontSize: 14, fontWeight: '800' },
  calcBtnSubtitle: { color: colors.muted, fontSize: 11, marginTop: 2 },
  calcBtnArrow: { color: colors.accent, fontSize: 18, fontWeight: '800' },

  // Sticky actions
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.panel,
  },
  actionSecondary: {
    flex: 1,
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: radii.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  actionSecondaryIcon: { color: colors.brand, fontSize: 14, fontWeight: '700' },
  actionSecondaryText: { color: colors.brand, fontSize: 13, fontWeight: '700' },
  actionPrimary: {
    flex: 1.6,
    backgroundColor: '#25D366',
    borderRadius: radii.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  actionPrimaryIcon: { color: '#fff', fontSize: 14, fontWeight: '700' },
  actionPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  actionDisabled: { opacity: 0.4 },
});
