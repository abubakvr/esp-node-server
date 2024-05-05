// Imports
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { MongoClient } = require("mongodb");

// Constants

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const mongoUrl =
  "mongodb+srv://sadeeqdev:seeman11@cluster0.ek6rkci.mongodb.net/egauge?retryWrites=true&w=majority";
const dbName = "egauge";
const collectionName = "values";
const client = new MongoClient(mongoUrl, { useUnifiedTopology: true });

// Define connections set
const connections = new Set();

// Functions

async function connectToDb() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

async function saveToMongoDB(data) {
  try {
    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    const formattedData = {
      batteryPower: parseFloat(data.batteryPower.toFixed(5)),
      panelPower: parseFloat(data.panelPower.toFixed(5)),
      batteryVoltage: parseFloat(data.batteryVoltage.toFixed(5)),
      panelVoltage: parseFloat(data.panelVoltage.toFixed(5)),
      temperature: parseFloat(data.temperature.toFixed(5)),
    };
    await collection.insertOne(formattedData);
  } catch (error) {
    console.error("Error saving data to MongoDB:", error);
    throw error;
  }
}

async function getLatestDataFromMongoDB(limit = 50) {
  try {
    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    const result = await collection
      .find()
      .sort({ _id: -1 })
      .limit(limit)
      .toArray();

    return result;
  } catch (error) {
    console.error("Error retrieving latest data from MongoDB:", error);
    throw error;
  }
}

// WebSocket Event Handlers

wss.on("connection", (ws) => {
  console.log("WebSocket connected");
  console.log(ws._socket.remoteAddress);
  connections.add(ws);

  ws.on("message", async (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      await saveToMongoDB(parsedMessage);
      broadcast(JSON.stringify(parsedMessage));
      ws.send("Hello from the server!");
    } catch (error) {
      console.error("Error handling WebSocket message:", error);
    }
  });

  ws.on("close", () => {
    console.log("WebSocket disconnected");
    connections.delete(ws);
  });
});

function broadcast(message) {
  for (const connection of connections) {
    connection.send(message);
  }
}

// Express Routes

app.get("/latest-data", async (req, res) => {
  try {
    const latestData = await getLatestDataFromMongoDB();
    res.json(latestData);
  } catch (error) {
    console.error("Error handling latest-data request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/", (req, res) => {
  res.send("Hello esp node server!");
});

// Server Setup

const PORT = process.env.PORT || 8080;

server.listen(PORT, async () => {
  try {
    await connectToDb();
    console.log(`Server listening on port ${PORT}`);
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
});
