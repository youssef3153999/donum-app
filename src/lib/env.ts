// All env values are read here. In bare React Native we use a plain TS file
// that you populate at build time, or load from a .env via react-native-config
// later. For now, replace the placeholders with your real values.

export const SUPABASE_URL = 'https://gaijqhpxyrodxqcphjfe.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhaWpxaHB4eXJvZHhxY3BoamZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNTgxMzUsImV4cCI6MjA5MzczNDEzNX0._e90TjKyEspG3ZiF_2_BWx7SMqjWQnbsKv7ccoHl2Gs';
// Mapbox token removed -- we switched to Google Maps via react-native-maps.
// The Google Maps key lives in android/app/src/main/AndroidManifest.xml.

// Same backend as the website -- the app talks to the same Supabase project,
// so any plot created on the web shows up in the app and vice versa.
