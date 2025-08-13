"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Table,
  DatePicker,
  Typography,
  Layout,
  Space,
  Statistic,
  Row,
  Col,
  Button,
} from "antd";
import { ArrowLeftOutlined, RedoOutlined } from "@ant-design/icons";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Header, Content } = Layout;

export default function SensorHistory() {
  const router = useRouter();
  const { sensorType } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(7, "day"),
    dayjs(),
  ]);
  const [stats, setStats] = useState({
    average: 0,
    min: 0,
    max: 0,
  });

  const sensorTitles = {
    temperature: "Temperature",
    humidity: "Humidity",
    light: "Light Intensity",
    soil_moisture: "Soil Moisture",
    rainfall: "Rainfall",
  };

  const sensorUnits = {
    temperature: "°C",
    humidity: "%",
    light: "lux",
    soil_moisture: "%",
    rainfall: "mm",
  };

  const columns = [
    {
      title: "Date & Time",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      render: (text) => `${text} ${sensorUnits[sensorType]}`,
    },
  ];

  const fetchData = async () => {
    if (!dateRange || dateRange.length !== 2) return;

    setLoading(true);
    try {
      const response = await axios.get("/api/sensor-data", {
        params: {
          startDate: dateRange[0].toISOString(),
          endDate: dateRange[1].toISOString(),
          sensorType,
        },
      });

      setData(response.data);

      // Calculate stats
      if (response.data.length > 0) {
        const values = response.data.map((item) => item.value);
        setStats({
          average: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(
            2
          ),
          min: Math.min(...values).toFixed(2),
          max: Math.max(...values).toFixed(2),
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, sensorType]);

  const handleDateChange = (dates) => {
    setDateRange(dates);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ display: "flex", alignItems: "center" }}>
        <Space>
          <ArrowLeftOutlined
            style={{ color: "#fff", fontSize: "18px", cursor: "pointer" }}
            onClick={() => router.back()}
          />
          <Title level={4} style={{ color: "#fff", margin: 0 }}>
            {sensorTitles[sensorType]} History
          </Title>
        </Space>
      </Header>
      <Content style={{ padding: "24px" }}>
        <Card>
          <Row gutter={16} style={{ marginBottom: "24px" }}>
            <Col>
              <RangePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                value={dateRange}
                onChange={handleDateChange}
                style={{ width: "100%", maxWidth: "400px" }}
              />
            </Col>
            <Col>
              <Button onClick={fetchData} icon={<RedoOutlined />}>
                Refresh
              </Button>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginBottom: "24px" }}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Average"
                  value={stats.average}
                  suffix={sensorUnits[sensorType]}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Minimum"
                  value={stats.min}
                  suffix={sensorUnits[sensorType]}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Maximum"
                  value={stats.max}
                  suffix={sensorUnits[sensorType]}
                />
              </Card>
            </Col>
          </Row>

          <Table
            columns={columns}
            dataSource={data}
            loading={loading}
            rowKey="timestamp"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Content>
    </Layout>
  );
}
