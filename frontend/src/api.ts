import { config } from './config';
import type {
  ApiDistanceInZone,
  ApiMachine,
  ApiMachineSummary,
  SpatialMetrics,
} from './types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${config.apiUrl}${path}`, init);
  if (!response.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${path} → ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function command(path: string): Promise<void> {
  const response = await fetch(`${config.apiUrl}${path}`, { method: 'POST' });
  if (!response.ok) {
    throw new Error(`POST ${path} → ${response.status}`);
  }
}

export const api = {
  getMachines(): Promise<ApiMachine[]> {
    return request<ApiMachine[]>('/machines');
  },

  getMachinesInZone(): Promise<ApiMachineSummary[]> {
    return request<ApiMachineSummary[]>('/machines/in-zone');
  },

  getDistanceInZone(machineId: string): Promise<number> {
    return request<ApiDistanceInZone>(
      `/machines/${machineId}/distance-in-zone`,
    ).then((result) => result.distanceMeters);
  },

  startSimulation(): Promise<void> {
    return command('/simulation/start');
  },

  resetSimulation(): Promise<void> {
    return command('/simulation/reset');
  },
};

export async function fetchSpatialMetrics(
  machineIds: string[],
): Promise<SpatialMetrics> {
  const [inZone, distances] = await Promise.all([
    api.getMachinesInZone(),
    Promise.all(
      machineIds.map(async (id) => ({
        id,
        distance: await api.getDistanceInZone(id),
      })),
    ),
  ]);

  return {
    machinesInZone: inZone.map((machine) => machine.id),
    distancesInZone: Object.fromEntries(
      distances.map(({ id, distance }) => [id, distance]),
    ),
  };
}
