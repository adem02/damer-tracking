import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { MACHINE_REPOSITORY } from '../src/machines/domain/machine.repository';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { STREAMING_GATEWAY } from '../src/streaming/streaming.types';

export interface MachineRepositoryMock {
  findAllWithLastPosition: jest.Mock;
  findTraceByPeriod: jest.Mock;
  findMachinesInZone: jest.Mock;
  getDistanceInZone: jest.Mock;
  saveMachine: jest.Mock;
  savePosition: jest.Mock;
  deleteAllPositions: jest.Mock;
}

export interface StreamingGatewayMock {
  emitPosition: jest.Mock;
  emitSimulationFinished: jest.Mock;
}

export interface TestContext {
  app: INestApplication<App>;
  repository: MachineRepositoryMock;
  gateway: StreamingGatewayMock;
}

function createMachineRepositoryMock(): MachineRepositoryMock {
  return {
    findAllWithLastPosition: jest.fn().mockResolvedValue([]),
    findTraceByPeriod: jest.fn().mockResolvedValue([]),
    findMachinesInZone: jest.fn().mockResolvedValue([]),
    getDistanceInZone: jest.fn().mockResolvedValue(0),
    saveMachine: jest.fn().mockResolvedValue(undefined),
    savePosition: jest.fn().mockResolvedValue(undefined),
    deleteAllPositions: jest.fn().mockResolvedValue(undefined),
  };
}

export async function createTestApp(): Promise<TestContext> {
  const repository = createMachineRepositoryMock();
  const gateway: StreamingGatewayMock = {
    emitPosition: jest.fn(),
    emitSimulationFinished: jest.fn(),
  };

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(MACHINE_REPOSITORY)
    .useValue(repository)
    .overrideProvider(STREAMING_GATEWAY)
    .useValue(gateway)
    .overrideProvider(PrismaService)
    .useValue({
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
    })
    .compile();

  const app = moduleRef.createNestApplication<INestApplication<App>>();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();

  return { app, repository, gateway };
}
