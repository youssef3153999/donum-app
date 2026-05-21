import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { colors, radii, spacing } from '@/lib/theme';
import { t, type Lang } from '@/lib/i18n';

export default function ProfileScreen({
  lang,
  onLangChange,
}: {
  lang: Lang;
  onLangChange: (l: Lang) => void;
}) {
  const [user, setUser] = useState<User | null>(null);

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
      { text: t(lang, 'sign_out'), style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  };

  return (
    <View style={s.root}>
      <View style={s.section}>
        <Text style={s.label}>{t(lang, 'email')}</Text>
        <Text style={s.value}>{user?.email ?? '—'}</Text>
      </View>

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
    borderColor: colors.border, borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  label: {
    color: colors.muted, fontSize: 11, marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  value: { color: colors.text, fontSize: 15, fontWeight: '500' },
  langRow: { flexDirection: 'row', gap: 8 },
  langBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
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
