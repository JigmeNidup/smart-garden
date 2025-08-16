#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_GFX.h>
#include <DHT.h>

// Pin Definitions
#define SOIL_MOISTURE_PIN 34
#define LDR_PIN 35
#define RAIN_SENSOR_PIN 33
#define POWER_PIN 19
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

WiFiClientSecure espClient;
PubSubClient client(espClient);


// HiveMQ Cloud Let's Encrypt CA certificate
static const char* root_ca PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----
)EOF";

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
  
  //Initialize rain sensor power pin
  pinMode(POWER_PIN, OUTPUT);

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
  
  // espClient.setInsecure();
  espClient.setCACert(root_ca); //enable ssl

  client.setServer(mqtt_server, mqtt_port);
  analogSetAttenuation(ADC_11db);
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

  digitalWrite(POWER_PIN, HIGH);  // turn the rain sensor's power  ON
  delay(10);                      // wait 10 milliseconds
  rainValue = analogRead(RAIN_SENSOR_PIN);
  digitalWrite(POWER_PIN, LOW);  // turn the rain sensor's power OFF
  
  // Convert analog readings to more meaningful values
  soilMoisture = map(soilMoisture, 0, 4095, 0, 100); // Convert to percentage
  lightIntensity = map(abs(lightIntensity-4095), 0, 4095, 0, 1000); // Convert to lux approximation
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