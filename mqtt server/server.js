const express = require("express");
const cors = require("cors");
const { pool, initializeDb } = require("./database/db");
const mqttClient = require("./mqttClient");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDb();

// MQTT message handler
mqttClient.onMessage(async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log("Received sensor data:", data);

    await pool.query(
      "INSERT INTO sensor_readings (temperature, humidity, light, soil_moisture, rainfall) VALUES ($1, $2, $3, $4, $5)",
      [
        data.temperature,
        data.humidity,
        data.light,
        data.soilMoisture,
        data.rainfall,
      ]
    );
    console.log("Data stored in database");
  } catch (err) {
    console.error("Error processing MQTT message:", err);
  }
});

// API Routes
// app.get('/api/sensor-data', async (req, res) => {
//   try {
//     const { startDate, endDate, sensorType } = req.query;

//     if (!startDate || !endDate || !sensorType) {
//       return res.status(400).json({ error: 'Missing required parameters: startDate, endDate, sensorType' });
//     }

//     // Validate sensorType
//     const validSensors = ['temperature', 'humidity', 'light', 'soil_moisture', 'rainfall'];
//     if (!validSensors.includes(sensorType)) {
//       return res.status(400).json({ error: 'Invalid sensor type' });
//     }

//     const query = `
//       SELECT created_at as timestamp, ${sensorType} as value
//       FROM sensor_readings
//       WHERE created_at BETWEEN $1 AND $2
//       ORDER BY created_at ASC
//     `;

//     const result = await pool.query(query, [startDate, endDate]);
//     res.json(result.rows);
//   } catch (err) {
//     console.error('Error fetching sensor data:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

app.get("/api/sensor-data", async (req, res) => {
  const { sensorType, startDate, endDate, interval } = req.query;

  // Validate sensor type
  const validSensors = [
    "temperature",
    "humidity",
    "light",
    "soil_moisture",
    "rainfall",
  ];
  if (!validSensors.includes(sensorType)) {
    return res.status(400).json({ error: "Invalid sensor type" });
  }

  try {
    let query;
    let params = [startDate, endDate];

    if (!interval || interval === "raw") {
      query = `
        SELECT 
          created_at as timestamp, 
          ${sensorType} as value 
        FROM sensor_readings 
        WHERE created_at BETWEEN $1 AND $2 
        ORDER BY created_at ASC
      `;
    } else {
      // Determine the appropriate time truncation function
      let truncFunction;
      switch (interval) {
        case "5m":
          truncFunction = `date_trunc('hour', created_at) + 
                         (date_part('minute', created_at)::int / 5) * interval '5 min'`;
          break;
        case "hourly":
          truncFunction = `date_trunc('hour', created_at)`;
          break;
        case "daily":
          truncFunction = `date_trunc('day', created_at)`;
          break;
        default:
          truncFunction = `date_trunc('hour', created_at)`;
      }

      query = `
        SELECT 
          ${truncFunction} as timestamp,
          AVG(${sensorType}) as value
        FROM sensor_readings
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY ${truncFunction}
        ORDER BY timestamp ASC
      `;
    }

    const result = await pool.query(query, params);
    console.log(result);
    

    // Format the response
    const formattedData = result.rows.map((row) => ({
      timestamp: row.timestamp,
      value: parseFloat(row.value),
    }));

    res.json(formattedData);
  } catch (err) {
    console.error("Error fetching sensor data:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/latest-data", async (req, res) => {
  try {
    const query = `
      SELECT temperature, humidity, light, soil_moisture, rainfall, created_at
      FROM sensor_readings
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await pool.query(query);
    if (result.rows.length === 0) {
      return res.json({
        temperature: 0,
        humidity: 0,
        light: 0,
        soilMoisture: 0,
        rainfall: 0,
        lastUpdated: new Date().toString(),
      });
    }

    const data = result.rows[0];
    res.json({
      temperature: data.temperature,
      humidity: data.humidity,
      light: data.light,
      soilMoisture: data.soil_moisture,
      rainfall: data.rainfall,
      lastUpdated: data.created_at,
    });
  } catch (err) {
    console.error("Error fetching latest data:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/mqtt-config", (req, res) => {
  res.json({
    host: process.env.MQTT_HOST,
    port: process.env.MQTT_PORT,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
