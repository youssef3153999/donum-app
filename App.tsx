import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import { t, type Lang } from '@/lib/i18n';
import MapScreen from '@/screens/MapScreen';
import MyPlotsScreen from '@/screens/MyPlotsScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import AuthScreen from '@/screens/AuthScreen';

const Tabs = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 6 }}>
      <Text style={{
        color: focused ? colors.brand : colors.muted,
        fontSize: 11,
        fontWeight: focused ? '700' : '500',
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function App() {
  const [lang, setLang] = useState<Lang>('ar');
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.muted }}>{t(lang, 'loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      {/* Translucent over the map so it can render edge-to-edge */}
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: colors.brand,
            background: colors.bg,
            card: colors.panel,
            text: colors.text,
            border: colors.border,
            notification: colors.brand,
          },
        }}
      >
        <Tabs.Navigator
          screenOptions={({ route }) => ({
            // Hide the navigation header on the Map screen so the map can be
            // truly edge-to-edge. Other tabs keep the standard header.
            headerShown: route.name !== 'Map',
            headerStyle: { backgroundColor: colors.panel },
            headerTitleStyle: { color: colors.text, fontWeight: '700' },
            headerTitleAlign: 'center',
            tabBarStyle: {
              backgroundColor: colors.panel,
              borderTopColor: colors.border,
              height: 56,
            },
            tabBarShowLabel: false,
          })}
        >
          <Tabs.Screen
            name="Map"
            options={{
              title: t(lang, 'app_title'),
              tabBarIcon: ({ focused }) => <TabIcon label={t(lang, 'tab_map')} focused={focused} />,
            }}
          >
            {() => <MapScreen lang={lang} />}
          </Tabs.Screen>

          <Tabs.Screen
            name="My"
            options={{
              title: t(lang, 'tab_my'),
              tabBarIcon: ({ focused }) => <TabIcon label={t(lang, 'tab_my')} focused={focused} />,
            }}
          >
            {() => session ? <MyPlotsScreen lang={lang} /> : <AuthScreen lang={lang} />}
          </Tabs.Screen>

          <Tabs.Screen
            name="Profile"
            options={{
              title: t(lang, 'tab_profile'),
              tabBarIcon: ({ focused }) => <TabIcon label={t(lang, 'tab_profile')} focused={focused} />,
            }}
          >
            {() => session
              ? <ProfileScreen lang={lang} onLangChange={setLang} />
              : <AuthScreen lang={lang} />
            }
          </Tabs.Screen>
        </Tabs.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
