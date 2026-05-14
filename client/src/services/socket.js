import { io } from 'socket.io-client';

let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || '/', {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }

  return socket;
};

export const connectSocket = () => {
  const activeSocket = getSocket();
  if (!activeSocket.connected) activeSocket.connect();
  return activeSocket;
};

export const disconnectSocket = () => {
  if (socket?.connected) socket.disconnect();
};
