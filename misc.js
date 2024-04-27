// const express = require("express");
// const http = require("http");
// const WebSocket = require("ws");

// const app = express();
// const server = http.createServer(app);
// const wss = new WebSocket.Server({ server });

// const frontendConnections = new Set();
// const backendConnections = new Set();

// wss.on("connection", (ws) => {
//   console.log("WebSocket connected");
//   console.log(ws._socket.remoteAddress);

//   // Example: Assuming frontend connections send a special "hello" message
//   ws.on("message", (message) => {
//     if (message === "hello from frontend") {
//       frontendConnections.add(ws);
//       console.log("Frontend connected");
//     } else {
//       backendConnections.add(ws);
//       console.log("Backend connected");
//     }
//   });

//   ws.on("close", () => {
//     console.log("WebSocket disconnected");

//     // Remove the disconnected connection from the appropriate set
//     if (frontendConnections.has(ws)) {
//       frontendConnections.delete(ws);
//       console.log("Frontend disconnected");
//     } else if (backendConnections.has(ws)) {
//       backendConnections.delete(ws);
//       console.log("Backend disconnected");
//     }
//   });
// });

// function broadcastToFrontend(message) {
//   // Iterate through all frontend connections and send the message
//   for (const frontendConnection of frontendConnections) {
//     frontendConnection.send(message);
//   }
// }

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

// const PORT = process.env.PORT || 8080;

// server.listen(PORT, () => {
//   console.log(`Server listening on port ${PORT}`);
// });
