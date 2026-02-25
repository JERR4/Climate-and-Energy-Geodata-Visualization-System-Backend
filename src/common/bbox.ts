export type BBox = [number, number, number, number];

const MAX_ZOOM = 15;
const MIN_ZOOM = 1.5;

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
  if (zi < MIN_ZOOM) return MIN_ZOOM;
  if (zi > MAX_ZOOM) return MAX_ZOOM;
  return zi;
}

export function zoomToCellSize(zoom: number) {
  if (zoom <= 2) return 0.5;
  if (zoom <= 4) return 0.25;
  if (zoom <= 6) return 0.1;
  if (zoom <= 8) return 0.05;
  if (zoom <= 11) return 0.01;
  return 0.0025;
}
