import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { fetchMyPlots, deletePlot, type Plot } from '@/data/plots';
import { fmtArea, formatPrice, geodesicArea } from '@/lib/geometry';
import { colors, radii, spacing } from '@/lib/theme';
import { t, type Lang } from '@/lib/i18n';
import CreatePlotForm from '@/screens/CreatePlotForm';

export default function MyPlotsScreen({ lang }: { lang: Lang }) {
  const [plots, setPlots] = useState<Plot[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<Plot | null>(null);

  const load = useCallback(async () => {
    const list = await fetchMyPlots();
    setPlots(list);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onDelete = (id: string) => {
    Alert.alert(t(lang, 'delete'), '?', [
      { text: t(lang, 'cancel'), style: 'cancel' },
      {
        text: t(lang, 'delete'),
        style: 'destructive',
        onPress: async () => {
          const ok = await deletePlot(id);
          if (ok) setPlots(prev => (prev ?? []).filter(p => p.id !== id));
        },
      },
    ]);
  };

  const onEdit = (p: Plot) => setEditing(p);
  const closeEdit = () => setEditing(null);
  const onEdited = () => {
    setEditing(null);
    load();
  };

  if (plots === null) {
    return (
      <View style={s.center}>
        <Text style={s.muted}>{t(lang, 'loading')}</Text>
      </View>
    );
  }

  if (plots.length === 0) {
    return (
      <View style={s.center}>
        <Text style={s.empty}>{t(lang, 'no_plots_yet')}</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={plots}
        keyExtractor={p => p.id}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brandSoft}
          />
        }
        renderItem={({ item }) => {
          const title =
            item.title?.[lang] || item.title?.en || `Plot in ${item.district}`;
          const area = item.area_m2 ?? geodesicArea(item.coords);
          return (
            <View style={s.card}>
              {item.images?.[0] ? (
                <Image source={{ uri: item.images[0] }} style={s.thumb} />
              ) : (
                <View style={[s.thumb, s.thumbEmpty]}>
                  <Text style={s.muted}>—</Text>
                </View>
              )}
              <View style={s.body}>
                <Text style={s.title} numberOfLines={1}>
                  {title}
                </Text>
                <Text style={s.meta}>
                  {item.district} · {item.use}
                </Text>
                <View style={s.row}>
                  <Text style={s.price}>
                    {formatPrice(item.price, item.currency)}
                  </Text>
                  <Text style={s.muted}>{fmtArea(area)}</Text>
                </View>
                <View style={s.statsRow}>
                  <Text style={s.stat}>{item.view_count ?? 0} views</Text>
                  <View
                    style={[s.pill, { backgroundColor: pillBg(item.status) }]}
                  >
                    <Text style={s.pillText}>
                      {t(lang, 'status_' + item.status)}
                    </Text>
                  </View>
                </View>
                <View style={s.actions}>
                  <TouchableOpacity
                    style={s.editBtn}
                    onPress={() => onEdit(item)}
                  >
                    <Text style={s.editText}>✎ {t(lang, 'edit_plot')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDelete(item.id)}>
                    <Text style={s.danger}>{t(lang, 'delete')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Edit modal -- reuses the same form in edit mode */}
      <CreatePlotForm
        visible={!!editing}
        coords={editing?.coords ?? []}
        lang={lang}
        existingPlot={editing}
        onClose={closeEdit}
        onSaved={onEdited}
      />
    </>
  );
}

const pillBg = (status: string) => {
  if (status === 'active') return '#3FB07C';
  if (status === 'pending') return '#E0A03F';
  if (status === 'rejected') return '#C44B3D';
  if (status === 'sold') return '#9AA59E';
  return '#2A332E';
};

const s = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  empty: { color: colors.muted, fontSize: 16 },
  muted: { color: colors.muted, fontSize: 13 },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.panel,
    borderRadius: radii.lg,
    borderColor: colors.border,
    borderWidth: 1,
    padding: spacing.md,
  },
  thumb: {
    width: 90,
    height: 90,
    borderRadius: radii.md,
    backgroundColor: colors.panel2,
  },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 15, fontWeight: '600' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  price: { color: colors.brandSoft, fontWeight: '700', fontSize: 14 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  stat: { color: colors.muted, fontSize: 12 },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  pillText: { color: '#0C1110', fontSize: 11, fontWeight: '700' },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  editBtn: {
    backgroundColor: colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  editText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  danger: { color: colors.danger, fontSize: 12 },
});
