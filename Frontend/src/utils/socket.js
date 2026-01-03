import { io } from "socket.io-client";
import { SOCKET_URL } from "./constants";

const createSocketConnection = () => {
  return io(SOCKET_URL, {
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000, // Cookies bhejne ke liye
    transports: ["websocket"], // Isse 'Bad Request' errors kam ho jati hain
  });
};

export default createSocketConnection;
