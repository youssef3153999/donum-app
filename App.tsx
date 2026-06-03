import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Svg, { Path } from 'react-native-svg';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import { t, type Lang } from '@/lib/i18n';
import MapScreen from '@/screens/MapScreen';
import MyPlotsScreen from '@/screens/MyPlotsScreen';
import FavoritesScreen from '@/screens/FavoritesScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import AuthScreen from '@/screens/AuthScreen';
import { Sentry, initSentry } from '@/lib/sentry';

// Initialise crash reporting as early as possible (before the app renders).
initSentry();

const Tabs = createBottomTabNavigator();

// Simple filled SVG glyphs (24×24) so we don't depend on an icon font being
// linked. Each tab passes its `name`; colour follows focus state.
type IconName = 'map' | 'plots' | 'heart' | 'profile';
const ICON_PATHS: Record<IconName, string> = {
  map: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z',
  plots: 'M12 2 2 7l10 5 10-5-10-5zM2 12l10 5 10-5M2 17l10 5 10-5',
  heart: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  profile: 'M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5.33 0-8 2.67-8 5v1h16v-1c0-2.33-2.67-5-8-5z',
};

function TabItem({ name, label, focused }: { name: IconName; label: string; focused: boolean }) {
  const color = focused ? colors.brand : colors.muted;
  // `map` and `plots` look right as outlines; `heart`/`profile` as fills.
  const stroked = name === 'map' || name === 'plots';
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 8, width: 64 }}>
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Path
          d={ICON_PATHS[name]}
          fill={stroked ? 'none' : color}
          stroke={stroked ? color : 'none'}
          strokeWidth={stroked ? 2 : 0}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
      <Text style={{
        marginTop: 3,
        color,
        fontSize: 11,
        fontWeight: focused ? '700' : '500',
      }}>
        {label}
      </Text>
    </View>
  );
}

function App() {
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
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <NavigationContainer
        theme={{
          dark: false,
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
          initialRouteName="Map"
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
              borderTopWidth: StyleSheet.hairlineWidth,
              height: 68,
              paddingBottom: 8,
              paddingTop: 4,
            },
            tabBarShowLabel: false,
          })}
        >
          {/* Order swapped: Profile (حسابي) now first, Map (الخريطة) last. */}
          <Tabs.Screen
            name="Profile"
            options={{
              title: t(lang, 'tab_profile'),
              tabBarIcon: ({ focused }) => <TabItem name="profile" label={t(lang, 'tab_profile')} focused={focused} />,
            }}
          >
            {() => session
              ? <ProfileScreen lang={lang} onLangChange={setLang} />
              : <AuthScreen lang={lang} />
            }
          </Tabs.Screen>

          <Tabs.Screen
            name="Favorites"
            options={{
              title: t(lang, 'tab_favorites'),
              tabBarIcon: ({ focused }) => <TabItem name="heart" label={t(lang, 'tab_favorites')} focused={focused} />,
            }}
          >
            {() => session ? <FavoritesScreen lang={lang} /> : <AuthScreen lang={lang} />}
          </Tabs.Screen>

          <Tabs.Screen
            name="My"
            options={{
              title: t(lang, 'tab_my'),
              tabBarIcon: ({ focused }) => <TabItem name="plots" label={t(lang, 'tab_my')} focused={focused} />,
            }}
          >
            {() => session ? <MyPlotsScreen lang={lang} /> : <AuthScreen lang={lang} />}
          </Tabs.Screen>

          <Tabs.Screen
            name="Map"
            options={{
              title: t(lang, 'app_title'),
              tabBarIcon: ({ focused }) => <TabItem name="map" label={t(lang, 'tab_map')} focused={focused} />,
            }}
          >
            {() => <MapScreen lang={lang} />}
          </Tabs.Screen>
        </Tabs.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});

// Wrap the root component so Sentry can capture render errors + touch events.
export default Sentry.wrap(App);
