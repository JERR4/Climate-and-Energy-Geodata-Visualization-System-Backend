import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: any) {
    const res = this.schema.safeParse(value);
    if (!res.success) {
      throw new BadRequestException(res.error.flatten());
    }
    return res.data;
  }
}
