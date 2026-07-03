import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
import { config } from './config';
import { MachineMap } from './components/MachineMap';
import { Sidebar } from './components/Sidebar';
import { useMachines } from './hooks/useMachines';
import { useRealtime } from './hooks/useRealtime';
import './App.css';

function App() {
  const {
    machines,
    metrics,
    loadMachines,
    applyPosition,
    refreshMetrics,
    reset,
  } = useMachines();

  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [busy, setBusy] = useState(false);

  const onFinished = useCallback(() => {
    setRunning(false);
    setFinished(true);
    void refreshMetrics();
  }, [refreshMetrics]);

  const connection = useRealtime({ onPosition: applyPosition, onFinished });

  useEffect(() => {
    void loadMachines();
  }, [loadMachines]);

  const refreshRef = useRef(refreshMetrics);
  useEffect(() => {
    refreshRef.current = refreshMetrics;
  }, [refreshMetrics]);
  useEffect(() => {
    if (!running) {
      return;
    }
    const interval = setInterval(() => {
      void refreshRef.current();
    }, config.metricsRefreshMs);
    return () => clearInterval(interval);
  }, [running]);

  const handleStart = useCallback(async () => {
    setBusy(true);
    try {
      await api.startSimulation();
      setFinished(false);
      setRunning(true);
    } finally {
      setBusy(false);
    }
  }, []);

  const handleReset = useCallback(async () => {
    setBusy(true);
    try {
      await api.resetSimulation();
      setRunning(false);
      setFinished(false);
      reset();
    } finally {
      setBusy(false);
    }
  }, [reset]);

  return (
    <div className="layout">
      <Sidebar
        machines={machines}
        metrics={metrics}
        connection={connection}
        finished={finished}
        busy={busy}
        onStart={handleStart}
        onReset={handleReset}
      />
      <MachineMap machines={machines} />
    </div>
  );
}

export default App;
