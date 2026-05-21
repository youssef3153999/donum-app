import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { colors, radii, spacing } from '@/lib/theme';
import { t, type Lang } from '@/lib/i18n';

type Mode = 'signin' | 'signup';

export default function AuthScreen({ lang }: { lang: Lang }) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password) {
      Alert.alert('!', t(lang, 'email') + ' / ' + t(lang, 'password'));
      return;
    }
    setBusy(true);
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('!', error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { phone } },
      });
      if (error) Alert.alert('!', error.message);
      else Alert.alert('!', 'Check your email for the verification link.');
    }
    setBusy(false);
  };

  const isSignup = mode === 'signup';

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.brand}>{t(lang, 'app_title')}</Text>
        <Text style={s.headline}>
          {isSignup ? t(lang, 'sign_up') : t(lang, 'sign_in')}
        </Text>

        <Text style={s.label}>{t(lang, 'email')}</Text>
        <TextInput
          style={s.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholderTextColor={colors.muted}
          placeholder="you@example.com"
        />

        <Text style={s.label}>{t(lang, 'password')}</Text>
        <TextInput
          style={s.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={colors.muted}
          placeholder="••••••••"
        />

        {isSignup && (
          <>
            <Text style={s.label}>{t(lang, 'phone')}</Text>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor={colors.muted}
              placeholder="+963 9XX XXX XXX"
            />
          </>
        )}

        <TouchableOpacity style={s.cta} onPress={submit} disabled={busy}>
          {busy
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.ctaText}>{isSignup ? t(lang, 'sign_up') : t(lang, 'sign_in')}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode(isSignup ? 'signin' : 'signup')}>
          <Text style={s.toggle}>
            {isSignup ? t(lang, 'sign_in') : t(lang, 'sign_up')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    padding: spacing.xl,
    paddingTop: spacing.xxl * 2,
  },
  brand: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  headline: {
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    fontSize: 14,
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  cta: {
    marginTop: spacing.xl,
    backgroundColor: colors.brand,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  toggle: {
    color: colors.brandSoft,
    textAlign: 'center',
    marginTop: spacing.xl,
    fontSize: 14,
  },
});
