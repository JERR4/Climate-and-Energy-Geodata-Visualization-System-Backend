import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { BBox } from '../common/bbox';
import { z } from 'zod';

type PointRow = { id: string; lat: number; lon: number; value: number };

const LineStringSchema = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(z.array(z.number())),
});

@Injectable()
export class DataService {
  private readonly maxPoints: number;

  constructor(private readonly db: DbService) {
    this.maxPoints = process.env.MAX_POINTS
      ? Number(process.env.MAX_POINTS)
      : 20000;
  }

  async getInsolation(bbox: BBox): Promise<PointRow[]> {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const q = `
      SELECT id::text AS id,
             ST_Y(geom)::float8 AS lat,
             ST_X(geom)::float8 AS lon,
             value::float8 AS value
      FROM insolation_points
      WHERE geom && ST_MakeEnvelope($1,$2,$3,$4,4326)
      LIMIT $5;
    `;
    const r = await this.db.query<PointRow>(q, [
      minLon,
      minLat,
      maxLon,
      maxLat,
      this.maxPoints,
    ]);
    return r.rows;
  }

  async getWind(bbox: BBox): Promise<PointRow[]> {
    const [minLon, minLat, maxLon, maxLat] = bbox;

    const q = `
      SELECT id::text AS id,
             ST_Y(geom)::float8 AS lat,
             ST_X(geom)::float8 AS lon,
             value::float8 AS value
      FROM wind_points
      WHERE geom && ST_MakeEnvelope($1,$2,$3,$4,4326)
      LIMIT $5;
    `;
    const r = await this.db.query<PointRow>(q, [
      minLon,
      minLat,
      maxLon,
      maxLat,
      this.maxPoints,
    ]);
    return r.rows;
  }

  async getGrids(bbox: BBox): Promise<number[][][]> {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const q = `
      SELECT ST_AsGeoJSON(geom) AS geojson
      FROM power_lines
      WHERE geom && ST_MakeEnvelope($1,$2,$3,$4,4326)
      LIMIT 5000;
    `;
    const r = await this.db.query<{ geojson: string }>(q, [
      minLon,
      minLat,
      maxLon,
      maxLat,
    ]);

    const lines: number[][][] = [];
    for (const row of r.rows) {
      const parsed = LineStringSchema.safeParse(JSON.parse(row.geojson));
      if (parsed.success) {
        lines.push(parsed.data.coordinates);
      }
    }
    return lines;
  }
}
