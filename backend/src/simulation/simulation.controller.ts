import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SimulationService } from './simulation.service';

@Controller('simulation')
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Post('start')
  @HttpCode(HttpStatus.ACCEPTED)
  start(): void {
    this.simulationService.start();
  }

  @Post('reset')
  @HttpCode(HttpStatus.ACCEPTED)
  reset(): Promise<void> {
    return this.simulationService.reset();
  }
}
