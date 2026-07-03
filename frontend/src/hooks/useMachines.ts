import { useCallback, useEffect, useRef, useState } from 'react';
import { api, fetchSpatialMetrics } from '../api';
import type {
  ApiMachine,
  LivePosition,
  MachineState,
  SpatialMetrics,
} from '../types';

const EMPTY_METRICS: SpatialMetrics = {
  machinesInZone: [],
  distancesInZone: {},
};

const METRICS_REFRESH_EVERY = 5;

function toWaitingState(machine: ApiMachine): MachineState {
  return {
    id: machine.id,
    name: machine.name,
    status: 'waiting',
    current: null,
    trace: [],
    lastTimestamp: null,
  };
}

export function useMachines() {
  const [machines, setMachines] = useState<Map<string, MachineState>>(
    () => new Map(),
  );
  const [metrics, setMetrics] = useState<SpatialMetrics>(EMPTY_METRICS);

  const [order, setOrder] = useState<string[]>([]);
  const orderRef = useRef<string[]>([]);
  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  const positionCount = useRef(0);

  const loadMachines = useCallback(async () => {
    const list = await api.getMachines();
    setOrder(list.map((machine) => machine.id));
    setMachines(new Map(list.map((m) => [m.id, toWaitingState(m)])));
  }, []);

  const refreshMetrics = useCallback(async () => {
    const ids = orderRef.current;
    if (ids.length === 0) {
      return;
    }
    setMetrics(await fetchSpatialMetrics(ids));
  }, []);

  const applyPosition = useCallback(
    (position: LivePosition) => {
      setMachines((previous) => {
        const machine = previous.get(position.machineId);
        if (!machine) {
          return previous;
        }

        const point = { lat: position.lat, lng: position.lng };
        const next = new Map(previous);
        next.set(position.machineId, {
          ...machine,
          status: 'active',
          current: point,
          trace: [...machine.trace, point],
          lastTimestamp: position.timestamp,
        });
        return next;
      });

      positionCount.current += 1;
      if (positionCount.current % METRICS_REFRESH_EVERY === 0) {
        void refreshMetrics();
      }
    },
    [refreshMetrics],
  );

  const reset = useCallback(() => {
    positionCount.current = 0;
    setMetrics(EMPTY_METRICS);
    setMachines((previous) => {
      const next = new Map<string, MachineState>();
      for (const machine of previous.values()) {
        next.set(machine.id, {
          ...machine,
          status: 'waiting',
          current: null,
          trace: [],
          lastTimestamp: null,
        });
      }
      return next;
    });
  }, []);

  const orderedMachines = order
    .map((id) => machines.get(id))
    .filter((m): m is MachineState => m !== undefined);

  return {
    machines: orderedMachines,
    metrics,
    loadMachines,
    applyPosition,
    refreshMetrics,
    reset,
  };
}
