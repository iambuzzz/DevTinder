const isLocal = window.location.hostname === "localhost";

// Axios/API calls ke liye (Isse baaki sab sahi chalta rahega)
export const BASE_URL = isLocal ? "http://localhost:3000/" : "/api/";

// Socket connection ke liye (Domain ke bina Socket namespace error deta hai)
export const SOCKET_URL = isLocal
  ? "http://localhost:3000/"
  : "https://iambuzzdev.in/";
