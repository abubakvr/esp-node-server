#include <Wire.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <Adafruit_INA219.h>

const char *ssid = "Sadeeq";
const char *password = "seeman11";
const char *webSocketServer = "192.168.43.5";
const int webSocketPort = 8080;

Adafruit_INA219 ina219_1;
Adafruit_INA219 ina219_2;

WebSocketsClient webSocket;

float busvoltage_1, current_mA_1, power_mW_1;
float busvoltage_2, current_mA_2, power_mW_2;

void measureValues(Adafruit_INA219 &ina, int sensorNumber)
{
    float shuntvoltage = ina.getShuntVoltage_mV();
    float busvoltage = ina.getBusVoltage_V();
    float current_mA = ina.getCurrent_mA();
    float loadvoltage = busvoltage + (shuntvoltage / 1000);
    float power_mW = ina.getPower_mW();
    float energy = energy + power_mW * (0.1 / (60 * 60));
    Serial.print("Sensor ");
    Serial.print(sensorNumber);
    Serial.print(": VBus=");
    Serial.print(busvoltage);
    Serial.print(": VLoad=");
    Serial.print(loadvoltage);
    Serial.print(" I=");

    if (current_mA < 3)
    {
        Serial.print("000");
        Serial.print((int)current_mA);
    }
    else if (current_mA < 10)
    {
        Serial.print("00");
        Serial.print((int)current_mA);
    }
    else if (current_mA < 100)
    {
        Serial.print('0');
        Serial.print((int)current_mA);
    }
    else
    {
        Serial.print((int)current_mA);
    }
    Serial.print("Power(mW):");
    Serial.print((int)power_mW);

    // Create a JSON object
    StaticJsonDocument<200> jsonDocument;
    jsonDocument["sensor"] = sensorNumber;
    jsonDocument["voltage"] = busvoltage;
    jsonDocument["current"] = current_mA;
    jsonDocument["power"] = power_mW;

    // Convert the JSON object to a string
    String message;
    serializeJson(jsonDocument, message);

    Serial.print("Sending message to WebSocket: ");
    Serial.println(message);
    webSocket.sendTXT(message);
}

void webSocketEvent(WStype_t type, uint8_t *payload, size_t length)
{
    switch (type)
    {
    case WStype_DISCONNECTED:
        Serial.printf("[WebSocket] Disconnected\n");
        break;
    case WStype_CONNECTED:
        Serial.printf("[WebSocket] Connected\n");
        break;
    case WStype_TEXT:
        Serial.printf("[WebSocket] Message received: %s\n", payload);
        break;
    case WStype_BIN:
        // Handle binary data received from WebSocket server if needed
        break;
    }
}

void setup()
{
    Serial.begin(115200);

    // Connect to Wi-Fi
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(1000);
        Serial.println("Connecting to WiFi...");
    }
    Serial.println("Connected to WiFi");
    webSocket.sendTXT("Hello");

    // Connect to WebSocket
    webSocket.begin(webSocketServer, webSocketPort, "/");
    webSocket.onEvent(webSocketEvent);

    if (!ina219_1.begin())
    {
        Serial.println("FAILED TO FIND INA219 MODULE 1");
        while (1)
        {
            delay(10);
        }
    }

    if (!ina219_2.begin())
    {
        Serial.println("FAILED TO FIND INA219 MODULE 2");
        while (1)
        {
            delay(10);
        }
    }

    webSocket.setReconnectInterval(5000);
}

void loop()
{
    webSocket.loop();
    static unsigned long lastUpdateTime = 0;
    unsigned long currentTime = millis();

    // Update every 2000 milliseconds (2 seconds)
    if (currentTime - lastUpdateTime >= 2000)
    {
        measureValues(ina219_1, 1);
        measureValues(ina219_2, 2);

        lastUpdateTime = currentTime;
    }
}
