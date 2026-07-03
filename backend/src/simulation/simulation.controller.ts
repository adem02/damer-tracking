import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SimulationService } from './simulation.service';

@ApiTags('simulation')
@Controller('simulation')
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Post('start')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Démarrer la simulation (rejoue les traces GPS)' })
  start(): void {
    this.simulationService.start();
  }

  @Post('reset')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Réinitialiser la simulation et effacer l’historique',
  })
  reset(): Promise<void> {
    return this.simulationService.reset();
  }
}
