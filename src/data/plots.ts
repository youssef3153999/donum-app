import { supabase } from '@/lib/supabase';
import type { LatLng } from '@/lib/geometry';

export type Plot = {
  id: string;
  district: string;
  use: string;
  price: number;
  currency: string;
  electricity: boolean;
  water: boolean;
  road: boolean;
  water_source?: string | null;
  coords: LatLng[];
  area_m2?: number | null;
  phone?: string | null;
  title?: { ar?: string; de?: string; en?: string } | null;
  desc?: { ar?: string; de?: string; en?: string } | null;
  images?: string[] | null;
  owner_id?: string | null;
  status: 'active' | 'pending' | 'rejected' | 'sold' | 'hidden';
  rejection_reason?: string | null;
  admin_note?: string | null;
  view_count?: number;
  created_at?: string;
};

const COLS =
  'id,district,use,price,currency,electricity,water,road,water_source,coords,area_m2,phone,title_ar,title_de,title_en,desc_ar,desc_de,desc_en,images,owner_id,status,rejection_reason,admin_note,view_count,created_at';

const rowToPlot = (r: any): Plot => ({
  id: r.id,
  district: r.district,
  use: r.use,
  price: r.price,
  currency: r.currency,
  electricity: !!r.electricity,
  water: !!r.water,
  road: !!r.road,
  water_source: r.water_source,
  coords: r.coords ?? [],
  area_m2: r.area_m2,
  phone: r.phone,
  title: { ar: r.title_ar, de: r.title_de, en: r.title_en },
  desc: { ar: r.desc_ar, de: r.desc_de, en: r.desc_en },
  images: r.images ?? [],
  owner_id: r.owner_id,
  status: r.status,
  rejection_reason: r.rejection_reason,
  admin_note: r.admin_note,
  view_count: r.view_count ?? 0,
  created_at: r.created_at,
});

export async function fetchActivePlots(): Promise<Plot[]> {
  const { data, error } = await supabase
    .from('plots')
    .select(COLS)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('fetchActivePlots:', error.message);
    return [];
  }
  return (data ?? []).map(rowToPlot);
}

export async function fetchMyPlots(): Promise<Plot[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('plots')
    .select(COLS)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('fetchMyPlots:', error.message);
    return [];
  }
  return (data ?? []).map(rowToPlot);
}

export async function deletePlot(id: string): Promise<boolean> {
  const { error } = await supabase.from('plots').delete().eq('id', id);
  return !error;
}

export type NewPlot = {
  district: string;
  use: string;
  price: number;
  currency: string;
  coords: LatLng[];
  area_m2?: number;
  phone?: string;
  electricity?: boolean;
  water?: boolean;
  road?: boolean;
  water_source?: string;
  title?: { ar?: string; de?: string; en?: string };
  desc?: { ar?: string; de?: string; en?: string };
  images?: string[];
};

// Arabic district display name -- used to auto-generate a title when none is given
const DISTRICT_AR: Record<string, string> = {
  damascus: 'دمشق',
  damascus_countryside: 'ريف دمشق',
  aleppo: 'حلب',
  homs: 'حمص',
  hama: 'حماة',
  latakia: 'اللاذقية',
  tartus: 'طرطوس',
  idlib: 'إدلب',
  daraa: 'درعا',
  deir_ezzor: 'دير الزور',
  raqqa: 'الرقة',
  hasaka: 'الحسكة',
  qamishli: 'القامشلي',
  sweida: 'السويداء',
  quneitra: 'القنيطرة',
};

export async function createPlot(p: NewPlot): Promise<{ id?: string; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'not_signed_in' };

  // Auto-generate a sensible default title in each language so NOT NULL columns are happy
  const districtAr = DISTRICT_AR[p.district] ?? p.district;
  const defaultTitleAr = `أرض في ${districtAr}`;
  const defaultTitleEn = `Plot in ${p.district}`;
  const defaultTitleDe = `Grundstück in ${p.district}`;

  const row = {
    owner_id: user.id,
    district: p.district,
    use: p.use,
    price: p.price,
    currency: p.currency,
    coords: p.coords,
    area_m2: p.area_m2,
    phone: p.phone ?? '',
    electricity: !!p.electricity,
    water: !!p.water,
    road: !!p.road,
    // water_source in this schema is a boolean -- true if a water source exists
    // on the land (well/city). City vs well distinction is not stored separately yet.
    water_source: !!p.water_source || !!p.water,
    title_ar: p.title?.ar ?? defaultTitleAr,
    title_de: p.title?.de ?? defaultTitleDe,
    title_en: p.title?.en ?? defaultTitleEn,
    desc_ar: p.desc?.ar ?? '',
    desc_de: p.desc?.de ?? '',
    desc_en: p.desc?.en ?? '',
    images: p.images ?? [],
    status: 'pending',
  };
  const { data, error } = await supabase.from('plots').insert(row).select('id').single();
  if (error) {
    // Log the raw error so we can see what went wrong in Metro / dev logs
    console.warn('createPlot failed:', error.message, error.details, error.hint);
    return { error: error.message };
  }
  return { id: data?.id };
}
