export type BBox = [number, number, number, number];

export function parseBBox(raw: string): BBox {
  const parts = raw.split(',').map((x) => Number(x.trim()));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(
      'Invalid bbox format. Expected "minLon,minLat,maxLon,maxLat"',
    );
  }
  const [minLon, minLat, maxLon, maxLat] = parts;

  if (minLon < -180 || maxLon > 180 || minLat < -90 || maxLat > 90) {
    throw new Error('bbox out of range');
  }
  if (minLon >= maxLon || minLat >= maxLat) {
    throw new Error('bbox must have min < max');
  }
  return [minLon, minLat, maxLon, maxLat];
}

export function clampZoom(z?: number): number | undefined {
  if (z === undefined) return undefined;
  if (!Number.isFinite(z)) return undefined;
  const zi = Math.floor(z);
  if (zi < 0) return 0;
  if (zi > 22) return 22;
  return zi;
}
