import { ApiProperty } from '@nestjs/swagger';
import type { Machine, Position } from '../machines/domain/machine.types';

export class LastPositionDto {
  @ApiProperty({ example: 44.932 })
  lat!: number;

  @ApiProperty({ example: 6.551 })
  lng!: number;

  @ApiProperty({ example: '2026-01-15T09:00:00.000Z' })
  timestamp!: Date;
}

export class MachineDto {
  @ApiProperty({ example: 'alpha' })
  id!: string;

  @ApiProperty({ example: 'Dameuse Alpha' })
  name!: string;

  @ApiProperty({ type: LastPositionDto, nullable: true })
  lastPosition!: LastPositionDto | null;

  static fromDomain(machine: Machine): MachineDto {
    const last = machine.positions?.[0];
    return {
      id: machine.id,
      name: machine.name,
      lastPosition: last
        ? {
            lat: last.location.lat,
            lng: last.location.lng,
            timestamp: last.timestamp,
          }
        : null,
    };
  }
}

export class MachineSummaryDto {
  @ApiProperty({ example: 'alpha' })
  id!: string;

  @ApiProperty({ example: 'Dameuse Alpha' })
  name!: string;

  static fromDomain(machine: Machine): MachineSummaryDto {
    return { id: machine.id, name: machine.name };
  }
}

export class TracePointDto {
  @ApiProperty({ example: 44.932 })
  lat!: number;

  @ApiProperty({ example: 6.551 })
  lng!: number;

  @ApiProperty({ example: '2026-01-15T09:00:00.000Z' })
  timestamp!: Date;

  static fromDomain(position: Position): TracePointDto {
    return {
      lat: position.location.lat,
      lng: position.location.lng,
      timestamp: position.timestamp,
    };
  }
}

export class DistanceInZoneDto {
  @ApiProperty({ example: 'alpha' })
  machineId!: string;

  @ApiProperty({
    description: 'Distance parcourue dans la zone, en mètres',
    example: 1234.5,
  })
  distanceMeters!: number;
}
