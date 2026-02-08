import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { DataController } from './data.controller';
import { DataService } from './data.service';

@Module({
  imports: [DbModule],
  controllers: [DataController],
  providers: [DataService],
})
export class DataModule {}
