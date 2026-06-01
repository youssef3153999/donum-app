import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { fetchMyFavorites, setFavorite, type Plot } from '@/data/plots';
import { fmtArea, formatPrice, geodesicArea } from '@/lib/geometry';
import { colors, radii, spacing } from '@/lib/theme';
import { t, type Lang } from '@/lib/i18n';

export default function FavoritesScreen({ lang }: { lang: Lang }) {
  const [plots, setPlots] = useState<Plot[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setPlots(await fetchMyFavorites());
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onRemove = async (id: string) => {
    setPlots(prev => (prev ?? []).filter(p => p.id !== id)); // optimistic
    const r = await setFavorite(id, false);
    if (!r.ok) load(); // restore on failure
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
        <Text style={s.empty}>{t(lang, 'no_favorites_yet')}</Text>
      </View>
    );
  }

  return (
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
              <Text style={s.title} numberOfLines={1}>{title}</Text>
              <Text style={s.meta}>{item.district} · {item.use}</Text>
              <View style={s.row}>
                <Text style={s.price}>
                  {formatPrice(item.price, item.currency)}
                </Text>
                <Text style={s.muted}>{fmtArea(area)}</Text>
              </View>
              <TouchableOpacity
                style={s.removeBtn}
                onPress={() => onRemove(item.id)}
              >
                <Text style={s.removeText}>♥ {t(lang, 'remove_favorite')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
    />
  );
}

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
  removeBtn: { marginTop: 8, alignSelf: 'flex-start' },
  removeText: { color: colors.danger, fontSize: 12, fontWeight: '700' },
});
