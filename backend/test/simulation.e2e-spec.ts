import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, MachineRepositoryMock } from './test-app';

describe('Simulation routes (e2e)', () => {
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

  describe('POST /simulation/start', () => {
    it('accepts the request and reports 202', async () => {
      await request(app.getHttpServer()).post('/simulation/start').expect(202);
    });
  });

  describe('POST /simulation/reset', () => {
    it('accepts the request, reports 202 and clears the positions', async () => {
      await request(app.getHttpServer()).post('/simulation/reset').expect(202);

      expect(repository.deleteAllPositions).toHaveBeenCalledTimes(1);
    });
  });
});
