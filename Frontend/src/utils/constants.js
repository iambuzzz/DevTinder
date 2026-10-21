const isLocal = window.location.hostname === "localhost";

// Axios/API calls ke liye (Isse baaki sab sahi chalta rahega)
/*
  // --- OLD CODE (Direct to single server) ---
  // export const BASE_URL = isLocal ? "http://localhost:3000/" : "/api/";
*/
// --- NEW CODE (Phase 3 - Through NGINX Load Balancer) ---
export const BASE_URL = isLocal ? "http://localhost:8080/" : "/api/";
// constants.js

//for ngrok use
// export const BASE_URL = "/api";

// Socket connection ke liye (Domain ke bina Socket namespace error deta hai)
/*
  // --- OLD CODE (Direct to single server) ---
  // export const SOCKET_URL = isLocal
  //   ? "http://localhost:3000/"
  //   : "https://iambuzzdev.in/";
*/
// --- NEW CODE (Phase 3 - Through NGINX Load Balancer) ---
export const SOCKET_URL = isLocal
  ? "http://localhost:8080/"
  : "https://devtinder.iambuzzdev.in/";

