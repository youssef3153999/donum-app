import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { createPlot } from '@/data/plots';
import type { LatLng } from '@/lib/geometry';
import { fmtArea, geodesicArea } from '@/lib/geometry';
import { colors, radii, spacing } from '@/lib/theme';
import { t, type Lang } from '@/lib/i18n';

type Props = {
  visible: boolean;
  coords: LatLng[];
  lang: Lang;
  onClose: () => void;
  onSaved: () => void;
};

const DISTRICTS = [
  'damascus',
  'damascus_countryside',
  'aleppo',
  'homs',
  'hama',
  'latakia',
  'tartus',
  'idlib',
  'daraa',
  'deir_ezzor',
  'raqqa',
  'hasaka',
  'qamishli',
  'sweida',
  'quneitra',
];

const USES = ['residential', 'agricultural', 'commercial', 'industrial'];
const CURRENCIES = ['USD', 'EUR', 'TRY', 'SYP'];

export default function CreatePlotForm({
  visible,
  coords,
  lang,
  onClose,
  onSaved,
}: Props) {
  const [district, setDistrict] = useState('damascus');
  const [use, setUse] = useState('residential');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [electricity, setElectricity] = useState(false);
  const [water, setWater] = useState(false);
  const [waterSource, setWaterSource] = useState<'city' | 'well' | ''>('');
  const [road, setRoad] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const area = geodesicArea(coords);

  const submit = async () => {
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 1) {
      Alert.alert(t(lang, 'app_title'), t(lang, 'invalid_price'));
      return;
    }
    setSaving(true);
    const result = await createPlot({
      coords,
      district,
      use,
      price: Math.floor(priceNum),
      currency,
      phone: phone || undefined,
      desc: description ? { ar: description } : undefined,
      area_m2: Math.round(area),
      electricity,
      water,
      water_source: water ? (waterSource || '') : '',
      road,
    });
    setSaving(false);

    if (result.error) {
      // Show the actual error during development so we can fix what's wrong
      const err = result.error === 'not_signed_in'
        ? t(lang, 'must_signin')
        : `${t(lang, 'save_failed')}\n\n${result.error}`;
      Alert.alert(t(lang, 'app_title'), err);
      return;
    }
    Alert.alert(t(lang, 'app_title'), t(lang, 'saved_ok'), [
      { text: 'OK', onPress: () => { onSaved(); onClose(); } },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={s.close}>✕</Text>
          </Pressable>
          <Text style={s.title}>{t(lang, 'fill_details')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Row label={`${t(lang, 'filter_area')}: ${fmtArea(area)}`}>
            <Text style={s.areaNote}>
              {coords.length} {coords.length === 1 ? 'point' : 'points'}
            </Text>
          </Row>

          <Field label={t(lang, 'field_district')}>
            <Chips
              options={DISTRICTS}
              value={district}
              onChange={setDistrict}
              renderLabel={d => t(lang, `d_${d}`) !== `d_${d}` ? t(lang, `d_${d}`) : d}
            />
          </Field>

          <Field label={t(lang, 'field_price')}>
            <View style={s.priceRow}>
              <TextInput
                style={[s.input, { flex: 1 }]}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.muted}
              />
              <Chips
                options={CURRENCIES}
                value={currency}
                onChange={setCurrency}
                renderLabel={c => c}
                compact
              />
            </View>
          </Field>

          <Field label={t(lang, 'field_phone')}>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+963 9XX XXX XXX"
              placeholderTextColor={colors.muted}
            />
          </Field>

          <Pressable
            onPress={() => setShowMore(v => !v)}
            style={s.moreToggle}
            hitSlop={6}
          >
            <Text style={s.moreToggleText}>
              {showMore ? t(lang, 'hide_options') : t(lang, 'more_options')}
              {'  '}
              <Text style={s.moreChevron}>{showMore ? '▴' : '▾'}</Text>
            </Text>
          </Pressable>

          {showMore && (
            <>
              <Field label={t(lang, 'field_use')}>
                <Chips
                  options={USES}
                  value={use}
                  onChange={setUse}
                  renderLabel={u => t(lang, `use_${u}`)}
                />
              </Field>

              <Field label={t(lang, 'field_utilities')}>
                <View style={s.utilsRow}>
                  <Toggle
                    label={t(lang, 'utility_electricity')}
                    value={electricity}
                    onChange={setElectricity}
                  />
                  <Toggle
                    label={t(lang, 'utility_water')}
                    value={water}
                    onChange={v => {
                      setWater(v);
                      if (!v) setWaterSource('');
                    }}
                  />
                  <Toggle
                    label={t(lang, 'utility_road')}
                    value={road}
                    onChange={setRoad}
                  />
                </View>
              </Field>

              {water && (
                <Field label={t(lang, 'field_water_source')}>
                  <View style={s.utilsRow}>
                    <Toggle
                      label={t(lang, 'water_city')}
                      value={waterSource === 'city'}
                      onChange={() => setWaterSource('city')}
                    />
                    <Toggle
                      label={t(lang, 'water_well')}
                      value={waterSource === 'well'}
                      onChange={() => setWaterSource('well')}
                    />
                  </View>
                </Field>
              )}

              <Field label={t(lang, 'field_description')}>
                <TextInput
                  style={[s.input, s.textarea]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  placeholder="..."
                  placeholderTextColor={colors.muted}
                  maxLength={500}
                />
                <Text style={s.charCount}>{description.length} / 500</Text>
              </Field>
            </>
          )}
        </ScrollView>

        <View style={s.footer}>
          <TouchableOpacity style={s.cta} onPress={submit} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.ctaText}>{t(lang, 'save')}</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Row({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Chips<T extends string>({
  options,
  value,
  onChange,
  renderLabel,
  compact,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  renderLabel: (v: T) => string;
  compact?: boolean;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 6 }}
    >
      {options.map(opt => {
        const selected = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[
              s.chip,
              compact && s.chipCompact,
              selected && s.chipOn,
            ]}
          >
            <Text style={[s.chipText, selected && s.chipTextOn]}>
              {renderLabel(opt)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
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
      style={[s.toggle, value && s.toggleOn]}
    >
      <Text style={[s.toggleText, value && s.toggleTextOn]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { color: colors.text, fontSize: 17, fontWeight: '700' },
  close: { color: colors.muted, fontSize: 22, padding: 4 },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, gap: spacing.lg },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowLabel: { color: colors.text, fontSize: 14, fontWeight: '600' },
  areaNote: { color: colors.muted, fontSize: 13 },

  field: { gap: 8 },
  fieldLabel: {
    color: colors.muted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  input: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  charCount: { color: colors.muted, fontSize: 11, textAlign: 'right' },

  priceRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },

  moreToggle: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  moreToggleText: {
    color: colors.brandSoft,
    fontSize: 13,
    fontWeight: '600',
  },
  moreChevron: {
    color: colors.brandSoft,
    fontSize: 14,
  },

  chip: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipCompact: { paddingHorizontal: 10, paddingVertical: 8 },
  chipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.muted, fontSize: 13 },
  chipTextOn: { color: '#fff', fontWeight: '700' },

  utilsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  toggle: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  toggleOn: { backgroundColor: colors.brandSoft, borderColor: colors.brandSoft },
  toggleText: { color: colors.muted, fontSize: 13 },
  toggleTextOn: { color: '#fff', fontWeight: '700' },

  footer: {
    padding: spacing.lg,
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
});
