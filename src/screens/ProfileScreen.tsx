import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { fetchMyProfile, type Profile } from '@/data/plots';
import { colors, radii, spacing } from '@/lib/theme';
import { t, type Lang } from '@/lib/i18n';

// WhatsApp number for verification requests (set to admin/owner number)
const VERIFY_WHATSAPP = '963999999999';

export default function ProfileScreen({
  lang,
  onLangChange,
}: {
  lang: Lang;
  onLangChange: (l: Lang) => void;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async () => {
    const p = await fetchMyProfile();
    setProfile(p);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (data.user) loadProfile();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setUser(sess?.user ?? null);
      if (sess?.user) loadProfile();
      else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

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

  const requestVerification = () => {
    const msg = encodeURIComponent(
      `${t(lang, 'how_to_verify')}\n${t(lang, 'email')}: ${user?.email ?? ''}`,
    );
    const url = `whatsapp://send?phone=${VERIFY_WHATSAPP}&text=${msg}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) Linking.openURL(url);
      else Linking.openURL(`https://wa.me/${VERIFY_WHATSAPP}?text=${msg}`);
    });
  };

  return (
    <View style={s.root}>
      {/* Email */}
      <View style={s.section}>
        <Text style={s.label}>{t(lang, 'email')}</Text>
        <Text style={s.value}>{user?.email ?? '—'}</Text>
      </View>

      {/* Verification status */}
      {user && profile && (
        <View
          style={[
            s.section,
            profile.is_verified ? s.sectionVerified : s.sectionNotVerified,
          ]}
        >
          <View style={s.verifyHeader}>
            <View style={s.verifyIconBox}>
              <Text style={s.verifyIcon}>
                {profile.is_verified ? '✓' : '!'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.verifyTitle}>
                {profile.is_verified
                  ? t(lang, 'verified_seller')
                  : t(lang, 'not_verified')}
              </Text>
              {!profile.is_verified && (
                <Text style={s.verifyDesc}>{t(lang, 'verify_info')}</Text>
              )}
            </View>
          </View>
          {!profile.is_verified && (
            <TouchableOpacity
              style={s.verifyCta}
              onPress={requestVerification}
            >
              <Text style={s.verifyCtaText}>
                {t(lang, 'contact_to_verify')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

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

      {user && (
        <TouchableOpacity style={s.signOut} onPress={signOut}>
          <Text style={s.signOutText}>{t(lang, 'sign_out')}</Text>
        </TouchableOpacity>
      )}
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
});
