import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Pressable,
  Alert,
  Keyboard,
  Platform,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
// react-native-map-clustering wraps react-native-maps. It re-exports
// Marker, Polygon, Callout, etc. so we still import them from there.
import MapView from 'react-native-map-clustering';
import {
  Marker,
  Polygon,
  PROVIDER_GOOGLE,
  type MapPressEvent,
} from 'react-native-maps';
import { supabase } from '@/lib/supabase';
import { fetchActivePlotsResult, incrementViewCount, type Plot } from '@/data/plots';
import { centroid, geodesicArea, type LatLng } from '@/lib/geometry';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '@/lib/theme';
import { t, type Lang } from '@/lib/i18n';
import CreatePlotForm from '@/screens/CreatePlotForm';
import FilterSheet, {
  EMPTY_FILTERS,
  countActiveFilters,
  type Filters,
} from '@/screens/FilterSheet';
import {
  DISTRICT_COORDS,
  findDistrict,
  type DistrictKey,
} from '@/lib/districts';
import MapTopBar from '@/components/MapTopBar';
import MapFabStack from '@/components/MapFabStack';
import DrawingToolbar from '@/components/DrawingToolbar';
import DrawHelpOverlay from '@/components/DrawHelpOverlay';
import PlotDetailSheet from '@/components/PlotDetailSheet';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SYRIA_REGION = {
  latitude: 35.0,
  longitude: 38.5,
  latitudeDelta: 6.0,
  longitudeDelta: 6.0,
};

const TOP_INSET =
  Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 44;

// Minimal dark map style (subtle, fits the earth-tone brand)
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a211f' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0c1110' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7a8480' }] },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#232b28' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0a1418' }],
  },
];

type Props = {
  lang: Lang;
};

export default function MapScreen({ lang }: Props) {
  const insets = useSafeAreaInsets();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showDrawHelp, setShowDrawHelp] = useState(false);
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

  // Track zoom level so we can hide polygons when zoomed out (huge perf win)
  const [zoomLevel, setZoomLevel] = useState(7);
  const POLYGON_VISIBLE_ZOOM = 12;

  // Bottom FAB ("Add land") entrance animation
  const fabIn = useSharedValue(80);
  useEffect(() => {
    fabIn.value = withDelay(
      200,
      withSpring(0, { damping: 16, stiffness: 160 }),
    );
  }, [fabIn]);
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: fabIn.value }],
  }));

  // Apply filters to plots
  const filteredPlots = useMemo(() => {
    return plots.filter(p => {
      if (
        filters.districts.length > 0 &&
        !filters.districts.includes(p.district as DistrictKey)
      ) {
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
      if (
        filters.hasPhotos &&
        (!p.images || p.images.length === 0)
      )
        return false;
      return true;
    });
  }, [plots, filters]);

  const activeFilterCount = countActiveFilters(filters);

  // Load plots
  const loadPlots = useCallback(async () => {
    setLoading(true);
    const { plots: list, ok } = await fetchActivePlotsResult();
    setLoadError(!ok);
    if (ok) setPlots(list);
    setLoading(false);
  }, []);
  useEffect(() => {
    loadPlots();
  }, [loadPlots]);

  // Map interactions
  const onSelectPlot = useCallback(
    (p: Plot) => {
      if (drawing) return;
      // Optimistically show +1 and record the view (fire-and-forget).
      setSelected({ ...p, view_count: (p.view_count ?? 0) + 1 });
      incrementViewCount(p.id);
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
    },
    [drawing],
  );

  const onMapPress = (e: MapPressEvent) => {
    if (drawing) {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      setDrawnCoords(prev => [...prev, [latitude, longitude]]);
      return;
    }
    setSelected(null);
  };

  // Convert latitudeDelta to a rough zoom level (Google Maps formula).
  // Called whenever the user pans/zooms.
  const onRegionChange = (region: { latitudeDelta: number }) => {
    const z = Math.log2(360 / region.latitudeDelta);
    // Only update state if it crosses the polygon-visibility threshold
    // (avoids re-render on every micro pan)
    const next = Math.round(z);
    if (
      (next >= POLYGON_VISIBLE_ZOOM) !== (zoomLevel >= POLYGON_VISIBLE_ZOOM)
    ) {
      setZoomLevel(next);
    }
  };

  // Fractional zoom — Google Maps natively supports fractional zoom levels;
  // we use 0.6 increments for buttons (feels smoother than integer +1/-1)
  // and a longer 350ms ease so the camera glides instead of snapping.
  const zoomBy = (factor: number) => {
    mapRef.current?.getCamera().then(cam => {
      const current = cam.zoom ?? 12;
      const step = 0.6 * factor;
      const next = Math.max(3, Math.min(20, current + step));
      mapRef.current?.animateCamera({ zoom: next }, { duration: 350 });
    });
  };

  // Search: zoom to matching district
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
    setFilters(f => ({
      ...f,
      districts: f.districts.includes(k) ? f.districts : [...f.districts, k],
    }));
  };

  const clearSearchAndFilters = () => {
    setSearchText('');
    setFilters(EMPTY_FILTERS);
  };

  // Drawing
  const startDrawing = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('!', t(lang, 'must_signin'));
      return;
    }
    setSelected(null);
    setDrawnCoords([]);
    setDrawing(true);
    // Show the drawing tutorial the first time only.
    const seen = await AsyncStorage.getItem('donum_draw_help_seen');
    if (!seen) {
      setShowDrawHelp(true);
      AsyncStorage.setItem('donum_draw_help_seen', '1');
    }
  };
  const cancelDrawing = () => {
    setDrawing(false);
    setDrawnCoords([]);
  };
  const undoLast = () => setDrawnCoords(prev => prev.slice(0, -1));
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

  // Map renderables (memo-ed for perf)
  // Polygons are HEAVY -- only render them when the user is zoomed in close
  // enough to actually see plot boundaries (>= zoom 12). Below that, the
  // marker clusters are the only thing visible.
  const polygons = useMemo(() => {
    if (zoomLevel < POLYGON_VISIBLE_ZOOM) return null;
    return filteredPlots
      .filter(p => Array.isArray(p.coords) && p.coords.length >= 3)
      .map(p => (
        <Polygon
          key={`poly-${p.id}`}
          coordinates={p.coords.map(([lat, lng]) => ({
            latitude: lat,
            longitude: lng,
          }))}
          strokeColor={colors.brand}
          strokeWidth={2}
          fillColor="rgba(184, 84, 50, 0.18)"
          tappable={!drawing}
          onPress={() => onSelectPlot(p)}
        />
      ));
  }, [filteredPlots, drawing, onSelectPlot, zoomLevel]);

  const drawingPolygon = useMemo(() => {
    if (!drawing || drawnCoords.length < 2) return null;
    return (
      <Polygon
        coordinates={drawnCoords.map(([lat, lng]) => ({
          latitude: lat,
          longitude: lng,
        }))}
        strokeColor={colors.accent}
        strokeWidth={3}
        fillColor="rgba(200, 151, 91, 0.25)"
      />
    );
  }, [drawing, drawnCoords]);

  const drawingCorners = useMemo(() => {
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

  // Markers (clustering enabled below at <MapView/> level)
  const markers = useMemo(
    () =>
      filteredPlots
        .filter(p => Array.isArray(p.coords) && p.coords.length >= 3)
        .map(p => {
          const [lat, lng] = centroid(p.coords);
          return (
            <Marker
              key={`m-${p.id}`}
              coordinate={{ latitude: lat, longitude: lng }}
              onPress={() => onSelectPlot(p)}
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={s.pill}>
                <Text style={s.pillText}>
                  {compactPrice(p.price, p.currency)}
                </Text>
              </View>
            </Marker>
          );
        }),
    [filteredPlots, onSelectPlot],
  );

  return (
    <View style={s.root}>
      {/* Translucent status bar over edge-to-edge map */}
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Map — full screen, behind everything */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        mapType="hybrid"
        // customMapStyle removed: hybrid satellite imagery hides the style
        // anyway, and it was costing ~30% render time per frame.
        initialRegion={SYRIA_REGION}
        onPress={onMapPress}
        onRegionChangeComplete={onRegionChange}
        // -- Gestures: enable all natural map interactions
        zoomEnabled
        scrollEnabled
        rotateEnabled
        pitchEnabled
        // We use our own + / − FABs, so hide the built-in zoom widget
        zoomControlEnabled={false}
        // Double-tap to zoom in fractionally
        zoomTapEnabled
        // Fractional zoom range (Google Maps default behavior; just widen
        // the bounds so users can zoom way out for clusters + way in for plots)
        minZoomLevel={3}
        maxZoomLevel={20}
        // Map perf
        loadingEnabled
        moveOnMarkerPress={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        // Clustering options
        clusterColor={colors.brand}
        clusterTextColor="#fff"
        clusterFontFamily={Platform.OS === 'ios' ? undefined : 'sans-serif'}
        radius={50}
        minPoints={3}
        spiralEnabled={false}
        animationEnabled
      >
        {polygons}
        {!drawing && markers}
        {drawingPolygon}
        {drawingCorners}
      </MapView>

      {/* Loading overlay */}
      {loading && (
        <View style={s.loading}>
          <ActivityIndicator color={colors.brandSoft} />
        </View>
      )}

      {/* Top bar (hidden during drawing) */}
      {!drawing && (
        <MapTopBar
          lang={lang}
          searchText={searchText}
          onSearchTextChange={setSearchText}
          onSubmitSearch={submitSearch}
          onClearAll={clearSearchAndFilters}
          onOpenFilters={() => setShowFilters(true)}
          activeFilterCount={activeFilterCount}
          resultsCount={filteredPlots.length}
          showResults={activeFilterCount > 0 || searchText.length > 0}
        />
      )}

      {/* Load-error banner (offline / server error) with retry */}
      {loadError && !drawing && (
        <View style={[s.errorBanner, { top: TOP_INSET + 70 }]}>
          <Text style={s.errorText}>{t(lang, 'load_failed')}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={loadPlots}>
            <Text style={s.retryText}>{t(lang, 'retry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Right-side FAB stack (hidden during drawing) */}
      {!drawing && (
        <MapFabStack
          onZoomIn={() => zoomBy(1)}
          onZoomOut={() => zoomBy(-1)}
          topOffset={TOP_INSET + 120}
        />
      )}

      {/* "Add land" bottom FAB (hidden during drawing + when sheet open) */}
      {!drawing && !selected && (
        <Animated.View
          style={[s.fabWrap, { bottom: spacing.xl + insets.bottom + 16 }, fabStyle]}
          pointerEvents="box-none"
        >
          <TouchableOpacity style={s.fab} onPress={startDrawing}>
            <Text style={s.fabPlus}>+</Text>
            <Text style={s.fabLabel}>{t(lang, 'add_land')}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Drawing toolbar */}
      {drawing && (
        <DrawingToolbar
          lang={lang}
          drawnCoords={drawnCoords}
          onCancel={cancelDrawing}
          onUndo={undoLast}
          onFinish={finishDrawing}
          onHelp={() => setShowDrawHelp(true)}
        />
      )}

      {/* Detail sheet with backdrop */}
      {selected && !drawing && (
        <>
          <Pressable style={s.backdrop} onPress={() => setSelected(null)} />
          <PlotDetailSheet
            plot={selected}
            lang={lang}
            onClose={() => setSelected(null)}
          />
        </>
      )}

      {/* Create form modal */}
      <CreatePlotForm
        visible={showForm}
        coords={pendingCoords}
        lang={lang}
        onClose={() => setShowForm(false)}
        onSaved={onFormSaved}
      />

      {/* Filter sheet modal */}
      <FilterSheet
        visible={showFilters}
        initial={filters}
        lang={lang}
        resultsCount={filteredPlots.length}
        onClose={() => setShowFilters(false)}
        onApply={setFilters}
      />

      {/* First-time drawing tutorial */}
      <DrawHelpOverlay
        visible={showDrawHelp}
        lang={lang}
        onClose={() => setShowDrawHelp(false)}
      />
    </View>
  );
}

// Compact price formatter used on marker pills
function compactPrice(price: number, currency: string): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M ${currency}`;
  if (price >= 1_000) return `${Math.round(price / 1_000)}K ${currency}`;
  return `${price} ${currency}`;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12,17,16,.35)',
    zIndex: 5,
  },

  errorBanner: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.danger,
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    zIndex: 6,
    elevation: 6,
  },
  errorText: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 },
  retryBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginLeft: 10,
  },
  retryText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // Marker pill
  pill: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  pillText: { color: '#0C1110', fontSize: 12, fontWeight: '700' },

  // Drawing corner
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

  // Bottom "Add land" FAB
  fabWrap: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xl,
    zIndex: 10,
  },
  fab: {
    backgroundColor: colors.brand,
    borderRadius: radii.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabPlus: { color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 24 },
  fabLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Backdrop behind detail sheet
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 5,
  },
});
