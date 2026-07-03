import { Module } from '@nestjs/common';
import { MachinesModule } from '../machines/machines.module';
import { StreamingModule } from '../streaming/streaming.module';
import { SimulationController } from './simulation.controller';
import { SimulationService } from './simulation.service';

@Module({
  imports: [MachinesModule, StreamingModule],
  controllers: [SimulationController],
  providers: [SimulationService],
})
export class SimulationModule {}
