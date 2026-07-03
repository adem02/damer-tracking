import { Machine, NewPosition, Position, GeoPolygon } from './machine.types';

export interface MachineRepository {
  findAllWithLastPosition(): Promise<Machine[]>;
  findTraceByPeriod(
    machineId: string,
    from: Date,
    to: Date,
  ): Promise<Position[]>;
  findMachinesInZone(zone: GeoPolygon): Promise<Machine[]>;
  getDistanceInZone(machineId: string, zone: GeoPolygon): Promise<number>;
  saveMachine(machine: { id: string; name: string }): Promise<void>;
  savePosition(position: NewPosition): Promise<void>;
  deleteAllPositions(): Promise<void>;
}

export const MACHINE_REPOSITORY = Symbol('MachineRepository');
