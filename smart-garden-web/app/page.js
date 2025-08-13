"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Typography,
  Layout,
  theme,
  notification,
} from "antd";
import {
  WifiOutlined,
  CloudOutlined,
  SunOutlined,
  ExperimentOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useRouter } from "next/navigation";
import mqtt from "mqtt";

const { Title } = Typography;
const { Header, Content } = Layout;

export default function Home() {
  const [sensorData, setSensorData] = useState({
    temperature: 0,
    humidity: 0,
    light: 0,
    soilMoisture: 0,
    rainfall: 0,
    lastUpdated: "Loading...",
  });
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const router = useRouter();

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // Fetch initial data from server
  const fetchInitialData = async () => {
    try {
      const response = await axios.get("/api/latest-data");
      setSensorData({
        temperature: response.data.temperature,
        humidity: response.data.humidity,
        light: response.data.light,
        soilMoisture: response.data.soilMoisture,
        rainfall: response.data.rainfall,
        lastUpdated: new Date(response.data.lastUpdated).toLocaleTimeString(),
      });
    } catch (error) {
      console.error("Error fetching initial data:", error);
      notification.error({
        message: "Connection Error",
        description: "Could not fetch initial sensor data from server",
      });
    }
  };

  // Connect to MQTT
  const connectToMqtt = async () => {
    try {
      const host = process.env.NEXT_PUBLIC_MQTT_HOST;
      const port = process.env.NEXT_PUBLIC_MQTT_PORT;
      const username = process.env.NEXT_PUBLIC_MQTT_USERNAME;
      const password = process.env.NEXT_PUBLIC_MQTT_PASSWORD;

      const client = mqtt.connect(`wss://${host}:${port}/mqtt`, {
        username,
        password,
        clientId: "web-client-" + Math.random().toString(16).substring(2, 8),
      });

      client.on("connect", () => {
        setConnectionStatus("Connected");
        client.subscribe("smart-garden/sensors");
      });

      client.on("message", (topic, message) => {
        const data = JSON.parse(message.toString());
        setSensorData({
          temperature: data.temperature,
          humidity: data.humidity,
          light: data.light,
          soilMoisture: data.soilMoisture,
          rainfall: data.rainfall,
          lastUpdated: new Date().toLocaleTimeString(),
        });
      });

      client.on("error", (err) => {
        setConnectionStatus("Error");
        console.error("MQTT error:", err);
      });

      return () => {
        client.end();
      };
    } catch (error) {
      console.error("Error getting MQTT config:", error);
      setConnectionStatus("Connection Failed");
    }
  };

  useEffect(() => {
    fetchInitialData();
    connectToMqtt();
  }, []);

  const handleCardClick = (sensorType) => {
    router.push(`/sensor/${sensorType}`);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <ExperimentOutlined
            style={{ fontSize: "24px", color: "#fff", marginRight: "16px" }}
          />
          <Title level={3} style={{ color: "#fff", margin: 0 }}>
            Smart Garden Dashboard
          </Title>
        </div>
        <div
          style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}
        >
          <WifiOutlined
            style={{
              color: connectionStatus === "Connected" ? "#52c41a" : "#f5222d",
              marginRight: "8px",
            }}
          />
          <span style={{ color: "#fff" }}>MQTT: {connectionStatus}</span>
        </div>
      </Header>
      <Content style={{ padding: "24px", backgroundColor: colorBgContainer }}>
        <Row gutter={[16, 16]} style={{ marginBottom: "16px" }}>
          <Col span={24}>
            <Card>
              <Title level={4}>Sensor Readings</Title>
              <Typography.Text type="secondary">
                Last updated: {sensorData.lastUpdated}
              </Typography.Text>
            </Card>
          </Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card hoverable onClick={() => handleCardClick("temperature")}>
              <Statistic
                title="Temperature"
                value={sensorData.temperature}
                suffix="°C"
                prefix={<CloudOutlined />}
              />
              <Progress
                percent={(sensorData.temperature / 50) * 100}
                showInfo={false}
                strokeColor={
                  sensorData.temperature > 35
                    ? "#f5222d"
                    : sensorData.temperature > 25
                    ? "#faad14"
                    : "#52c41a"
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card hoverable onClick={() => handleCardClick("humidity")}>
              <Statistic
                title="Humidity"
                value={sensorData.humidity}
                suffix="%"
                // prefix={<DropOutlined />}
              />
              <Progress
                percent={sensorData.humidity}
                showInfo={false}
                strokeColor={
                  sensorData.humidity > 80
                    ? "#52c41a"
                    : sensorData.humidity > 50
                    ? "#1890ff"
                    : "#faad14"
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card hoverable onClick={() => handleCardClick("light")}>
              <Statistic
                title="Light Intensity"
                value={sensorData.light}
                suffix="lux"
                prefix={<SunOutlined />}
              />
              <Progress
                percent={(sensorData.light / 1000) * 100}
                showInfo={false}
                strokeColor={
                  sensorData.light > 800
                    ? "#faad14"
                    : sensorData.light > 400
                    ? "#1890ff"
                    : "#722ed1"
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card hoverable onClick={() => handleCardClick("soil_moisture")}>
              <Statistic
                title="Soil Moisture"
                value={sensorData.soilMoisture}
                suffix="%"
                // prefix={<DropOutlined />}
              />
              <Progress
                percent={sensorData.soilMoisture}
                showInfo={false}
                strokeColor={
                  sensorData.soilMoisture > 70
                    ? "#52c41a"
                    : sensorData.soilMoisture > 40
                    ? "#1890ff"
                    : "#f5222d"
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card hoverable onClick={() => handleCardClick("rainfall")}>
              <Statistic
                title="Rainfall"
                value={sensorData.rainfall}
                suffix="mm"
                prefix={<CloudOutlined />}
              />
              <Progress
                percent={(sensorData.rainfall / 10) * 100}
                showInfo={false}
                strokeColor="#1890ff"
              />
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
