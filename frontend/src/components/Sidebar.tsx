import { machineColor } from '../colors';
import type {
  ConnectionStatus,
  MachineState,
  SpatialMetrics,
} from '../types';

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

interface SidebarProps {
  machines: MachineState[];
  metrics: SpatialMetrics;
  connection: ConnectionStatus;
  finished: boolean;
  busy: boolean;
  onStart: () => void;
  onReset: () => void;
}

export function Sidebar({
  machines,
  metrics,
  connection,
  finished,
  busy,
  onStart,
  onReset,
}: SidebarProps) {
  const inZone = new Set(metrics.machinesInZone);

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <h1>Damer Tracking</h1>
        <span className={`connection connection--${connection}`}>
          {connection === 'connected' ? 'Connecté' : 'Déconnecté'}
        </span>
      </header>

      <div className="controls">
        <button onClick={onStart} disabled={busy}>
          Démarrer
        </button>
        <button onClick={onReset} disabled={busy} className="button--secondary">
          Réinitialiser
        </button>
      </div>

      {finished && (
        <p className="banner banner--finished">Simulation terminée</p>
      )}

      <section className="metrics">
        <h2>
          Machines dans la zone <span className="badge">{inZone.size}</span>
        </h2>
      </section>

      <section className="machines">
        <h2>Dameuses</h2>
        <ul className="machine-list">
          {machines.map((machine, index) => (
            <li key={machine.id} className="machine-row">
              <span
                className="machine-row__dot"
                style={{ backgroundColor: machineColor(index) }}
              />
              <span className="machine-row__name">{machine.name}</span>
              {machine.status === 'waiting' ? (
                <span className="tag tag--waiting">En attente</span>
              ) : (
                <>
                  {inZone.has(machine.id) && (
                    <span className="tag tag--in-zone">En zone</span>
                  )}
                  <span className="machine-row__distance">
                    {formatDistance(metrics.distancesInZone[machine.id] ?? 0)}
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
