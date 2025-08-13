const mqtt = require('mqtt');
require('dotenv').config();

class MQTTClient {
  constructor() {
    this.client = null;
    this.connect();
  }

  connect() {
    const options = {
      port: process.env.MQTT_PORT,
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      rejectUnauthorized: false
    };

    this.client = mqtt.connect(`mqtts://${process.env.MQTT_HOST}`, options);

    this.client.on('connect', () => {
      console.log('Connected to MQTT broker');
      this.client.subscribe(process.env.MQTT_TOPIC, (err) => {
        if (err) {
          console.error('Subscription error:', err);
        } else {
          console.log(`Subscribed to topic: ${process.env.MQTT_TOPIC}`);
        }
      });
    });

    this.client.on('error', (err) => {
      console.error('MQTT error:', err);
    });

    this.client.on('close', () => {
      console.log('MQTT connection closed');
    });
  }

  onMessage(callback) {
    this.client.on('message', (topic, message) => {
      callback(topic, message);
    });
  }
}

module.exports = new MQTTClient();