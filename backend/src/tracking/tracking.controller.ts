import { Controller, Get, Param, Query } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { GetMachineTraceDto } from './tracking.dto';

@Controller('machines')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get()
  getMachinesWithLastPosition() {
    return this.trackingService.getMachinesWithLastPosition();
  }

  @Get('in-zone')
  getMachinesInZone() {
    return this.trackingService.getMachinesInZone();
  }

  @Get(':id/trace')
  getMachineTrace(@Param('id') id: string, @Query() query: GetMachineTraceDto) {
    return this.trackingService.getMachineTrace(
      id,
      new Date(query.from),
      new Date(query.to),
    );
  }

  @Get(':id/distance-in-zone')
  getMachineDistanceInZone(@Param('id') id: string) {
    return this.trackingService.getMachineDistanceInZone(id);
  }
}
