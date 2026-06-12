import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { deleteMyAccount } from '@/data/plots';
import { colors, radii, spacing } from '@/lib/theme';
import { t, type Lang } from '@/lib/i18n';
import LegalScreen, { type LegalKind } from '@/screens/LegalScreen';

export default function ProfileScreen({
  lang,
  onLangChange,
}: {
  lang: Lang;
  onLangChange: (l: Lang) => void;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [legalOpen, setLegalOpen] = useState<LegalKind | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setUser(sess?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = () => {
    Alert.alert(t(lang, 'sign_out'), '?', [
      { text: t(lang, 'cancel'), style: 'cancel' },
      {
        text: t(lang, 'sign_out'),
        style: 'destructive',
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  };

  const openDelete = () => {
    setDeleteText('');
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    const res = await deleteMyAccount();
    setDeleting(false);
    if (!res.ok) {
      Alert.alert(
        t(lang, 'app_title'),
        `${t(lang, 'delete_account_failed')}\n\n${res.error ?? ''}`,
      );
      return;
    }
    setDeleteOpen(false);
    Alert.alert(t(lang, 'app_title'), t(lang, 'delete_account_success'));
    // onAuthStateChange will fire from signOut() and reset the UI
  };

  return (
    <View style={s.root}>
      {/* Email */}
      <View style={s.section}>
        <Text style={s.label}>{t(lang, 'email')}</Text>
        <Text style={s.value}>{user?.email ?? '—'}</Text>
      </View>

      {/* Language */}
      <View style={s.section}>
        <Text style={s.label}>Language</Text>
        <View style={s.langRow}>
          {(['ar', 'de', 'en'] as Lang[]).map(l => (
            <TouchableOpacity
              key={l}
              onPress={() => onLangChange(l)}
              style={[s.langBtn, lang === l && s.langBtnOn]}
            >
              <Text style={[s.langText, lang === l && s.langTextOn]}>
                {l === 'ar' ? 'العربية' : l === 'de' ? 'DE' : 'EN'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Legal section */}
      <View style={s.section}>
        <Text style={s.label}>{t(lang, 'legal')}</Text>
        <Pressable
          onPress={() => setLegalOpen('privacy')}
          style={s.legalRow}
        >
          <Text style={s.legalText}>{t(lang, 'privacy_policy')}</Text>
          <Text style={s.legalArrow}>›</Text>
        </Pressable>
        <View style={s.legalDivider} />
        <Pressable
          onPress={() => setLegalOpen('terms')}
          style={s.legalRow}
        >
          <Text style={s.legalText}>{t(lang, 'terms_of_service')}</Text>
          <Text style={s.legalArrow}>›</Text>
        </Pressable>
      </View>

      {user && (
        <>
          <TouchableOpacity style={s.signOut} onPress={signOut}>
            <Text style={s.signOutText}>{t(lang, 'sign_out')}</Text>
          </TouchableOpacity>

          {/* Delete account -- destructive, hidden away */}
          <TouchableOpacity style={s.deleteAcc} onPress={openDelete}>
            <Text style={s.deleteAccText}>{t(lang, 'delete_account')}</Text>
          </TouchableOpacity>
        </>
      )}

      {legalOpen && (
        <LegalScreen
          visible={!!legalOpen}
          kind={legalOpen}
          lang={lang}
          onClose={() => setLegalOpen(null)}
        />
      )}

      {/* Delete account confirmation modal */}
      <Modal
        visible={deleteOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !deleting && setDeleteOpen(false)}
      >
        <Pressable
          style={s.modalBackdrop}
          onPress={() => !deleting && setDeleteOpen(false)}
        />
        <View style={s.modalCard}>
          <Text style={s.modalIcon}>⚠</Text>
          <Text style={s.modalTitle}>{t(lang, 'delete_account')}</Text>
          <Text style={s.modalDesc}>{t(lang, 'delete_account_warning')}</Text>
          <Text style={s.modalDesc}>{t(lang, 'delete_account_confirm')}</Text>

          <Text style={s.modalHint}>{t(lang, 'delete_account_typed')}</Text>
          <TextInput
            style={s.modalInput}
            value={deleteText}
            onChangeText={setDeleteText}
            placeholder={t(lang, 'delete_account_word')}
            placeholderTextColor={colors.muted}
            autoCapitalize="characters"
            editable={!deleting}
          />

          <View style={s.modalActions}>
            <TouchableOpacity
              style={s.modalCancel}
              onPress={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              <Text style={s.modalCancelText}>{t(lang, 'cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                s.modalDelete,
                (deleteText !== t(lang, 'delete_account_word') || deleting) &&
                  s.modalDeleteDisabled,
              ]}
              onPress={confirmDelete}
              disabled={
                deleteText !== t(lang, 'delete_account_word') || deleting
              }
            >
              {deleting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.modalDeleteText}>
                  {t(lang, 'delete_account_btn')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  section: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionVerified: {
    borderColor: colors.ok,
    backgroundColor: 'rgba(63, 176, 124, 0.08)',
  },
  sectionNotVerified: {
    borderColor: colors.warn,
    backgroundColor: 'rgba(224, 160, 63, 0.06)',
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: { color: colors.text, fontSize: 15, fontWeight: '500' },

  verifyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  verifyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.panel2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyIcon: { fontSize: 18, fontWeight: '900', color: colors.text },
  verifyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  verifyDesc: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  verifyCta: {
    backgroundColor: colors.brand,
    borderRadius: radii.md,
    paddingVertical: 11,
    alignItems: 'center',
  },
  verifyCtaText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  legalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  legalText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  legalArrow: { color: colors.muted, fontSize: 18 },
  legalDivider: { height: 1, backgroundColor: colors.border },

  langRow: { flexDirection: 'row', gap: 8 },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.panel2,
    borderRadius: radii.md,
  },
  langBtnOn: { backgroundColor: colors.brand },
  langText: { color: colors.muted, fontSize: 13 },
  langTextOn: { color: '#fff', fontWeight: '700' },

  signOut: {
    marginTop: spacing.lg,
    backgroundColor: colors.danger,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signOutText: { color: '#fff', fontWeight: '700' },

  deleteAcc: { marginTop: spacing.md, paddingVertical: 10, alignItems: 'center' },
  deleteAccText: {
    color: colors.muted,
    fontSize: 12,
    textDecorationLine: 'underline',
  },

  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalCard: {
    position: 'absolute',
    top: '20%',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.panel,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.lg,
    elevation: 16,
  },
  modalIcon: { fontSize: 36, color: colors.danger, textAlign: 'center', marginBottom: 8 },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDesc: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalHint: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: colors.panel2,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: spacing.lg },
  modalCancel: {
    flex: 1,
    backgroundColor: colors.panel2,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  modalDelete: {
    flex: 1,
    backgroundColor: colors.danger,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalDeleteText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  modalDeleteDisabled: { opacity: 0.4 },
});
