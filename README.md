Here’s a clean and easy-to-read `README.md` version of your IoT project guide:

---

````markdown
# 🌐 Getting Started with Your IoT Project – Zantech Style

Welcome to the ultimate IoT starter guide! 🚀 This step-by-step doc helps you:

✅ Set up your account  
✅ Create your first project  
✅ Connect your ESP32  
✅ Send + view real-time sensor data 🎯

---

## 🔐 Step 1: Create Your Account
1. Go to the homepage  
2. Fill in: **Full Name, Email, Phone, Password**  
3. Log in using your credentials  
4. You'll land on your **personal dashboard**

---

## 🛠️ Step 2: Create Your First Project
1. Click **"Create a New Project"**
2. Fill the form:
   - **Project Name**: e.g., `Home Weather Station`
   - **Development Board**: `ESP32`
   - **Description**: (short summary)
3. Click `Create Project`

---

## 🧪 Step 3: Add & Configure Sensors
1. In your project, click **"Add Sensor"**
2. Give a **Sensor Name** (e.g., `Temperature`)
3. **Configure Pin Number** (e.g., `A0`, `D4`) – this MUST match your ESP32 wiring
4. (Optional) Customize Graph:
   - Title, Chart Type (Line, Bar, etc.), Axis Labels

---

## 🧾 Step 4: Project Credentials You’ll Need
From your dashboard, grab:
- ✅ Wi-Fi SSID + Password  
- ✅ Server IP (your computer’s IP – `ipconfig`/`ifconfig`)  
- ✅ Project Token (auth token)

---

## 💻 Step 5: Program Your ESP32

### ✅ Required Arduino Libraries
Install via **Arduino Library Manager**:
- `WebSockets by Markus Sattler`
- `ArduinoJson by Benoit Blanchon`

### 🔌 ESP32 Code Template
```cpp
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* websockets_host = "YOUR_COMPUTER_IP_ADDRESS";
const uint16_t websockets_port = 3000;
const char* authToken = "PASTE_YOUR_TOKEN_HERE";

WebSocketsClient webSocket;

const int SENSOR_PIN_A0 = A0;
const int SENSOR_PIN_A1 = A1;

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_CONNECTED:
      StaticJsonDocument<200> authDoc;
      authDoc["token"] = authToken;
      authDoc["action"] = "auth";
      String authString;
      serializeJson(authDoc, authString);
      webSocket.sendTXT(authString);
      break;
    case WStype_TEXT:
      Serial.printf("[WSc] Server response: %s\n", payload);
      break;
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(SENSOR_PIN_A0, INPUT);
  pinMode(SENSOR_PIN_A1, INPUT);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  webSocket.begin(websockets_host, websockets_port, "/");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
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
      Serial.println(dataString);
    }
  }
}
````

---

## 📊 Step 6: See Real-Time Data!

Once your ESP32 is running:

* The server matches `pinNumber` with your project sensors
* Graphs show real-time values 🎉

---

## 🔄 Example Payloads

### 🔼 From ESP32 → Server

```json
{
  "token": "ff46724d-5a06-4340-8c38-58301eceb7ef",
  "action": "device_update",
  "payload": {
    "sensors": {
      "A0": 753.00,
      "A1": 254.00
    },
    "buttons": {
      "D5": "released"
    }
  }
}
```

### 🔽 From Server → ESP32 (when button state changes)

```json
{
  "action": "releaseddata_update",
  "buttonId": "a472579f-a3e3-4f3d-9951-ae4d54e02b35",
  "releaseddata": "1"
}
```

---

## 🧠 Pro Tips

* Pin names in code MUST match pinNumber in dashboard
* You can send more sensors or buttons by adding them in both your code + dashboard
* Use strong Wi-Fi to avoid connection drops

---

🎉 **That's it! You're live with real-time IoT data on your custom dashboard!**
Need help? Reach out to [zantechbd.com](https://zantechbd.com)

---

```

Let me know if you want this styled with emojis, badges, or a clickable table of contents too!
```
