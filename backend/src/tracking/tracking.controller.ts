import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { GetMachineTraceDto } from './tracking.dto';
import {
  DistanceInZoneDto,
  MachineDto,
  MachineSummaryDto,
  TracePointDto,
} from './tracking.response.dto';

@ApiTags('machines')
@Controller('machines')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les dameuses avec leur dernière position' })
  @ApiOkResponse({ type: MachineDto, isArray: true })
  async getMachinesWithLastPosition(): Promise<MachineDto[]> {
    const machines = await this.trackingService.getMachinesWithLastPosition();
    return machines.map((machine) => MachineDto.fromDomain(machine));
  }

  @Get('in-zone')
  @ApiOperation({
    summary: "Lister les dameuses actuellement dans la zone d'analyse",
  })
  @ApiOkResponse({ type: MachineSummaryDto, isArray: true })
  async getMachinesInZone(): Promise<MachineSummaryDto[]> {
    const machines = await this.trackingService.getMachinesInZone();
    return machines.map((machine) => MachineSummaryDto.fromDomain(machine));
  }

  @Get(':id/trace')
  @ApiOperation({
    summary: 'Récupérer la trace GPS d’une dameuse sur une période',
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant de la dameuse',
    example: 'alpha',
  })
  @ApiOkResponse({ type: TracePointDto, isArray: true })
  async getMachineTrace(
    @Param('id') id: string,
    @Query() query: GetMachineTraceDto,
  ): Promise<TracePointDto[]> {
    const trace = await this.trackingService.getMachineTrace(
      id,
      new Date(query.from),
      new Date(query.to),
    );
    return trace.map((position) => TracePointDto.fromDomain(position));
  }

  @Get(':id/distance-in-zone')
  @ApiOperation({
    summary: 'Distance parcourue par une dameuse dans la zone (mètres)',
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant de la dameuse',
    example: 'alpha',
  })
  @ApiOkResponse({ type: DistanceInZoneDto })
  async getMachineDistanceInZone(
    @Param('id') id: string,
  ): Promise<DistanceInZoneDto> {
    const distanceMeters =
      await this.trackingService.getMachineDistanceInZone(id);
    return { machineId: id, distanceMeters };
  }
}
