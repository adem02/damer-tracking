import { Module } from '@nestjs/common';
import { MACHINE_REPOSITORY } from './domain/machine.repository';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';

@Module({
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [MACHINE_REPOSITORY],
})
export class TrackingModule {}
