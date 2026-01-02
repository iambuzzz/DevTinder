import { io } from "socket.io-client";
import { BASE_URL } from "./constants";

const createSocketConnection = () => {
  return io(BASE_URL, {
    withCredentials: true, // Cookies bhejne ke liye
    transports: ["websocket"], // Isse 'Bad Request' errors kam ho jati hain
  });
};

export default createSocketConnection;
