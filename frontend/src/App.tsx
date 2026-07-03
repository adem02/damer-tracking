import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
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

  const [finished, setFinished] = useState(false);
  const [busy, setBusy] = useState(false);

  const onFinished = useCallback(() => {
    setFinished(true);
    void refreshMetrics();
  }, [refreshMetrics]);

  const connection = useRealtime({ onPosition: applyPosition, onFinished });

  useEffect(() => {
    void loadMachines();
  }, [loadMachines]);

  const handleStart = useCallback(async () => {
    setBusy(true);
    try {
      await api.startSimulation();
      setFinished(false);
    } finally {
      setBusy(false);
    }
  }, []);

  const handleReset = useCallback(async () => {
    setBusy(true);
    try {
      await api.resetSimulation();
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
