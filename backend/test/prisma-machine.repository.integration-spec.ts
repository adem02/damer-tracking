import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { PrismaClient } from '../src/common/prisma/generated/client';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { PrismaMachineRepository } from '../src/machines/infrastructure/prisma-machine.repository';
import { ANALYSIS_ZONE } from '../src/tracking/domain/zone.constant';

const INSIDE_ZONE = { lat: 44.9325, lng: 6.545 };
const OUTSIDE_ZONE = { lat: 45.1, lng: 6.9 };

describe('PrismaMachineRepository (integration)', () => {
  let container: StartedPostgreSqlContainer;
  let client: PrismaClient;
  let repository: PrismaMachineRepository;

  beforeAll(async () => {
    container = await new PostgreSqlContainer(
      'postgis/postgis:17-3.5-alpine',
    ).start();

    const connectionString = container.getConnectionUri();

    execSync('yarn prisma migrate deploy', {
      cwd: join(__dirname, '..'),
      env: { ...process.env, DATABASE_URL: connectionString },
      stdio: 'ignore',
    });

    const adapter = new PrismaPg({ connectionString });
    client = new PrismaClient({ adapter });
    await client.$connect();

    repository = new PrismaMachineRepository(
      client as unknown as PrismaService,
    );
  });

  afterAll(async () => {
    await client?.$disconnect();
    await container?.stop();
  });

  afterEach(async () => {
    if (!client) {
      return;
    }
    await client.$executeRaw`DELETE FROM positions`;
    await client.$executeRaw`DELETE FROM machines`;
  });

  async function seedPosition(
    machineId: string,
    point: { lat: number; lng: number },
    timestamp: string,
  ): Promise<void> {
    await repository.savePosition({
      machineId,
      lat: point.lat,
      lng: point.lng,
      timestamp: new Date(timestamp),
    });
  }

  describe('saveMachine', () => {
    it('inserts a machine and upserts its name on conflict', async () => {
      await repository.saveMachine({ id: 'alpha', name: 'Dameuse Alpha' });
      await repository.saveMachine({ id: 'alpha', name: 'Alpha renommée' });

      const machines = await repository.findAllWithLastPosition();

      expect(machines).toEqual([{ id: 'alpha', name: 'Alpha renommée' }]);
    });
  });

  describe('findAllWithLastPosition', () => {
    it('returns machines with only their most recent position', async () => {
      await repository.saveMachine({ id: 'alpha', name: 'Dameuse Alpha' });
      await seedPosition('alpha', INSIDE_ZONE, '2026-01-15T09:00:00.000Z');
      await seedPosition(
        'alpha',
        { lat: 44.94, lng: 6.55 },
        '2026-01-15T09:10:00.000Z',
      );

      const machines = await repository.findAllWithLastPosition();

      expect(machines).toHaveLength(1);
      expect(machines[0].id).toBe('alpha');
      expect(machines[0].positions).toHaveLength(1);
      expect(machines[0].positions?.[0].timestamp.toISOString()).toBe(
        '2026-01-15T09:10:00.000Z',
      );
      expect(machines[0].positions?.[0].location).toEqual({
        lat: 44.94,
        lng: 6.55,
      });
    });

    it('returns a machine without positions when it has none', async () => {
      await repository.saveMachine({ id: 'bravo', name: 'Dameuse Bravo' });

      const machines = await repository.findAllWithLastPosition();

      expect(machines).toEqual([{ id: 'bravo', name: 'Dameuse Bravo' }]);
    });
  });

  describe('findTraceByPeriod', () => {
    it('returns ordered positions within the period only', async () => {
      await repository.saveMachine({ id: 'alpha', name: 'Dameuse Alpha' });
      await seedPosition('alpha', INSIDE_ZONE, '2026-01-15T08:59:00.000Z');
      await seedPosition('alpha', INSIDE_ZONE, '2026-01-15T09:05:00.000Z');
      await seedPosition('alpha', INSIDE_ZONE, '2026-01-15T09:01:00.000Z');
      await seedPosition('alpha', INSIDE_ZONE, '2026-01-15T09:30:00.000Z');

      const trace = await repository.findTraceByPeriod(
        'alpha',
        new Date('2026-01-15T09:00:00.000Z'),
        new Date('2026-01-15T09:10:00.000Z'),
      );

      expect(trace.map((position) => position.timestamp.toISOString())).toEqual(
        ['2026-01-15T09:01:00.000Z', '2026-01-15T09:05:00.000Z'],
      );
    });
  });

  describe('findMachinesInZone', () => {
    it('returns only machines whose last position is inside the zone', async () => {
      await repository.saveMachine({ id: 'alpha', name: 'Dameuse Alpha' });
      await repository.saveMachine({ id: 'charlie', name: 'Dameuse Charlie' });
      await seedPosition('alpha', INSIDE_ZONE, '2026-01-15T09:00:00.000Z');
      await seedPosition('charlie', OUTSIDE_ZONE, '2026-01-15T09:00:00.000Z');

      const machines = await repository.findMachinesInZone(ANALYSIS_ZONE);

      expect(machines.map((machine) => machine.id)).toEqual(['alpha']);
    });

    it('ignores machines that left the zone on their latest position', async () => {
      await repository.saveMachine({ id: 'alpha', name: 'Dameuse Alpha' });
      await seedPosition('alpha', INSIDE_ZONE, '2026-01-15T09:00:00.000Z');
      await seedPosition('alpha', OUTSIDE_ZONE, '2026-01-15T09:05:00.000Z');

      const machines = await repository.findMachinesInZone(ANALYSIS_ZONE);

      expect(machines).toHaveLength(0);
    });
  });

  describe('getDistanceInZone', () => {
    it('sums the distance travelled inside the zone in meters', async () => {
      await repository.saveMachine({ id: 'alpha', name: 'Dameuse Alpha' });
      await seedPosition(
        'alpha',
        { lat: 44.93, lng: 6.54 },
        '2026-01-15T09:00:00.000Z',
      );
      await seedPosition(
        'alpha',
        { lat: 44.93, lng: 6.55 },
        '2026-01-15T09:05:00.000Z',
      );

      const distance = await repository.getDistanceInZone(
        'alpha',
        ANALYSIS_ZONE,
      );

      expect(distance).toBeGreaterThan(700);
      expect(distance).toBeLessThan(900);
    });

    it('clips the trace at the zone boundary when the machine leaves', async () => {
      await repository.saveMachine({ id: 'alpha', name: 'Dameuse Alpha' });
      await seedPosition(
        'alpha',
        { lat: 44.9325, lng: 6.55 },
        '2026-01-15T09:00:00.000Z',
      );
      await seedPosition(
        'alpha',
        { lat: 44.9325, lng: 6.7 },
        '2026-01-15T09:05:00.000Z',
      );

      const distance = await repository.getDistanceInZone(
        'alpha',
        ANALYSIS_ZONE,
      );

      expect(distance).toBeGreaterThan(700);
      expect(distance).toBeLessThan(900);
    });

    it('returns 0 when the machine has no position in the zone', async () => {
      await repository.saveMachine({ id: 'charlie', name: 'Dameuse Charlie' });
      await seedPosition('charlie', OUTSIDE_ZONE, '2026-01-15T09:00:00.000Z');

      const distance = await repository.getDistanceInZone(
        'charlie',
        ANALYSIS_ZONE,
      );

      expect(distance).toBe(0);
    });
  });

  describe('deleteAllPositions', () => {
    it('removes every position but keeps the machines', async () => {
      await repository.saveMachine({ id: 'alpha', name: 'Dameuse Alpha' });
      await seedPosition('alpha', INSIDE_ZONE, '2026-01-15T09:00:00.000Z');

      await repository.deleteAllPositions();

      const machines = await repository.findAllWithLastPosition();
      expect(machines).toEqual([{ id: 'alpha', name: 'Dameuse Alpha' }]);
    });
  });
});
