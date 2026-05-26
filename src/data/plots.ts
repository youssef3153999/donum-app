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
  // Seller verification (joined from profiles table)
  owner_verified?: boolean;
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
  owner_verified: false, // populated in attachVerification
});

// Fetch the verification status for a set of owner ids and attach it to plots.
async function attachVerification(plots: Plot[]): Promise<Plot[]> {
  const ownerIds = Array.from(
    new Set(plots.map(p => p.owner_id).filter((x): x is string => !!x)),
  );
  if (ownerIds.length === 0) return plots;
  const { data, error } = await supabase
    .from('profiles')
    .select('id,is_verified')
    .in('id', ownerIds);
  if (error || !data) return plots;
  const verifiedSet = new Set(
    data.filter((p: any) => p.is_verified).map((p: any) => p.id as string),
  );
  return plots.map(p => ({
    ...p,
    owner_verified: p.owner_id ? verifiedSet.has(p.owner_id) : false,
  }));
}

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
  const plots = (data ?? []).map(rowToPlot);
  return attachVerification(plots);
}

// Fetch the current user's profile (verification status, etc.)
export type Profile = {
  id: string;
  is_verified: boolean;
  verified_at: string | null;
  full_name: string | null;
  phone: string | null;
};

export async function fetchMyProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id,is_verified,verified_at,full_name,phone')
    .eq('id', user.id)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    is_verified: !!data.is_verified,
    verified_at: data.verified_at ?? null,
    full_name: data.full_name ?? null,
    phone: data.phone ?? null,
  };
}

// Market statistics for the investment calculator
export type MarketStats = {
  count: number;          // number of comparable plots
  avgPricePerM2: number;  // average price per m² (in plot's currency)
  minPricePerM2: number;
  maxPricePerM2: number;
  currency: string;       // most common currency among samples
};

/**
 * Compute market stats for comparable plots in the same district + use.
 * Used as the "market average" for the investment calculator.
 * Returns null when there are fewer than 2 comparable plots (not enough data).
 */
export async function fetchMarketStats(
  district: string,
  use: string,
): Promise<MarketStats | null> {
  const { data, error } = await supabase
    .from('plots')
    .select('price,currency,area_m2,status')
    .eq('district', district)
    .eq('use', use)
    .in('status', ['active', 'sold']);
  if (error || !data) {
    console.warn('fetchMarketStats:', error?.message);
    return null;
  }

  // Compute price per m² for each row that has a valid area
  const samples = data
    .map((r: any) => {
      const area = Number(r.area_m2);
      const price = Number(r.price);
      if (!Number.isFinite(area) || area <= 0) return null;
      if (!Number.isFinite(price) || price <= 0) return null;
      return { ppm2: price / area, currency: String(r.currency || 'USD') };
    })
    .filter((x): x is { ppm2: number; currency: string } => !!x);

  if (samples.length < 2) return null;

  // Pick most common currency
  const currCount = new Map<string, number>();
  samples.forEach(s =>
    currCount.set(s.currency, (currCount.get(s.currency) ?? 0) + 1),
  );
  const currency = [...currCount.entries()].sort((a, b) => b[1] - a[1])[0][0];

  // Filter to that currency only so we don't mix USD with SYP
  const sameCurrency = samples.filter(s => s.currency === currency);
  const prices = sameCurrency.map(s => s.ppm2);

  const sum = prices.reduce((a, b) => a + b, 0);
  return {
    count: sameCurrency.length,
    avgPricePerM2: sum / prices.length,
    minPricePerM2: Math.min(...prices),
    maxPricePerM2: Math.max(...prices),
    currency,
  };
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

// Fields the owner can change. Coords/area can't be edited because they're
// drawn on the map -- to redraw, the user should delete and recreate.
export type UpdatePlotPayload = {
  district?: string;
  use?: string;
  price?: number;
  currency?: string;
  phone?: string;
  electricity?: boolean;
  water?: boolean;
  road?: boolean;
  water_source?: boolean | string;
  desc?: { ar?: string; de?: string; en?: string };
  images?: string[];
};

/**
 * Update an existing plot. The owner check is enforced by Supabase RLS.
 * After any meaningful change the status is reset to 'pending' so an admin
 * re-approves it -- this prevents bait-and-switch attacks where someone
 * publishes a clean listing then edits it to spam after approval.
 */
export async function updatePlot(
  id: string,
  p: UpdatePlotPayload,
): Promise<{ ok: boolean; error?: string }> {
  const row: Record<string, any> = {};
  if (p.district !== undefined) row.district = p.district;
  if (p.use !== undefined) row.use = p.use;
  if (p.price !== undefined) row.price = p.price;
  if (p.currency !== undefined) row.currency = p.currency;
  if (p.phone !== undefined) row.phone = p.phone;
  if (p.electricity !== undefined) row.electricity = !!p.electricity;
  if (p.water !== undefined) row.water = !!p.water;
  if (p.road !== undefined) row.road = !!p.road;
  if (p.water_source !== undefined) {
    // Column is boolean -- coerce string/true to boolean
    row.water_source = !!p.water_source;
  }
  if (p.desc) {
    if (p.desc.ar !== undefined) row.desc_ar = p.desc.ar;
    if (p.desc.de !== undefined) row.desc_de = p.desc.de;
    if (p.desc.en !== undefined) row.desc_en = p.desc.en;
  }
  if (p.images !== undefined) row.images = p.images;

  // Always reset status to pending after an edit
  row.status = 'pending';

  const { error } = await supabase.from('plots').update(row).eq('id', id);
  if (error) {
    console.warn('updatePlot failed:', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
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
    console.warn('createPlot failed:', error.message, error.details, error.hint);
    return { error: error.message };
  }
  return { id: data?.id };
}

// Profile shape returned to the app
export type Profile = {
  id: string;
  is_verified: boolean;
  verified_at: string | null;
  full_name: string | null;
  phone: string | null;
};

export async function fetchMyProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id,is_verified,verified_at,full_name,phone')
    .eq('id', user.id)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    is_verified: !!data.is_verified,
    verified_at: data.verified_at ?? null,
    full_name: data.full_name ?? null,
    phone: data.phone ?? null,
  };
}

// Market statistics for the investment calculator
export type MarketStats = {
  count: number;
  avgPricePerM2: number;
  minPricePerM2: number;
  maxPricePerM2: number;
  currency: string;
};

export async function fetchMarketStats(
  district: string,
  use: string,
): Promise<MarketStats | null> {
  const { data, error } = await supabase
    .from('plots')
    .select('price,currency,area_m2,status')
    .eq('district', district)
    .eq('use', use)
    .in('status', ['active', 'sold']);
  if (error || !data) {
    console.warn('fetchMarketStats:', error?.message);
    return null;
  }
  const samples = data
    .map((r: any) => {
      const area = Number(r.area_m2);
      const price = Number(r.price);
      if (!Number.isFinite(area) || area <= 0) return null;
      if (!Number.isFinite(price) || price <= 0) return null;
      return { ppm2: price / area, currency: String(r.currency || 'USD') };
    })
    .filter((x): x is { ppm2: number; currency: string } => !!x);

  if (samples.length < 2) return null;

  const currCount = new Map<string, number>();
  samples.forEach(s =>
    currCount.set(s.currency, (currCount.get(s.currency) ?? 0) + 1),
  );
  const currency = [...currCount.entries()].sort((a, b) => b[1] - a[1])[0][0];

  const sameCurrency = samples.filter(s => s.currency === currency);
  const prices = sameCurrency.map(s => s.ppm2);
  const sum = prices.reduce((a, b) => a + b, 0);
  return {
    count: sameCurrency.length,
    avgPricePerM2: sum / prices.length,
    minPricePerM2: Math.min(...prices),
    maxPricePerM2: Math.max(...prices),
    currency,
  };
}

// Update payload for editing an existing plot
export type UpdatePlotPayload = {
  district?: string;
  use?: string;
  price?: number;
  currency?: string;
  phone?: string;
  electricity?: boolean;
  water?: boolean;
  road?: boolean;
  water_source?: boolean | string;
  desc?: { ar?: string; de?: string; en?: string };
  images?: string[];
};

export async function updatePlot(
  id: string,
  p: UpdatePlotPayload,
): Promise<{ ok: boolean; error?: string }> {
  const row: Record<string, any> = {};
  if (p.district !== undefined) row.district = p.district;
  if (p.use !== undefined) row.use = p.use;
  if (p.price !== undefined) row.price = p.price;
  if (p.currency !== undefined) row.currency = p.currency;
  if (p.phone !== undefined) row.phone = p.phone;
  if (p.electricity !== undefined) row.electricity = !!p.electricity;
  if (p.water !== undefined) row.water = !!p.water;
  if (p.road !== undefined) row.road = !!p.road;
  if (p.water_source !== undefined) {
    row.water_source = !!p.water_source;
  }
  if (p.desc) {
    if (p.desc.ar !== undefined) row.desc_ar = p.desc.ar;
    if (p.desc.de !== undefined) row.desc_de = p.desc.de;
    if (p.desc.en !== undefined) row.desc_en = p.desc.en;
  }
  if (p.images !== undefined) row.images = p.images;

  // Reset status to pending after edit -- requires re-approval
  row.status = 'pending';

  const { error } = await supabase.from('plots').update(row).eq('id', id);
  if (error) {
    console.warn('updatePlot failed:', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
