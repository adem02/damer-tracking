export interface Position {
  machineId: string;
  lat: number;
  lng: number;
  timestamp: string;
}

export interface StreamingGateway {
  emitPosition(position: Position): void;
  emitSimulationFinished(): void;
}

export const STREAMING_GATEWAY = Symbol('StreamingGateway');
