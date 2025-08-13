#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_GFX.h>
#include <DHT.h>

// Pin Definitions
#define SOIL_MOISTURE_PIN 34
#define LDR_PIN 35
#define RAIN_SENSOR_PIN 33
#define DHT_PIN 25
#define LED_PIN 26

// OLED Display Settings
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// DHT Sensor Settings
#define DHT_TYPE DHT11
DHT dht(DHT_PIN, DHT_TYPE);

// WiFi and MQTT Settings
const char* ssid = "TYN_Home_2.4";
const char* password = "yugelshome";

const char* mqtt_server = "41266a43e35b45f8ae3fd8767055a173.s1.eu.hivemq.cloud"; // e.g., "broker.hivemq.com"
const int mqtt_port = 8883;
const char* mqtt_username = "smart_garden_sensor";
const char* mqtt_password = "Smart@pass2025";
const char* mqtt_topic = "smart-garden/sensors";

WiFiClient espClient;
PubSubClient client(espClient);

// Variables for sensor readings
float temperature = 0;
float humidity = 0;
int soilMoisture = 0;
int lightIntensity = 0;
int rainValue = 0;

unsigned long previousMillis = 0;
const long interval = 10000; // Interval at which to publish sensor readings (10 seconds)

void setup() {
  Serial.begin(115200);
  
  // Initialize LED pin
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW); // Start with LED off
  
  // Initialize OLED display
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 allocation failed"));
    for(;;); // Don't proceed, loop forever
  }
  display.display();
  delay(2000);
  display.clearDisplay();
  
  // Initialize DHT sensor
  dht.begin();
  
  // Connect to WiFi
  setupWiFi();
  
  // Set up MQTT
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long currentMillis = millis();
  
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    
    // Read all sensors
    readSensors();
    
    // Display on OLED
    updateDisplay();
    
    // Publish to MQTT
    publishSensorData();
  }
}

void setupWiFi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
  
  // Turn on LED when WiFi is connected
  digitalWrite(LED_PIN, HIGH);
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    // Attempt to connect
    if (client.connect("ESP32SmartGarden", mqtt_username, mqtt_password)) {
      Serial.println("connected");
      digitalWrite(LED_PIN, HIGH); // Keep LED on when MQTT is connected
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      digitalWrite(LED_PIN, LOW); // Blink LED when connection fails
      delay(500);
      digitalWrite(LED_PIN, HIGH);
      delay(4500);
    }
  }
}

void readSensors() {
  // Read DHT11 (temperature and humidity)
  temperature = dht.readTemperature();
  humidity = dht.readHumidity();
  
  // Read analog sensors (12-bit ADC)
  soilMoisture = analogRead(SOIL_MOISTURE_PIN);
  lightIntensity = analogRead(LDR_PIN);
  rainValue = analogRead(RAIN_SENSOR_PIN);
  
  // Convert analog readings to more meaningful values
  soilMoisture = map(soilMoisture, 0, 4095, 0, 100); // Convert to percentage
  lightIntensity = map(lightIntensity, 0, 4095, 0, 1000); // Convert to lux approximation
  rainValue = map(rainValue, 0, 4095, 0, 10); // Convert to mm approximation
  
  // Check if any reads failed
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Failed to read from DHT sensor!");
    temperature = 0;
    humidity = 0;
  }
  
  Serial.println("Sensor readings:");
  Serial.print("Temperature: "); Serial.print(temperature); Serial.println(" °C");
  Serial.print("Humidity: "); Serial.print(humidity); Serial.println(" %");
  Serial.print("Soil Moisture: "); Serial.print(soilMoisture); Serial.println(" %");
  Serial.print("Light Intensity: "); Serial.print(lightIntensity); Serial.println(" lux");
  Serial.print("Rain: "); Serial.print(rainValue); Serial.println(" mm");
}

void updateDisplay() {
  display.clearDisplay();
  
  // Display temperature and humidity
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0,0);
  display.print("Temp: "); display.print(temperature); display.println(" C");
  display.print("Hum:  "); display.print(humidity); display.println(" %");
  
  // Display soil moisture and light
  display.print("Soil: "); display.print(soilMoisture); display.println(" %");
  display.print("Light: "); display.print(lightIntensity); display.println(" lux");
  
  // Display rain value
  display.print("Rain: "); display.print(rainValue); display.println(" mm");
  
  // Display WiFi status
  display.setCursor(0, 56);
  if (WiFi.status() == WL_CONNECTED) {
    display.print("WiFi: Connected");
  } else {
    display.print("WiFi: Disconnected");
  }
  
  display.display();
}

void publishSensorData() {
  // Create JSON payload
  String payload = "{";
  payload += "\"temperature\":"; payload += temperature; payload += ",";
  payload += "\"humidity\":"; payload += humidity; payload += ",";
  payload += "\"soilMoisture\":"; payload += soilMoisture; payload += ",";
  payload += "\"light\":"; payload += lightIntensity; payload += ",";
  payload += "\"rainfall\":"; payload += rainValue;
  payload += "}";
  
  // Publish to MQTT
  if (client.publish(mqtt_topic, payload.c_str())) {
    Serial.println("Message published");
  } else {
    Serial.println("Message not published");
  }
}