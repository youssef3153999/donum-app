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

  const mapRef = useRef<MapView>(null);

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
    return plots
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
  }, [plots, drawing]);

  const renderPills = useMemo(() => {
    if (drawing) return null; // hide price pills during drawing to keep map clean
    return plots
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
  }, [plots, drawing]);

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
        <DetailCard
          plot={selected}
          lang={lang}
          onClose={() => setSelected(null)}
        />
      )}

      <CreatePlotForm
        visible={showForm}
        coords={pendingCoords}
        lang={lang}
        onClose={() => setShowForm(false)}
        onSaved={onFormSaved}
      />
    </View>
  );
}

function DetailCard({
  plot,
  lang,
  onClose,
}: {
  plot: Plot;
  lang: Lang;
  onClose: () => void;
}) {
  const title =
    plot.title?.[lang] || plot.title?.en || `Plot in ${plot.district}`;
  const area = plot.area_m2 ?? geodesicArea(plot.coords);

  const openWhatsapp = () => {
    if (!plot.phone) return;
    const num = plot.phone.replace(/[^0-9]/g, '');
    Linking.openURL(`whatsapp://send?phone=${num}`);
  };

  return (
    <View style={s.card}>
      <View style={s.cardHead}>
        <Text style={s.cardTitle} numberOfLines={2}>
          {title}
        </Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={s.close}>✕</Text>
        </Pressable>
      </View>
      <View style={s.row}>
        <View style={s.chip}>
          <Text style={s.chipLabel}>{t(lang, 'filter_price')}</Text>
          <Text style={s.chipValue}>
            {plot.price} {plot.currency}
          </Text>
        </View>
        <View style={s.chip}>
          <Text style={s.chipLabel}>{t(lang, 'filter_area')}</Text>
          <Text style={s.chipValue}>{fmtArea(area)}</Text>
        </View>
      </View>
      <View style={s.utilRow}>
        {plot.electricity && <Util label={t(lang, 'utility_electricity')} />}
        {plot.water && <Util label={t(lang, 'utility_water')} />}
        {plot.road && <Util label={t(lang, 'utility_road')} />}
      </View>
      {plot.phone && (
        <TouchableOpacity style={s.cta} onPress={openWhatsapp}>
          <Text style={s.ctaText}>{t(lang, 'open_whatsapp')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function Util({ label }: { label: string }) {
  return (
    <View style={s.util}>
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
    top: spacing.lg,
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

  card: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.lg,
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    paddingRight: 8,
  },
  close: { color: colors.muted, fontSize: 18, padding: 4 },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  chip: {
    flex: 1,
    backgroundColor: colors.panel2,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  chipLabel: { color: colors.muted, fontSize: 11, marginBottom: 4 },
  chipValue: { color: colors.text, fontSize: 15, fontWeight: '600' },
  utilRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  util: {
    backgroundColor: colors.panel2,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  utilText: { color: colors.brandSoft, fontSize: 12, fontWeight: '500' },
  cta: {
    backgroundColor: colors.brand,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
