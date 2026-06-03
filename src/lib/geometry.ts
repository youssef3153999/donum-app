// Geodesic helpers. Area uses @turf/area and distances use geolib's
// getDistance (industry-standard geodesic libs), per the measurement spec.
// NOTE: this intentionally diverges from the website's hand-rolled copy —
// keep that in mind if comparing app vs. web figures (difference is < 0.1%).
import turfArea from '@turf/area';
import { getDistance } from 'geolib';

const R = 6378137; // earth radius in meters (still used by some helpers)

export type LatLng = [number, number]; // [lat, lng]

// Polygon area in m², computed by Turf.js on a closed GeoJSON ring.
export function geodesicArea(coords: LatLng[]): number {
  if (!coords || coords.length < 3) return 0;
  // GeoJSON wants [lng, lat] and a ring whose first point repeats at the end.
  const ring = coords.map(([lat, lng]) => [lng, lat]);
  ring.push(ring[0]);
  return turfArea({ type: 'Polygon', coordinates: [ring] } as any);
}

export function fmtArea(m2: number): string {
  if (!Number.isFinite(m2) || m2 <= 0) return '0 m²';
  if (m2 >= 10000) return (m2 / 10000).toFixed(2) + ' ha';
  return Math.round(m2) + ' m²';
}

// Dunam ("دونم") is the common land unit in Syria/Levant: 1 dunam = 1000 m².
export const M2_PER_DONUM = 1000;

// Format an area as a dunam figure (unit label is added by the caller via
// i18n, since it differs per language).
export function fmtDonum(m2: number): string {
  if (!Number.isFinite(m2) || m2 <= 0) return '0';
  const d = m2 / M2_PER_DONUM;
  if (d >= 100) return Math.round(d).toString();
  if (d >= 10) return d.toFixed(1);
  return d.toFixed(2);
}

export function formatPrice(value: number, currency: string): string {
  const symbol =
    currency === 'USD' ? '$' :
    currency === 'EUR' ? '€' :
    currency === 'SYP' ? 'SYP' : currency;
  return `${Math.round(value)} ${symbol}`;
}

export function formatPriceCompact(value: number, currency: string): string {
  const symbol =
    currency === 'USD' ? '$' :
    currency === 'EUR' ? '€' : currency;
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M' + symbol;
  if (value >= 1_000) return Math.round(value / 1_000) + 'k' + symbol;
  return Math.round(value) + symbol;
}

export function centroid(coords: LatLng[]): LatLng {
  let lat = 0, lng = 0;
  coords.forEach(([a, b]) => { lat += a; lng += b; });
  return [lat / coords.length, lng / coords.length];
}

// Distance between two points, in meters, via geolib (0.01 m accuracy).
export function haversineMeters(a: LatLng, b: LatLng): number {
  return getDistance(
    { latitude: a[0], longitude: a[1] },
    { latitude: b[0], longitude: b[1] },
    0.01,
  );
}

// Total edge length. When `closed` and there are >= 3 points, includes the
// closing segment (last → first).
export function perimeter(coords: LatLng[], closed = true): number {
  if (!coords || coords.length < 2) return 0;
  let sum = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    sum += haversineMeters(coords[i], coords[i + 1]);
  }
  if (closed && coords.length >= 3) {
    sum += haversineMeters(coords[coords.length - 1], coords[0]);
  }
  return sum;
}

export function midpoint(a: LatLng, b: LatLng): LatLng {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

export function fmtLen(m: number): string {
  if (!Number.isFinite(m) || m <= 0) return '0 m';
  if (m >= 1000) return (m / 1000).toFixed(2) + ' km';
  return Math.round(m) + ' m';
}
