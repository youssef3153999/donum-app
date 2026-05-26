// Approximate centroids for Syrian governorates.
// Used to zoom the map when a user searches/selects a district.

export type DistrictKey =
  | 'damascus'
  | 'damascus_countryside'
  | 'aleppo'
  | 'homs'
  | 'hama'
  | 'latakia'
  | 'tartus'
  | 'idlib'
  | 'daraa'
  | 'deir_ezzor'
  | 'raqqa'
  | 'hasaka'
  | 'qamishli'
  | 'sweida'
  | 'quneitra';

export const DISTRICT_KEYS: DistrictKey[] = [
  'damascus',
  'damascus_countryside',
  'aleppo',
  'homs',
  'hama',
  'latakia',
  'tartus',
  'idlib',
  'daraa',
  'deir_ezzor',
  'raqqa',
  'hasaka',
  'qamishli',
  'sweida',
  'quneitra',
];

export const DISTRICT_COORDS: Record<
  DistrictKey,
  { lat: number; lng: number; zoom: number }
> = {
  damascus:             { lat: 33.5138, lng: 36.2765, zoom: 11 },
  damascus_countryside: { lat: 33.4500, lng: 36.5500, zoom: 10 },
  aleppo:               { lat: 36.2021, lng: 37.1343, zoom: 10 },
  homs:                 { lat: 34.7324, lng: 36.7137, zoom: 10 },
  hama:                 { lat: 35.1318, lng: 36.7578, zoom: 10 },
  latakia:              { lat: 35.5300, lng: 35.7900, zoom: 10 },
  tartus:               { lat: 34.8950, lng: 35.8867, zoom: 10 },
  idlib:                { lat: 35.9333, lng: 36.6333, zoom: 10 },
  daraa:                { lat: 32.6189, lng: 36.1019, zoom: 10 },
  deir_ezzor:           { lat: 35.3360, lng: 40.1408, zoom: 9 },
  raqqa:                { lat: 35.9528, lng: 39.0079, zoom: 9 },
  hasaka:               { lat: 36.5000, lng: 40.7500, zoom: 9 },
  qamishli:             { lat: 37.0522, lng: 41.2310, zoom: 11 },
  sweida:               { lat: 32.7100, lng: 36.5700, zoom: 10 },
  quneitra:             { lat: 33.1252, lng: 35.8244, zoom: 11 },
};

/**
 * Search a district by free-text query (matches Arabic, German, or English
 * label). Returns the first matching district key, or null.
 */
export function findDistrict(
  query: string,
  labelsByKey: (k: DistrictKey) => string[],
): DistrictKey | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  for (const k of DISTRICT_KEYS) {
    const labels = labelsByKey(k).map(l => l.toLowerCase());
    if (labels.some(l => l.includes(q) || q.includes(l))) {
      return k;
    }
  }
  return null;
}
