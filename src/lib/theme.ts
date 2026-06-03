// Light × Coral palette — clean white surfaces, dark readable text,
// vibrant coral accent. Every screen reads from here, so flipping these
// values reskins the whole app automatically.
export const colors = {
  bg: '#F5F6F8', // soft off-white app background
  panel: '#FFFFFF', // headers / sheets / nav bar — pure white, pops on bg
  panel2: '#EEF0F3', // inner cards / inputs — faint gray
  border: '#E3E7EC', // thin, soft light separators
  text: '#1A1D23', // near-black headings / primary text
  muted: '#6B7480', // gray secondary text
  brand: '#FF6B57', // vibrant coral — primary accent / FAB / active
  brandSoft: '#FF8472', // softer coral for prices / highlights
  accent: '#FF6B57', // focal coral (projection value, chart fill)
  danger: '#E5484D', // distinct red
  ok: '#12B76A', // emerald success (darkened to read on white)
  warn: '#E0A03F',
};

export const radii = { sm: 8, md: 14, lg: 18, xl: 24, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export type Theme = typeof colors;
