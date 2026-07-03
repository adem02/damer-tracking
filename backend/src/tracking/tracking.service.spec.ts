import { Test, TestingModule } from '@nestjs/testing';
import { TrackingService } from './tracking.service';
import { ANALYSIS_ZONE } from './domain/zone.constant';
import {
  MACHINE_REPOSITORY,
  type MachineRepository,
} from './domain/machine.repository';
import type { Machine, Position } from './domain/tracking.types';

describe('TrackingService', () => {
  let service: TrackingService;
  let repository: jest.Mocked<MachineRepository>;

  beforeEach(async () => {
    const repositoryMock: jest.Mocked<MachineRepository> = {
      findAllWithLastPosition: jest.fn(),
      findTraceByPeriod: jest.fn(),
      findMachinesInZone: jest.fn(),
      getDistanceInZone: jest.fn(),
      saveMachine: jest.fn(),
      savePosition: jest.fn(),
      deleteAllPositions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingService,
        { provide: MACHINE_REPOSITORY, useValue: repositoryMock },
      ],
    }).compile();

    service = module.get<TrackingService>(TrackingService);
    repository = module.get(MACHINE_REPOSITORY);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMachinesWithLastPosition', () => {
    it('returns the machines provided by the repository', async () => {
      const machines: Machine[] = [
        { id: 'm1', name: 'Dameuse 1' },
        { id: 'm2', name: 'Dameuse 2' },
      ];
      repository.findAllWithLastPosition.mockResolvedValue(machines);

      const result = await service.getMachinesWithLastPosition();

      expect(result).toBe(machines);
      expect(repository.findAllWithLastPosition).toHaveBeenCalledTimes(1);
      expect(repository.findAllWithLastPosition).toHaveBeenCalledWith();
    });

    it('propagates repository errors', async () => {
      const error = new Error('db down');
      repository.findAllWithLastPosition.mockRejectedValue(error);

      await expect(service.getMachinesWithLastPosition()).rejects.toThrow(
        error,
      );
    });
  });

  describe('getMachineTrace', () => {
    it('delegates to the repository with machineId and period', async () => {
      const from = new Date('2026-07-01T00:00:00Z');
      const to = new Date('2026-07-02T00:00:00Z');
      const trace: Position[] = [
        {
          id: 'p1',
          machineId: 'm1',
          location: { lat: 44.93, lng: 6.54 },
          timestamp: from,
        },
      ];
      repository.findTraceByPeriod.mockResolvedValue(trace);

      const result = await service.getMachineTrace('m1', from, to);

      expect(result).toBe(trace);
      expect(repository.findTraceByPeriod).toHaveBeenCalledTimes(1);
      expect(repository.findTraceByPeriod).toHaveBeenCalledWith('m1', from, to);
    });
  });

  describe('getMachinesInZone', () => {
    it('queries the repository with the analysis zone', async () => {
      const machines: Machine[] = [{ id: 'm1', name: 'Dameuse 1' }];
      repository.findMachinesInZone.mockResolvedValue(machines);

      const result = await service.getMachinesInZone();

      expect(result).toBe(machines);
      expect(repository.findMachinesInZone).toHaveBeenCalledTimes(1);
      expect(repository.findMachinesInZone).toHaveBeenCalledWith(ANALYSIS_ZONE);
    });
  });

  describe('getMachineDistanceInZone', () => {
    it('returns the distance computed by the repository', async () => {
      repository.getDistanceInZone.mockResolvedValue(1234.5);

      const result = await service.getMachineDistanceInZone('m1');

      expect(result).toBe(1234.5);
      expect(repository.getDistanceInZone).toHaveBeenCalledTimes(1);
      expect(repository.getDistanceInZone).toHaveBeenCalledWith(
        'm1',
        ANALYSIS_ZONE,
      );
    });
  });
});
