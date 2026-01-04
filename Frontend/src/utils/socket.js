import { io } from "socket.io-client";
import { SOCKET_URL } from "./constants";

let socket = null;

const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionAttempts: 5, // Connection koshish jaari rakhe
      transports: ["websocket"],
    });
    console.log("🚀 New Socket Connection Created");
  }
  return socket;
};

export default getSocket;
