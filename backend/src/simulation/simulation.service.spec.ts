import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SimulationService } from './simulation.service';
import {
  MACHINE_REPOSITORY,
  type MachineRepository,
} from '../machines/domain/machine.repository';
import { StreamingService } from '../streaming/streaming.service';
import seedData from './elda_seed_dameuses.json';
import type { Seed } from './simulation.types';

const SEED: Seed = seedData;
const MACHINE_COUNT = SEED.machines.length;
const TOTAL_POSITIONS = SEED.machines.reduce(
  (sum, machine) => sum + machine.positions.length,
  0,
);
const MAX_POSITIONS = Math.max(
  ...SEED.machines.map((machine) => machine.positions.length),
);

const TICK_MS = 2_000;
const SAVE_MAX_ATTEMPTS = 3;

describe('SimulationService', () => {
  let service: SimulationService;
  let repository: jest.Mocked<MachineRepository>;
  let streaming: {
    emitPosition: jest.Mock;
    notifySimulationFinished: jest.Mock;
  };
  let errorSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    const repositoryMock: jest.Mocked<MachineRepository> = {
      findAllWithLastPosition: jest.fn().mockResolvedValue([]),
      findTraceByPeriod: jest.fn(),
      findMachinesInZone: jest.fn(),
      getDistanceInZone: jest.fn(),
      saveMachine: jest.fn().mockResolvedValue(undefined),
      savePosition: jest.fn().mockResolvedValue(undefined),
      deleteAllPositions: jest.fn().mockResolvedValue(undefined),
    };

    streaming = {
      emitPosition: jest.fn(),
      notifySimulationFinished: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationService,
        { provide: MACHINE_REPOSITORY, useValue: repositoryMock },
        { provide: StreamingService, useValue: streaming },
      ],
    }).compile();

    service = module.get<SimulationService>(SimulationService);
    repository = module.get(MACHINE_REPOSITORY);
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('creates only the machines missing from the database', async () => {
      const [present, ...missing] = SEED.machines;
      repository.findAllWithLastPosition.mockResolvedValue([
        { id: present.id, name: present.name },
      ]);

      await service.onModuleInit();

      expect(repository.saveMachine).toHaveBeenCalledTimes(missing.length);
      expect(repository.saveMachine).not.toHaveBeenCalledWith(
        expect.objectContaining({ id: present.id }),
      );
    });

    it('creates nothing when every machine already exists', async () => {
      repository.findAllWithLastPosition.mockResolvedValue(
        SEED.machines.map((machine) => ({
          id: machine.id,
          name: machine.name,
        })),
      );

      await service.onModuleInit();

      expect(repository.saveMachine).not.toHaveBeenCalled();
    });
  });

  describe('start', () => {
    it('emits and persists one position per machine on each tick', async () => {
      jest.useFakeTimers();
      service.start();

      await jest.advanceTimersByTimeAsync(TICK_MS);

      expect(streaming.emitPosition).toHaveBeenCalledTimes(MACHINE_COUNT);
      expect(repository.savePosition).toHaveBeenCalledTimes(MACHINE_COUNT);
    });

    it('is idempotent: starting twice runs a single interval', async () => {
      jest.useFakeTimers();
      service.start();
      service.start();

      await jest.advanceTimersByTimeAsync(TICK_MS);

      expect(streaming.emitPosition).toHaveBeenCalledTimes(MACHINE_COUNT);
    });

    it('keeps emitting in real time even when persistence fails', async () => {
      jest.useFakeTimers();
      repository.savePosition.mockRejectedValue(new Error('db down'));
      service.start();

      await jest.advanceTimersByTimeAsync(TICK_MS);

      expect(streaming.emitPosition).toHaveBeenCalledTimes(MACHINE_COUNT);
    });

    it('notifies clients once and stops when all traces are exhausted', async () => {
      jest.useFakeTimers();
      service.start();

      // Une itération de plus que la trace la plus longue pour atteindre la fin.
      await jest.advanceTimersByTimeAsync(TICK_MS * (MAX_POSITIONS + 1));

      expect(streaming.emitPosition).toHaveBeenCalledTimes(TOTAL_POSITIONS);
      expect(streaming.notifySimulationFinished).toHaveBeenCalledTimes(1);
    });
  });

  describe('persistence retries', () => {
    it('retries a failed save and succeeds without logging an error', async () => {
      jest.useFakeTimers();
      // Le premier essai de chaque machine échoue, le suivant réussit.
      for (let i = 0; i < MACHINE_COUNT; i++) {
        repository.savePosition.mockRejectedValueOnce(new Error('flaky'));
      }
      service.start();

      await jest.advanceTimersByTimeAsync(TICK_MS + 1_000);

      expect(repository.savePosition).toHaveBeenCalledTimes(MACHINE_COUNT * 2);
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('logs the full position after exhausting all attempts', async () => {
      jest.useFakeTimers();
      repository.savePosition.mockRejectedValue(new Error('db down'));
      service.start();

      await jest.advanceTimersByTimeAsync(TICK_MS + 1_000);

      expect(repository.savePosition).toHaveBeenCalledTimes(
        MACHINE_COUNT * SAVE_MAX_ATTEMPTS,
      );
      expect(errorSpy).toHaveBeenCalledTimes(MACHINE_COUNT);
    });
  });

  describe('reset', () => {
    it('stops ticking and clears the history', async () => {
      jest.useFakeTimers();
      service.start();
      await jest.advanceTimersByTimeAsync(TICK_MS);
      const emitsBeforeReset = streaming.emitPosition.mock.calls.length;

      await service.reset();

      expect(repository.deleteAllPositions).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(TICK_MS * 3);
      expect(streaming.emitPosition).toHaveBeenCalledTimes(emitsBeforeReset);
    });
  });
});
