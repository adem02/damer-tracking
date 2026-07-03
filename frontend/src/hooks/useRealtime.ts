import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { config } from '../config';
import type { ConnectionStatus, LivePosition } from '../types';

interface RealtimeHandlers {
  onPosition: (position: LivePosition) => void;
  onFinished: () => void;
}

export function useRealtime(handlers: RealtimeHandlers): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const socket: Socket = io(config.socketUrl, {
      transports: ['websocket'],
    });

    socket.on('connect', () => setStatus('connected'));
    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('position', (position: LivePosition) =>
      handlersRef.current.onPosition(position),
    );
    socket.on('simulation-finished', () => handlersRef.current.onFinished());

    return () => {
      socket.disconnect();
    };
  }, []);

  return status;
}
