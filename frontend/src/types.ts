export interface LatLng {
  lat: number;
  lng: number;
}

export interface LivePosition {
  machineId: string;
  lat: number;
  lng: number;
  timestamp: string;
}

export interface ApiLastPosition {
  lat: number;
  lng: number;
  timestamp: string;
}

export interface ApiMachine {
  id: string;
  name: string;
  lastPosition?: ApiLastPosition | null;
}

export interface ApiMachineSummary {
  id: string;
  name: string;
}

export interface ApiDistanceInZone {
  machineId: string;
  distanceMeters: number;
}

export type MachineStatus = 'waiting' | 'active';

export interface MachineState {
  id: string;
  name: string;
  status: MachineStatus;
  current: LatLng | null;
  trace: LatLng[];
  lastTimestamp: string | null;
}

export interface SpatialMetrics {
  machinesInZone: string[];
  distancesInZone: Record<string, number>;
}

export type ConnectionStatus = 'connected' | 'disconnected';
