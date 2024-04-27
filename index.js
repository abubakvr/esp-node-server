const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { MongoClient } = require("mongodb");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const connections = new Set();

const mongoUrl = "mongodb://localhost:27017";
const dbName = "egauge";
const collectionName = "data";
const client = new MongoClient(mongoUrl, { useUnifiedTopology: true });

const connectToDb = async () => {
  await client.connect();
  console.log("Connected to MongoDB");
};

async function saveToMongoDB(data) {
  try {
    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    const formattedData = {
      sensor: data.sensor,
      voltage: parseFloat(data.voltage.toFixed(5)),
      current: parseFloat(data.current.toFixed(5)),
      power: parseFloat(data.power.toFixed(5)),
    };

    await collection.insertOne(formattedData);
    console.log("Data saved to MongoDB");
  } catch (error) {
    console.log(eror);
  }
}

async function getLatestDataFromMongoDB(limit = 50) {
  const client = new MongoClient(mongoUrl, { useUnifiedTopology: true });

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    const result = await collection
      .find()
      .sort({ _id: -1 })
      .limit(limit)
      .toArray();

    return result;
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

app.get("/latest-data", async (req, res) => {
  try {
    const latestData = await getLatestDataFromMongoDB();
    res.json(latestData);
  } catch (error) {
    console.error("Error retrieving latest data from MongoDB:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

wss.on("connection", (ws) => {
  console.log("WebSocket connected");
  console.log(ws._socket.remoteAddress);
  ws.on("message", async (message) => {
    if (Buffer.isBuffer(message)) {
      const messageString = message.toString("utf8");
      broadcast(messageString);
      await saveToMongoDB(JSON.parse(messageString));
      console.log("Received binary message from ESP32:", messageString);
    } else {
      console.log("Received message from ESP32:", message);
      broadcast(message);
      await saveToMongoDB(JSON.parse(message));
    }
    ws.send("Hello from the server!");
  });

  ws.on("close", () => {
    console.log("WebSocket disconnected");
  });
});

function broadcast(message) {
  for (const connection of connections) {
    connection.send(message);
  }
}

app.get("/", (req, res) => {
  res.send("Hello esp node server!");
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  connectToDb();
  console.log(`Server listening on port ${PORT}`);
});
