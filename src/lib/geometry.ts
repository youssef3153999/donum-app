// Geodesic helpers shared with the website. Keep these in sync with
// app/lib/geometry.ts on the web project.

const R = 6378137; // earth radius in meters

export type LatLng = [number, number]; // [lat, lng]

export function geodesicArea(coords: LatLng[]): number {
  if (!coords || coords.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const [lat1, lng1] = coords[i];
    const [lat2, lng2] = coords[(i + 1) % coords.length];
    area +=
      ((lng2 - lng1) * Math.PI) / 180 *
      (2 + Math.sin((lat1 * Math.PI) / 180) + Math.sin((lat2 * Math.PI) / 180));
  }
  return Math.abs((area * R * R) / 2);
}

export function fmtArea(m2: number): string {
  if (!Number.isFinite(m2) || m2 <= 0) return '0 m²';
  if (m2 >= 10000) return (m2 / 10000).toFixed(2) + ' ha';
  return Math.round(m2) + ' m²';
}

export function formatPrice(value: number, currency: string): string {
  const symbol =
    currency === 'USD' ? '$' :
    currency === 'EUR' ? '€' :
    currency === 'TRY' ? '₺' :
    currency === 'SYP' ? 'SYP' : currency;
  return `${Math.round(value)} ${symbol}`;
}

export function formatPriceCompact(value: number, currency: string): string {
  const symbol =
    currency === 'USD' ? '$' :
    currency === 'EUR' ? '€' :
    currency === 'TRY' ? '₺' : currency;
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M' + symbol;
  if (value >= 1_000) return Math.round(value / 1_000) + 'k' + symbol;
  return Math.round(value) + symbol;
}

export function centroid(coords: LatLng[]): LatLng {
  let lat = 0, lng = 0;
  coords.forEach(([a, b]) => { lat += a; lng += b; });
  return [lat / coords.length, lng / coords.length];
}
