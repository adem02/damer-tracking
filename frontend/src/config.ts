const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const config = {
  apiUrl: API_URL,
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? API_URL,
};
