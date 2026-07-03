import { Injectable, Inject } from '@nestjs/common';
import { ANALYSIS_ZONE } from './domain/zone.constant';
import type { Machine, Position } from '../machines/domain/machine.types';
import {
  MACHINE_REPOSITORY,
  type MachineRepository,
} from '../machines/domain/machine.repository';

@Injectable()
export class TrackingService {
  constructor(
    @Inject(MACHINE_REPOSITORY)
    private readonly machineRepository: MachineRepository,
  ) {}

  async getMachinesWithLastPosition(): Promise<Machine[]> {
    return this.machineRepository.findAllWithLastPosition();
  }

  async getMachineTrace(
    machineId: string,
    from: Date,
    to: Date,
  ): Promise<Position[]> {
    return this.machineRepository.findTraceByPeriod(machineId, from, to);
  }

  async getMachinesInZone(): Promise<Machine[]> {
    return this.machineRepository.findMachinesInZone(ANALYSIS_ZONE);
  }

  async getMachineDistanceInZone(machineId: string): Promise<number> {
    return this.machineRepository.getDistanceInZone(machineId, ANALYSIS_ZONE);
  }
}
