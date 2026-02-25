import { Controller, Get, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { parseBBox, clampZoom } from '../common/bbox';
import { DataService } from './data.service';

const QuerySchema = z.object({
  bbox: z.string().min(3),
  zoom: z.coerce.number().optional(),
});

export type BBoxZoomQuery = z.infer<typeof QuerySchema>;

@Controller('/api')
export class DataController {
  constructor(private readonly data: DataService) {}

  @Get('/insolation')
  async insolation(
    @Query(new ZodValidationPipe(QuerySchema)) q: BBoxZoomQuery,
  ) {
    const bbox = parseBBox(q.bbox);
    const zoom = clampZoom(q.zoom);
    return await this.data.getInsolation(bbox, zoom ?? 6);
  }

  @Get('/wind')
  async wind(@Query(new ZodValidationPipe(QuerySchema)) q: BBoxZoomQuery) {
    const bbox = parseBBox(q.bbox);
    const zoom = clampZoom(q.zoom);
    return await this.data.getWind(bbox, zoom ?? 6);
  }

  @Get('/grids')
  async grids(
    @Query(new ZodValidationPipe(z.object({ bbox: z.string().min(3) })))
    q: BBoxZoomQuery,
  ) {
    const bbox = parseBBox(q.bbox);
    return await this.data.getGrids(bbox);
  }
}
