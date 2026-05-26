import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, radii, spacing } from '@/lib/theme';
import { t, type Lang } from '@/lib/i18n';
import { reportPlot, type ReportReason } from '@/data/plots';
import { supabase } from '@/lib/supabase';

type Props = {
  visible: boolean;
  plotId: string;
  lang: Lang;
  onClose: () => void;
};

const REASONS: { key: ReportReason; tKey: string }[] = [
  { key: 'spam', tKey: 'report_spam' },
  { key: 'fake', tKey: 'report_fake' },
  { key: 'inappropriate', tKey: 'report_inappropriate' },
  { key: 'already_sold', tKey: 'report_already_sold' },
  { key: 'wrong_info', tKey: 'report_wrong_info' },
  { key: 'other', tKey: 'report_other' },
];

export default function ReportSheet({
  visible,
  plotId,
  lang,
  onClose,
}: Props) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setReason(null);
    setNote('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (!reason) return;

    // Require sign in to prevent spam reports
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert(t(lang, 'app_title'), t(lang, 'report_signin_required'));
      return;
    }

    setSubmitting(true);
    const res = await reportPlot(plotId, reason, note);
    setSubmitting(false);

    if (!res.ok) {
      Alert.alert(
        t(lang, 'app_title'),
        `${t(lang, 'report_failed')}\n\n${res.error ?? ''}`,
      );
      return;
    }

    Alert.alert(t(lang, 'app_title'), t(lang, 'report_submitted'), [
      { text: 'OK', onPress: handleClose },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable style={s.backdrop} onPress={handleClose} />
      <KeyboardAvoidingView
        style={s.sheet}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.handle} />

        <View style={s.header}>
          <Text style={s.title}>{t(lang, 'report_listing')}</Text>
          <Pressable onPress={handleClose} hitSlop={10} style={s.closeBtn}>
            <Text style={s.closeText}>✕</Text>
          </Pressable>
        </View>

        <View style={s.body}>
          <Text style={s.sectionLabel}>{t(lang, 'report_reason')}</Text>
          <View style={s.reasonsCol}>
            {REASONS.map(r => {
              const selected = reason === r.key;
              return (
                <Pressable
                  key={r.key}
                  style={[s.reasonRow, selected && s.reasonRowOn]}
                  onPress={() => setReason(r.key)}
                >
                  <View style={[s.radio, selected && s.radioOn]}>
                    {selected && <View style={s.radioDot} />}
                  </View>
                  <Text style={[s.reasonText, selected && s.reasonTextOn]}>
                    {t(lang, r.tKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            style={s.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder={t(lang, 'report_note_placeholder')}
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={3}
            maxLength={300}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[s.cta, (!reason || submitting) && s.ctaDisabled]}
            onPress={submit}
            disabled={!reason || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.ctaText}>{t(lang, 'submit_report')}</Text>
            )}
          </TouchableOpacity>
        </View>
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
  title: { color: colors.text, fontSize: 17, fontWeight: '800' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.panel2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: colors.muted, fontSize: 14, fontWeight: '600' },

  body: { padding: spacing.lg, gap: spacing.md },

  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  reasonsCol: { gap: 6 },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.panel2,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  reasonRowOn: { borderColor: colors.brand, backgroundColor: 'rgba(184, 84, 50, 0.08)' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.brand },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand,
  },
  reasonText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '500' },
  reasonTextOn: { fontWeight: '700' },

  noteInput: {
    backgroundColor: colors.panel2,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    color: colors.text,
    padding: spacing.md,
    fontSize: 13,
    minHeight: 70,
  },

  cta: {
    backgroundColor: colors.danger,
    borderRadius: radii.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  ctaDisabled: { opacity: 0.5 },
});
