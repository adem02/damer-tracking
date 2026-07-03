import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type {
  Position,
  StreamingGateway as StreamingGatewayInterface,
} from './streaming.types';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class StreamingGateway implements StreamingGatewayInterface {
  @WebSocketServer()
  private readonly server!: Server;

  emitPosition(position: Position): void {
    this.server.emit('position', position);
  }

  emitSimulationFinished(): void {
    this.server.emit('simulation-finished');
  }
}
