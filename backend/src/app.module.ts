import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './common/config/configuration';
import { validate } from './common/config/env.validation';
import { PrismaModule } from './common/prisma/prisma.module';
import { MachinesModule } from './machines/machines.module';
import { TrackingModule } from './tracking/tracking.module';
import { StreamingModule } from './streaming/streaming.module';
import { SimulationModule } from './simulation/simulation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [configuration],
      validate,
    }),
    PrismaModule,
    MachinesModule,
    TrackingModule,
    StreamingModule,
    SimulationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
