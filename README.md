# 🌐 IoT Project Server: A Step-by-Step Guide for New Users

Welcome to the **IoT Project Server!** 🚀  
This guide will help you set up your account, create a project, and connect your ESP32 to send and visualize real-time sensor data.

---

## 📍 Step 1: Create Your Account

1. Go to the homepage.
2. Fill in:
   - Full Name
   - Email Address
   - Phone Number
   - Password
3. Click **"Create Account"**.

---

## 🔐 Step 2: Log In to Your Dashboard

1. After registration, go to the login page.
2. Enter your email and password.
3. Click **"Login"**.
4. You'll be redirected to your personal dashboard.

---

## 📁 Step 3: Create Your First IoT Project

1. On your dashboard, click **"Create a New Project"**.
2. Fill in:
   - **Project Name** (e.g., *Home Weather Station*)
   - **Development Board** (e.g., *ESP32*)
   - **Description**
   - **Number of Sensors**
3. Click **"Create Project"**.
4. Your project will appear in the **Your Projects** list.

---

## 🔑 Step 4: Get Your Project Credentials

1. On your project card, copy the:
   - **Project Token**
   - **Server IP Address**  
     (Get this from `ipconfig` on Windows or `ifconfig` on macOS/Linux)

You’ll use these in the ESP32 code.

---

## 🧠 Step 5: Program Your ESP32 to Send Data

### 🔧 Prerequisites

Install these libraries in the Arduino IDE:

- `WebSockets` by Markus Sattler  
- `ArduinoJson` by Benoit Blanchon

---

### 📟 ESP32 Arduino Code

```cpp
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// --- CONFIGURE YOUR SETTINGS HERE ---
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* websockets_host = "YOUR_COMPUTER_IP_ADDRESS"; // Server IP
const uint16_t websockets_port = 3000;
const char* authToken = "PASTE_YOUR_TOKEN_HERE";
// ------------------------------------

WebSocketsClient webSocket;
const int SENSOR_PIN_A0 = A0;
const int SENSOR_PIN_A1 = A1;

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("[WSc] Disconnected!\n");
      break;
    case WStype_CONNECTED:
      Serial.printf("[WSc] Connected to server!\n");
      {
        StaticJsonDocument<200> authDoc;
        authDoc["token"] = authToken;
        authDoc["action"] = "auth";
        String authString;
        serializeJson(authDoc, authString);
        webSocket.sendTXT(authString);
      }
      break;
    case WStype_TEXT:
      Serial.printf("[WSc] Server response: %s\n", payload);
      break;
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  pinMode(SENSOR_PIN_A0, INPUT);
  pinMode(SENSOR_PIN_A1, INPUT);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected.");

  webSocket.begin(websockets_host, websockets_port, "/");
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  webSocket.loop();
  static unsigned long lastSendTime = 0;
  if (millis() - lastSendTime > 10000) {
    lastSendTime = millis();
    if (webSocket.isConnected()) {
      float sensorValueA0 = analogRead(SENSOR_PIN_A0);
      float sensorValueA1 = analogRead(SENSOR_PIN_A1);
      
      StaticJsonDocument<300> dataDoc;
      dataDoc["token"] = authToken;
      dataDoc["action"] = "data";
      JsonObject payload = dataDoc.createNestedObject("payload");
      payload["A0"] = sensorValueA0;
      payload["A1"] = sensorValueA1;
      
      String dataString;
      serializeJson(dataDoc, dataString);
      webSocket.sendTXT(dataString);
      Serial.printf("Sent data to server: %s\n", dataString.c_str());
    }
  }
}
