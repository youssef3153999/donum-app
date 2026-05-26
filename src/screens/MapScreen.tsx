import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Pressable,
  Alert,
  ScrollView,
  Image,
  Share,
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TextInput,
  Keyboard,
} from 'react-native';
import MapView, {
  Marker,
  Polygon,
  PROVIDER_GOOGLE,
  type MapPressEvent,
} from 'react-native-maps';
import { supabase } from '@/lib/supabase';
import { fetchActivePlots, type Plot } from '@/data/plots';
import {
  centroid,
  formatPriceCompact,
  fmtArea,
  geodesicArea,
  type LatLng,
} from '@/lib/geometry';
import { colors, radii, spacing } from '@/lib/theme';
import { t, type Lang } from '@/lib/i18n';
import CreatePlotForm from '@/screens/CreatePlotForm';
import FilterSheet, {
  EMPTY_FILTERS,
  countActiveFilters,
  type Filters,
} from '@/screens/FilterSheet';
import InvestmentCalculator from '@/screens/InvestmentCalculator';
import {
  DISTRICT_COORDS,
  DISTRICT_KEYS,
  findDistrict,
  type DistrictKey,
} from '@/lib/districts';

const SYRIA_REGION = {
  latitude: 35.0,
  longitude: 38.5,
  latitudeDelta: 6.0,
  longitudeDelta: 6.0,
};

type Props = {
  lang: Lang;
};

export default function MapScreen({ lang }: Props) {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Plot | null>(null);

  // Drawing state
  const [drawing, setDrawing] = useState(false);
  const [drawnCoords, setDrawnCoords] = useState<LatLng[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<LatLng[]>([]);

  // Search + filter state
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const mapRef = useRef<MapView>(null);

  // Apply filters to plots
  const filteredPlots = useMemo(() => {
    return plots.filter(p => {
      if (filters.districts.length > 0 && !filters.districts.includes(p.district as DistrictKey)) {
        return false;
      }
      if (filters.uses.length > 0 && !filters.uses.includes(p.use)) {
        return false;
      }
      if (filters.priceMin !== null && p.price < filters.priceMin) return false;
      if (filters.priceMax !== null && p.price > filters.priceMax) return false;
      const area = p.area_m2 ?? geodesicArea(p.coords);
      if (filters.areaMin !== null && area < filters.areaMin) return false;
      if (filters.areaMax !== null && area > filters.areaMax) return false;
      if (filters.electricity && !p.electricity) return false;
      if (filters.water && !p.water) return false;
      if (filters.road && !p.road) return false;
      if (filters.hasPhotos && (!p.images || p.images.length === 0)) return false;
      return true;
    });
  }, [plots, filters]);

  const activeFilterCount = countActiveFilters(filters);

  // Submit search: zoom to matching district
  const submitSearch = () => {
    Keyboard.dismiss();
    const k = findDistrict(searchText, key =>
      ['ar', 'de', 'en'].map(l => t(l as Lang, `d_${key}`)),
    );
    if (!k) {
      Alert.alert(t(lang, 'app_title'), t(lang, 'no_results'));
      return;
    }
    const c = DISTRICT_COORDS[k];
    mapRef.current?.animateCamera(
      {
        center: { latitude: c.lat, longitude: c.lng },
        zoom: c.zoom,
      },
      { duration: 800 },
    );
    // Auto-apply district filter
    setFilters(f => ({
      ...f,
      districts: f.districts.includes(k) ? f.districts : [...f.districts, k],
    }));
  };

  const clearSearchAndFilters = () => {
    setSearchText('');
    setFilters(EMPTY_FILTERS);
  };

  const loadPlots = useCallback(async () => {
    setLoading(true);
    const list = await fetchActivePlots();
    setPlots(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPlots();
  }, [loadPlots]);

  const onSelectPlot = (p: Plot) => {
    if (drawing) return;
    setSelected(p);
    const [lat, lng] = centroid(p.coords);
    mapRef.current?.animateToRegion(
      {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      800,
    );
  };

  const renderPolygons = useMemo(() => {
    return filteredPlots
      .filter(p => Array.isArray(p.coords) && p.coords.length >= 3)
      .map(p => {
        const coords = p.coords.map(([lat, lng]) => ({
          latitude: lat,
          longitude: lng,
        }));
        return (
          <Polygon
            key={`poly-${p.id}`}
            coordinates={coords}
            strokeColor={colors.brand}
            strokeWidth={2}
            fillColor={'rgba(184, 84, 50, 0.18)'}
            tappable={!drawing}
            onPress={() => onSelectPlot(p)}
          />
        );
      });
  }, [filteredPlots, drawing]);

  const renderPills = useMemo(() => {
    if (drawing) return null; // hide price pills during drawing to keep map clean
    return filteredPlots
      .filter(p => Array.isArray(p.coords) && p.coords.length >= 3)
      .map(p => {
        const [lat, lng] = centroid(p.coords);
        return (
          <Marker
            key={`pill-${p.id}`}
            coordinate={{ latitude: lat, longitude: lng }}
            onPress={() => onSelectPlot(p)}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={s.pill}>
              <Text style={s.pillText}>
                {formatPriceCompact(p.price, p.currency)}
              </Text>
            </View>
          </Marker>
        );
      });
  }, [filteredPlots, drawing]);

  // Render the polygon currently being drawn
  const renderDrawingPolygon = useMemo(() => {
    if (!drawing || drawnCoords.length < 2) return null;
    const coords = drawnCoords.map(([lat, lng]) => ({
      latitude: lat,
      longitude: lng,
    }));
    return (
      <Polygon
        coordinates={coords}
        strokeColor={colors.accent}
        strokeWidth={3}
        fillColor={'rgba(200, 151, 91, 0.25)'}
      />
    );
  }, [drawing, drawnCoords]);

  // Markers for each corner being placed
  const renderDrawingCorners = useMemo(() => {
    if (!drawing) return null;
    return drawnCoords.map(([lat, lng], i) => (
      <Marker
        key={`corner-${i}`}
        coordinate={{ latitude: lat, longitude: lng }}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={false}
      >
        <View style={s.corner}>
          <Text style={s.cornerText}>{i + 1}</Text>
        </View>
      </Marker>
    ));
  }, [drawing, drawnCoords]);

  const onMapPress = (e: MapPressEvent) => {
    if (drawing) {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      setDrawnCoords(prev => [...prev, [latitude, longitude]]);
      return;
    }
    setSelected(null);
  };

  const zoomBy = (factor: number) => {
    mapRef.current?.getCamera().then(cam => {
      const next = (cam.zoom ?? 12) + factor;
      mapRef.current?.animateCamera({ zoom: next }, { duration: 250 });
    });
  };

  const startDrawing = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('!', t(lang, 'must_signin'));
      return;
    }
    setSelected(null);
    setDrawnCoords([]);
    setDrawing(true);
  };

  const cancelDrawing = () => {
    setDrawing(false);
    setDrawnCoords([]);
  };

  const undoLast = () => {
    setDrawnCoords(prev => prev.slice(0, -1));
  };

  const finishDrawing = () => {
    if (drawnCoords.length < 3) {
      Alert.alert('!', t(lang, 'draw_min_points'));
      return;
    }
    setPendingCoords(drawnCoords);
    setShowForm(true);
  };

  const onFormSaved = () => {
    setDrawing(false);
    setDrawnCoords([]);
    setPendingCoords([]);
    loadPlots();
  };

  return (
    <View style={s.root}>
      <MapView
        ref={mapRef}
        style={s.map}
        provider={PROVIDER_GOOGLE}
        mapType="hybrid"
        initialRegion={SYRIA_REGION}
        onPress={onMapPress}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {renderPolygons}
        {renderPills}
        {renderDrawingPolygon}
        {renderDrawingCorners}
      </MapView>

      {loading && (
        <View style={s.loading}>
          <ActivityIndicator color={colors.brandSoft} />
        </View>
      )}

      {/* Search bar + Filters (hidden during drawing) */}
      {!drawing && (
        <View style={s.searchBar} pointerEvents="box-none">
          <View style={s.searchInputWrap}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              style={s.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={submitSearch}
              returnKeyType="search"
              placeholder={t(lang, 'search_placeholder')}
              placeholderTextColor={colors.muted}
            />
            {(searchText.length > 0 || activeFilterCount > 0) && (
              <Pressable
                onPress={clearSearchAndFilters}
                hitSlop={8}
                style={s.searchClear}
              >
                <Text style={s.searchClearText}>✕</Text>
              </Pressable>
            )}
          </View>
          <Pressable
            style={s.filterBtn}
            onPress={() => setShowFilters(true)}
            hitSlop={6}
          >
            <Text style={s.filterIcon}>⚙</Text>
            {activeFilterCount > 0 && (
              <View style={s.filterDot}>
                <Text style={s.filterDotText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      )}

      {/* Results count badge */}
      {!drawing && (activeFilterCount > 0 || searchText.length > 0) && (
        <View style={s.resultsBadge}>
          <Text style={s.resultsBadgeText}>
            {filteredPlots.length} {t(lang, 'results_count')}
          </Text>
        </View>
      )}

      {/* Zoom buttons */}
      <View style={s.zoomCol}>
        <Pressable style={s.zoomBtn} onPress={() => zoomBy(1)} hitSlop={6}>
          <Text style={s.zoomTxt}>+</Text>
        </Pressable>
        <View style={s.zoomDivider} />
        <Pressable style={s.zoomBtn} onPress={() => zoomBy(-1)} hitSlop={6}>
          <Text style={s.zoomTxt}>−</Text>
        </Pressable>
      </View>

      {/* Add Land floating button (hidden during drawing) */}
      {!drawing && !selected && (
        <TouchableOpacity style={s.fab} onPress={startDrawing}>
          <Text style={s.fabPlus}>+</Text>
          <Text style={s.fabLabel}>{t(lang, 'add_land')}</Text>
        </TouchableOpacity>
      )}

      {/* Drawing top banner with hint */}
      {drawing && (
        <View style={s.drawBanner}>
          <Text style={s.drawBannerText}>{t(lang, 'draw_hint')}</Text>
          <Text style={s.drawBannerCount}>
            {drawnCoords.length} •{' '}
            {drawnCoords.length >= 3
              ? fmtArea(geodesicArea(drawnCoords))
              : '—'}
          </Text>
        </View>
      )}

      {/* Drawing bottom toolbar */}
      {drawing && (
        <View style={s.drawBar}>
          <TouchableOpacity style={s.drawBtnGhost} onPress={cancelDrawing}>
            <Text style={s.drawBtnGhostText}>{t(lang, 'cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.drawBtnGhost, drawnCoords.length === 0 && s.drawBtnDisabled]}
            onPress={undoLast}
            disabled={drawnCoords.length === 0}
          >
            <Text style={s.drawBtnGhostText}>{t(lang, 'undo')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              s.drawBtnPrimary,
              drawnCoords.length < 3 && s.drawBtnDisabled,
            ]}
            onPress={finishDrawing}
            disabled={drawnCoords.length < 3}
          >
            <Text style={s.drawBtnPrimaryText}>{t(lang, 'finish')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {selected && !drawing && (
        <>
          <Pressable style={s.backdrop} onPress={() => setSelected(null)} />
          <DetailCard
            plot={selected}
            lang={lang}
            onClose={() => setSelected(null)}
          />
        </>
      )}

      <CreatePlotForm
        visible={showForm}
        coords={pendingCoords}
        lang={lang}
        onClose={() => setShowForm(false)}
        onSaved={onFormSaved}
      />

      <FilterSheet
        visible={showFilters}
        initial={filters}
        lang={lang}
        resultsCount={filteredPlots.length}
        onClose={() => setShowFilters(false)}
        onApply={setFilters}
      />
    </View>
  );
}

const SCREEN_W = Dimensions.get('window').width;
const HERO_H = 220;

function DetailCard({
  plot,
  lang,
  onClose,
}: {
  plot: Plot;
  lang: Lang;
  onClose: () => void;
}) {
  const isAr = lang === 'ar';
  const slide = useRef(new Animated.Value(1)).current; // 1 = hidden (off-screen)
  const [activeImg, setActiveImg] = useState(0);
  const [favorited, setFavorited] = useState(false);

  // Slide-up entrance animation
  useEffect(() => {
    Animated.spring(slide, {
      toValue: 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    }).start();
  }, [slide]);

  const closeWithAnim = () => {
    Animated.timing(slide, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(onClose);
  };

  const [showCalc, setShowCalc] = useState(false);

  const title =
    plot.title?.[lang] || plot.title?.en || `Plot in ${plot.district}`;
  const desc = plot.desc?.[lang] || plot.desc?.en || '';
  const area = plot.area_m2 ?? geodesicArea(plot.coords);
  const districtLabel = t(lang, `d_${plot.district}`);
  const useLabel = t(lang, `use_${plot.use}`);
  const pricePerM2 = area > 0 ? Math.round(plot.price / area) : 0;
  const postedDate = plot.created_at
    ? new Date(plot.created_at).toLocaleDateString(
        lang === 'ar' ? 'ar-SY' : lang === 'de' ? 'de-DE' : 'en-US',
        { year: 'numeric', month: 'short', day: 'numeric' },
      )
    : null;

  const hasPhone = !!plot.phone && plot.phone.trim().length > 0;
  const phoneDigits = hasPhone ? plot.phone!.replace(/[^0-9+]/g, '') : '';
  const images = (plot.images ?? []).filter(Boolean);

  const openWhatsapp = async () => {
    if (!hasPhone) return;
    const num = phoneDigits.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(`${t(lang, 'share_message')}: ${title}`);
    const url = `whatsapp://send?phone=${num}&text=${msg}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      Linking.openURL(`https://wa.me/${num}?text=${msg}`);
    }
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
      // user cancelled
    }
  };

  const onGalleryScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (idx !== activeImg) setActiveImg(idx);
  };

  // Status pill color
  const statusColor =
    plot.status === 'active'
      ? colors.ok
      : plot.status === 'sold'
        ? colors.danger
        : plot.status === 'pending'
          ? colors.warn
          : colors.muted;

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, HERO_H + 400],
  });

  return (
    <Animated.View style={[s.sheet, { transform: [{ translateY }] }]}>
      <ScrollView
        style={s.sheetScroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
        stickyHeaderIndices={[]}
      >
        {/* HERO: Gallery or placeholder */}
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
              {/* Pagination dots */}
              {images.length > 1 && (
                <View style={s.dots}>
                  {images.map((_, i) => (
                    <View
                      key={i}
                      style={[s.dot, i === activeImg && s.dotActive]}
                    />
                  ))}
                </View>
              )}
              {/* Image counter */}
              {images.length > 1 && (
                <View style={s.counter}>
                  <Text style={s.counterText}>
                    {activeImg + 1} / {images.length}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={[s.heroImg, s.heroEmpty]}>
              <Text style={s.heroEmptyIcon}>🏞</Text>
              <Text style={s.heroEmptyText}>{t(lang, 'no_photos')}</Text>
            </View>
          )}

          {/* Top overlay: close + favorite */}
          <View style={s.heroTop}>
            <Pressable
              onPress={closeWithAnim}
              hitSlop={12}
              style={s.iconCircle}
            >
              <Text style={s.iconCircleText}>✕</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={sharePlot}
              hitSlop={12}
              style={s.iconCircle}
            >
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
          </View>

          {/* Status badge */}
          <View style={[s.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={s.statusBadgeText}>
              {t(lang, `status_${plot.status}`)}
            </Text>
          </View>

          {/* Drag handle */}
          <View style={s.handleOverlay} />
        </View>

        {/* CONTENT */}
        <View style={s.content}>
          {/* Title + location */}
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
                  {pricePerM2.toLocaleString()} {plot.currency} {t(lang, 'price_per_m2')}
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
              {plot.water && (
                <Util icon="💧" label={t(lang, 'utility_water')} />
              )}
              {plot.road && (
                <Util icon="🛣" label={t(lang, 'utility_road')} />
              )}
            </View>
          )}

          {/* Description */}
          <Text style={s.sectionLabel}>{t(lang, 'description')}</Text>
          <Text
            style={[s.descText, { textAlign: isAr ? 'right' : 'left' }]}
          >
            {desc.trim().length > 0 ? desc : t(lang, 'no_description')}
          </Text>

          {/* Meta footer */}
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
          <TouchableOpacity
            style={s.calcBtn}
            onPress={() => setShowCalc(true)}
          >
            <Text style={s.calcBtnIcon}>📊</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.calcBtnTitle}>{t(lang, 'calc_investment')}</Text>
              <Text style={s.calcBtnSubtitle}>
                {t(lang, 'investment_calc')}
              </Text>
            </View>
            <Text style={s.calcBtnArrow}>{isAr ? '←' : '→'}</Text>
          </TouchableOpacity>

          {/* Spacer for sticky action bar */}
          <View style={{ height: 80 }} />
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
    </Animated.View>
  );
}

function Util({ label, icon }: { label: string; icon?: string }) {
  return (
    <View style={s.util}>
      {icon && <Text style={s.utilIcon}>{icon}</Text>}
      <Text style={s.utilText}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  map: { flex: 1 },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12,17,16,.35)',
  },
  pill: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  pillText: { color: '#0C1110', fontSize: 12, fontWeight: '700' },

  corner: {
    backgroundColor: colors.accent,
    borderColor: '#fff',
    borderWidth: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  zoomCol: {
    position: 'absolute',
    right: spacing.md,
    top: 80, // Below search bar
    backgroundColor: colors.panel,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  // Search bar
  searchBar: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 44,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  searchClear: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.panel2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchClearText: { color: colors.muted, fontSize: 11, fontWeight: '700' },

  // Filter button
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
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

  // Results count badge
  resultsBadge: {
    position: 'absolute',
    top: 78,
    alignSelf: 'center',
    backgroundColor: colors.panel,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.brandSoft,
    paddingHorizontal: 14,
    paddingVertical: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  resultsBadgeText: {
    color: colors.brandSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  zoomBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomTxt: { color: colors.text, fontSize: 22, fontWeight: '600' },
  zoomDivider: { height: 1, backgroundColor: colors.border },

  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xl,
    backgroundColor: colors.brand,
    borderRadius: radii.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabPlus: { color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 24 },
  fabLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },

  drawBanner: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.md,
    right: 70,
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    elevation: 4,
  },
  drawBannerText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  drawBannerCount: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 12,
    marginTop: 4,
  },

  drawBar: {
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
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  drawBtnGhost: {
    flex: 1,
    backgroundColor: colors.panel2,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  drawBtnGhostText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  drawBtnPrimary: {
    flex: 1.4,
    backgroundColor: colors.brand,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  drawBtnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  drawBtnDisabled: { opacity: 0.4 },

  // Backdrop dim layer
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  // Bottom sheet container
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
  sheetScroll: { flexGrow: 0 },

  // HERO image area
  hero: {
    width: SCREEN_W,
    height: HERO_H,
    backgroundColor: colors.panel2,
    position: 'relative',
  },
  heroImg: {
    width: SCREEN_W,
    height: HERO_H,
    backgroundColor: colors.panel2,
  },
  heroEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroEmptyIcon: { fontSize: 56, opacity: 0.35 },
  heroEmptyText: { color: colors.muted, fontSize: 12, fontWeight: '500' },

  // Drag handle
  handleOverlay: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  // Top overlay (close, share, favorite)
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

  // Pagination dots
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
  dotActive: {
    backgroundColor: '#fff',
    width: 18,
  },

  // Image counter
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

  // Status badge
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

  // Content area
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

  // Verified seller badge
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
  verifiedBadgeIcon: {
    color: colors.ok,
    fontSize: 11,
    fontWeight: '900',
  },
  verifiedBadgeText: {
    color: colors.ok,
    fontSize: 10,
    fontWeight: '800',
  },
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

  // Hero price
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

  // Utilities
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

  // Section label
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

  // Meta
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

  // Sticky action bar
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

  // Investment calculator CTA inside DetailCard
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
  calcBtnTitle: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '800',
  },
  calcBtnSubtitle: { color: colors.muted, fontSize: 11, marginTop: 2 },
  calcBtnArrow: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '800',
  },
});
