import { Module } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { MachinesModule } from '../machines/machines.module';

@Module({
  imports: [MachinesModule],
  controllers: [TrackingController],
  providers: [TrackingService],
})
export class TrackingModule {}
