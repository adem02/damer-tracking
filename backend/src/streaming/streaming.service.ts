import { Inject, Injectable } from '@nestjs/common';
import {
  STREAMING_GATEWAY,
  type Position,
  type StreamingGateway,
} from './streaming.types';

@Injectable()
export class StreamingService {
  constructor(
    @Inject(STREAMING_GATEWAY)
    private readonly gateway: StreamingGateway,
  ) {}

  emitPosition(position: Position) {
    this.gateway.emitPosition(position);
  }

  notifySimulationFinished() {
    this.gateway.emitSimulationFinished();
  }
}
