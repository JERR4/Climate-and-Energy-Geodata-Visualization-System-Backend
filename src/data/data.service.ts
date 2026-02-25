import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { BBox, zoomToCellSize } from '../common/bbox';
import { z } from 'zod';

type PointRow = { id: string; lat: number; lon: number; value: number };

const LineStringSchema = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(z.array(z.number())),
});

@Injectable()
export class DataService {
  constructor(private readonly db: DbService) {}

  async getInsolation(bbox: BBox, zoom: number): Promise<PointRow[]> {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const cellSize = zoomToCellSize(zoom);

    const q = `
      WITH snapped AS (
        SELECT ST_SnapToGrid(geom, $5) AS p, value::float8 AS value
        FROM insolation_points
        WHERE geom && ST_MakeEnvelope($1,$2,$3,$4,4326)
      )
      SELECT
        (row_number() OVER())::text AS id,
        ROUND(ST_Y(p)::numeric, 6)::float8 AS lat,
        ROUND(ST_X(p)::numeric, 6)::float8 AS lon,
        avg(value)::float8 AS value
      FROM snapped
      GROUP BY p;
    `;
    const r = await this.db.query<PointRow>(q, [
      minLon,
      minLat,
      maxLon,
      maxLat,
      cellSize,
    ]);
    return r.rows;
  }

  async getWind(bbox: BBox, zoom: number): Promise<PointRow[]> {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const cellSize = zoomToCellSize(zoom);

    const q = `
      WITH snapped AS (
        SELECT ST_SnapToGrid(geom, $5) AS p, value::float8 AS value
        FROM wind_points
        WHERE geom && ST_MakeEnvelope($1,$2,$3,$4,4326)
      )
      SELECT
        (row_number() OVER())::text AS id,
        ROUND(ST_Y(p)::numeric, 6)::float8 AS lat,
        ROUND(ST_X(p)::numeric, 6)::float8 AS lon,
        avg(value)::float8 AS value
      FROM snapped
      GROUP BY p;
    `;
    const r = await this.db.query<PointRow>(q, [
      minLon,
      minLat,
      maxLon,
      maxLat,
      cellSize,
    ]);
    return r.rows;
  }

  async getGrids(bbox: BBox): Promise<number[][][]> {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const q = `
      SELECT ST_AsGeoJSON(ST_Intersection(geom, ST_MakeEnvelope($1,$2,$3,$4,4326))) AS geojson
      FROM power_lines
      WHERE geom && ST_MakeEnvelope($1,$2,$3,$4,4326)
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
        if (parsed.data.coordinates.length > 1) {
          lines.push(parsed.data.coordinates);
        }
      }
    }
    return lines;
  }
}
