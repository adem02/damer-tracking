import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  MACHINE_REPOSITORY,
  type MachineRepository,
} from '../machines/domain/machine.repository';
import type { NewPosition } from '../machines/domain/machine.types';
import { StreamingService } from '../streaming/streaming.service';
import seedData from './elda_seed_dameuses.json';
import type { Seed } from './simulation.types';

const SEED: Seed = seedData;

const TICK_INTERVAL_MS = 2_000;
const SAVE_MAX_ATTEMPTS = 3;
const SAVE_RETRY_DELAY_MS = 200;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class SimulationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SimulationService.name);
  private readonly cursors = new Map<string, number>();
  private timer?: NodeJS.Timeout;

  constructor(
    @Inject(MACHINE_REPOSITORY)
    private readonly machineRepository: MachineRepository,
    private readonly streaming: StreamingService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.rewind();

    const existing = await this.machineRepository.findAllWithLastPosition();
    const existingIds = new Set(existing.map((machine) => machine.id));
    const missing = SEED.machines.filter(
      (machine) => !existingIds.has(machine.id),
    );

    for (const machine of missing) {
      await this.machineRepository.saveMachine({
        id: machine.id,
        name: machine.name,
      });
    }

    if (missing.length > 0) {
      const names = missing.map((machine) => machine.name).join(', ');
      this.logger.log(`${missing.length} dameuse(s) créée(s) : ${names}`);
    }
  }

  onModuleDestroy(): void {
    this.stop();
  }

  start(): void {
    if (this.timer) {
      return;
    }
    this.timer = setInterval(() => this.tick(), TICK_INTERVAL_MS);
    this.logger.log('Simulation démarrée');
  }

  async reset(): Promise<void> {
    this.stop();
    this.rewind();
    await this.machineRepository.deleteAllPositions();
    this.logger.log('Simulation réinitialisée');
  }

  private tick(): void {
    let moved = false;

    for (const machine of SEED.machines) {
      const cursor = this.cursors.get(machine.id) ?? 0;
      if (cursor >= machine.positions.length) {
        continue;
      }

      const point = machine.positions[cursor];

      this.streaming.emitPosition({
        machineId: machine.id,
        lat: point.lat,
        lng: point.lng,
        timestamp: point.timestamp,
      });

      void this.persistPosition({
        machineId: machine.id,
        lat: point.lat,
        lng: point.lng,
        timestamp: new Date(point.timestamp),
      });

      this.cursors.set(machine.id, cursor + 1);
      moved = true;
    }

    if (!moved) {
      this.finish();
    }
  }

  private finish(): void {
    this.stop();
    this.streaming.notifySimulationFinished();
    this.logger.log('Simulation terminée : toutes les traces sont épuisées');
  }

  private async persistPosition(position: NewPosition): Promise<void> {
    for (let attempt = 1; attempt <= SAVE_MAX_ATTEMPTS; attempt++) {
      try {
        await this.machineRepository.savePosition(position);
        return;
      } catch (error) {
        if (attempt < SAVE_MAX_ATTEMPTS) {
          await delay(SAVE_RETRY_DELAY_MS);
          continue;
        }

        this.logger.error(
          `Position perdue après ${SAVE_MAX_ATTEMPTS} tentatives : ${JSON.stringify(position)}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
  }

  private stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private rewind(): void {
    this.cursors.clear();
    for (const machine of SEED.machines) {
      this.cursors.set(machine.id, 0);
    }
  }
}
