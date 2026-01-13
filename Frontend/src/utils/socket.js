import { io } from "socket.io-client";
import { SOCKET_URL } from "./constants";

let socket = null;

const getSocket = () => {
  if (socket && socket.connected) {
    return socket;
  }
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      reconnection: true, // Reconnect allow karo
      reconnectionAttempts: 5, // Max 5 attempts
      reconnectionDelay: 1000, // 1 second ka gap
      transports: ["websocket"], // Sirf websocket use karo (faster)
    });
  } else {
    // Agar socket object hai par connected nahi hai, to connect karo
    socket.connect();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    if (socket.connected) {
      socket.disconnect();
    }
    socket = null; // Instance ko null kar do taaki naya fresh connection bane next time
  }
};

export default getSocket;
