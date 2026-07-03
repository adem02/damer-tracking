import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, MachineRepositoryMock } from './test-app';

describe('Tracking routes (e2e)', () => {
  let app: INestApplication<App>;
  let repository: MachineRepositoryMock;

  beforeEach(async () => {
    const context = await createTestApp();
    app = context.app;
    repository = context.repository;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /machines', () => {
    it('returns each machine with its mapped last position', async () => {
      repository.findAllWithLastPosition.mockResolvedValue([
        {
          id: 'alpha',
          name: 'Dameuse Alpha',
          positions: [
            {
              id: 'p1',
              machineId: 'alpha',
              location: { lat: 44.932, lng: 6.551 },
              timestamp: new Date('2026-01-15T09:00:00.000Z'),
            },
          ],
        },
        { id: 'bravo', name: 'Dameuse Bravo' },
      ]);

      const response = await request(app.getHttpServer())
        .get('/machines')
        .expect(200);

      expect(response.body).toEqual([
        {
          id: 'alpha',
          name: 'Dameuse Alpha',
          lastPosition: {
            lat: 44.932,
            lng: 6.551,
            timestamp: '2026-01-15T09:00:00.000Z',
          },
        },
        { id: 'bravo', name: 'Dameuse Bravo', lastPosition: null },
      ]);
    });
  });

  describe('GET /machines/in-zone', () => {
    it('returns only the id and name of machines inside the zone', async () => {
      repository.findMachinesInZone.mockResolvedValue([
        {
          id: 'alpha',
          name: 'Dameuse Alpha',
          positions: [
            {
              id: 'p1',
              machineId: 'alpha',
              location: { lat: 44.932, lng: 6.551 },
              timestamp: new Date('2026-01-15T09:00:00.000Z'),
            },
          ],
        },
      ]);

      const response = await request(app.getHttpServer())
        .get('/machines/in-zone')
        .expect(200);

      expect(response.body).toEqual([{ id: 'alpha', name: 'Dameuse Alpha' }]);
    });
  });

  describe('GET /machines/:id/trace', () => {
    it('returns the trace points and forwards the parsed period', async () => {
      repository.findTraceByPeriod.mockResolvedValue([
        {
          id: 'p1',
          machineId: 'alpha',
          location: { lat: 44.932, lng: 6.551 },
          timestamp: new Date('2026-01-15T09:00:00.000Z'),
        },
        {
          id: 'p2',
          machineId: 'alpha',
          location: { lat: 44.933, lng: 6.552 },
          timestamp: new Date('2026-01-15T09:02:00.000Z'),
        },
      ]);

      const response = await request(app.getHttpServer())
        .get('/machines/alpha/trace')
        .query({
          from: '2026-01-15T09:00:00Z',
          to: '2026-01-15T09:22:00Z',
        })
        .expect(200);

      expect(response.body).toEqual([
        { lat: 44.932, lng: 6.551, timestamp: '2026-01-15T09:00:00.000Z' },
        { lat: 44.933, lng: 6.552, timestamp: '2026-01-15T09:02:00.000Z' },
      ]);
      expect(repository.findTraceByPeriod).toHaveBeenCalledWith(
        'alpha',
        new Date('2026-01-15T09:00:00Z'),
        new Date('2026-01-15T09:22:00Z'),
      );
    });

    it('rejects a missing period with 400', async () => {
      await request(app.getHttpServer())
        .get('/machines/alpha/trace')
        .expect(400);

      expect(repository.findTraceByPeriod).not.toHaveBeenCalled();
    });

    it('rejects a non ISO date with 400', async () => {
      await request(app.getHttpServer())
        .get('/machines/alpha/trace')
        .query({ from: 'not-a-date', to: '2026-01-15T09:22:00Z' })
        .expect(400);

      expect(repository.findTraceByPeriod).not.toHaveBeenCalled();
    });

    it('rejects a period where "to" is not after "from" with 400', async () => {
      await request(app.getHttpServer())
        .get('/machines/alpha/trace')
        .query({
          from: '2026-01-15T09:22:00Z',
          to: '2026-01-15T09:00:00Z',
        })
        .expect(400);

      expect(repository.findTraceByPeriod).not.toHaveBeenCalled();
    });

    it('rejects unknown query parameters with 400', async () => {
      await request(app.getHttpServer())
        .get('/machines/alpha/trace')
        .query({
          from: '2026-01-15T09:00:00Z',
          to: '2026-01-15T09:22:00Z',
          unexpected: 'value',
        })
        .expect(400);

      expect(repository.findTraceByPeriod).not.toHaveBeenCalled();
    });
  });

  describe('GET /machines/:id/distance-in-zone', () => {
    it('returns the machine id and the distance in meters', async () => {
      repository.getDistanceInZone.mockResolvedValue(1234.5);

      const response = await request(app.getHttpServer())
        .get('/machines/alpha/distance-in-zone')
        .expect(200);

      expect(response.body).toEqual({
        machineId: 'alpha',
        distanceMeters: 1234.5,
      });
    });
  });
});
