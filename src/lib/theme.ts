// Slate × Coral palette — dark blue-gray base, vibrant coral accent,
// emerald success, large radii, floating-layer feel.
export const colors = {
  bg: '#20242E', // super dark blue-gray (slate) base
  panel: '#262C39', // headers / sheets / nav — one step lighter
  panel2: '#2C3340', // inner cards / inputs — lighter still
  border: '#39414F', // thin, soft slate separators
  text: '#FFFFFF', // crisp white headings
  muted: '#8E9AA7', // muted silver-slate secondary text
  brand: '#FF6B57', // vibrant coral — primary accent / FAB / active
  brandSoft: '#FF8472', // softer coral for prices / highlights
  accent: '#FF6B57', // focal coral (projection value, chart fill)
  danger: '#E5484D', // distinct red (kept apart from coral)
  ok: '#00E676', // emerald success
  warn: '#E0A03F',
};

export const radii = { sm: 8, md: 14, lg: 18, xl: 24, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export type Theme = typeof colors;
