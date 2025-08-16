'use client'

import { useState, useEffect, useCallback } from 'react';
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
  Divider,
  Select,
  Slider,
  InputNumber,
  Checkbox,
  Alert
} from 'antd';
import { 
  ArrowLeftOutlined, 
  DownloadOutlined, 
  SyncOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import dayjs from 'dayjs';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from 'recharts';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Header, Content } = Layout;

export default function SensorHistory() {
  const router = useRouter();
  const { sensorType } = useParams();
  const [data, setData] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(7, 'day'),
    dayjs()
  ]);
  const [stats, setStats] = useState({
    average: 0,
    min: 0,
    max: 0
  });
  const [granularity, setGranularity] = useState('raw');
  const [smoothing, setSmoothing] = useState(30);
  const [minThreshold, setMinThreshold] = useState(null);
  const [maxThreshold, setMaxThreshold] = useState(null);
  const [showTrend, setShowTrend] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [error, setError] = useState(null);

  const sensorTitles = {
    temperature: 'Temperature',
    humidity: 'Humidity',
    light: 'Light Intensity',
    soil_moisture: 'Soil Moisture',
    rainfall: 'Rainfall'
  };

  const sensorUnits = {
    temperature: '°C',
    humidity: '%',
    light: 'lux',
    soil_moisture: '%',
    rainfall: 'mm'
  };

  const columns = [
    {
      title: 'Date & Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text) => new Date(text).toLocaleString()
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (text) => `${text.toFixed(2)} ${sensorUnits[sensorType]}`
    }
  ];

  const processData = useCallback((rawData) => {
    if (!rawData || rawData.length === 0) return rawData;
    
    let processed = rawData.map(item => ({
      ...item,
      timestamp: new Date(item.timestamp).getTime(),
      displayTime: new Date(item.timestamp).toLocaleString()
    }));
    
    if (smoothing > 0) {
      processed = processed.map((point, i) => {
        if (i === 0) return point;
        const prev = processed[i-1].value * (smoothing/100);
        const current = point.value * (1 - smoothing/100);
        return { ...point, value: prev + current };
      });
    }
    
    if (showTrend) {
      const windowSize = Math.max(1, Math.floor(processed.length / 10));
      processed = processed.map((_, i) => {
        const start = Math.max(0, i - windowSize);
        const end = i + 1;
        const slice = processed.slice(start, end);
        const avg = slice.reduce((sum, p) => sum + p.value, 0) / slice.length;
        return { ...processed[i], trend: avg };
      });
    }
    
    return processed;
  }, [smoothing, showTrend]);

  const fetchData = async () => {
    if (!dateRange || dateRange.length !== 2) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/sensor-data', {
        params: {
          startDate: dateRange[0].toISOString(),
          endDate: dateRange[1].toISOString(),
          sensorType,
          interval: granularity === 'raw' ? undefined : granularity
        }
      });
      
      const rawData = response.data.map(item => ({
        ...item,
        timestamp: item.timestamp,
        value: parseFloat(item.value)
      }));
      
      setData(rawData);
      setProcessedData(processData(rawData));
      
      if (rawData.length > 0) {
        const values = rawData.map(item => item.value);
        setStats({
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values)
        });
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load sensor data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleGranularityChange = (value) => {
    setGranularity(value);
  };

  const handleSmoothingChange = (value) => {
    setSmoothing(value);
  };

  const handleDateChange = (dates) => {
    setDateRange(dates);
  };

  const zoomToPeriod = (days) => {
    setDateRange([dayjs().subtract(days, 'day'), dayjs()]);
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, sensorType, granularity]);

  useEffect(() => {
    setProcessedData(processData(data));
  }, [data, processData]);

  const downloadCSV = () => {
    if (data.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Timestamp,Value\n";
    
    data.forEach(item => {
      csvContent += `${new Date(item.timestamp).toLocaleString().replace(',','')},${item.value.toFixed(2)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${sensorTitles[sensorType]}_${dayjs().format('YYYY-MM-DD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: '#fff',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>
            {new Date(label).toLocaleString()}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: 0, color: entry.color }}>
              {entry.name}: {entry.value.toFixed(2)} {sensorUnits[sensorType]}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <Space>
          <ArrowLeftOutlined 
            style={{ color: '#fff', fontSize: '18px', cursor: 'pointer' }} 
            onClick={() => router.back()} 
          />
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            {sensorTitles[sensorType]} History
          </Title>
        </Space>
      </Header>
      <Content style={{ padding: '24px' }}>
        {error && (
          <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />
        )}
        
        <Card>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col flex="auto">
              <Space>
                <RangePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  value={dateRange}
                  onChange={handleDateChange}
                  style={{ width: 280 }}
                />
                <Select 
                  value={granularity}
                  style={{ width: 150 }}
                  onChange={handleGranularityChange}
                >
                  <Option value="raw">Raw Data</Option>
                  <Option value="5m">5-minute Average</Option>
                  <Option value="hourly">Hourly Average</Option>
                  <Option value="daily">Daily Average</Option>
                </Select>
                <Button 
                  icon={<SyncOutlined />} 
                  onClick={handleRefresh}
                  loading={loading}
                >
                  Refresh
                </Button>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button onClick={() => zoomToPeriod(1)}>24 Hours</Button>
                <Button onClick={() => zoomToPeriod(7)}>1 Week</Button>
                <Button onClick={() => zoomToPeriod(30)}>1 Month</Button>
              </Space>
            </Col>
          </Row>
          
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <InputNumber 
                addonBefore="Min" 
                placeholder="Set minimum" 
                onChange={setMinThreshold}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={12}>
              <InputNumber 
                addonBefore="Max" 
                placeholder="Set maximum" 
                onChange={setMaxThreshold}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>
          
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Space>
                <Text strong>Analysis:</Text>
                <Checkbox 
                  checked={showTrend}
                  onChange={(e) => setShowTrend(e.target.checked)}
                >
                  Show Trend Line
                </Checkbox>
                <Checkbox 
                  checked={showComparison}
                  onChange={(e) => setShowComparison(e.target.checked)}
                >
                  Compare to Previous
                </Checkbox>
                <Text>Smoothing:</Text>
                <Slider
                  min={0}
                  max={100}
                  value={smoothing}
                  onChange={handleSmoothingChange}
                  style={{ width: 150 }}
                />
                <Text>{smoothing}%</Text>
              </Space>
            </Col>
          </Row>
          
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Average"
                  value={stats.average.toFixed(2)}
                  suffix={sensorUnits[sensorType]}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Minimum"
                  value={stats.min.toFixed(2)}
                  suffix={sensorUnits[sensorType]}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Maximum"
                  value={stats.max.toFixed(2)}
                  suffix={sensorUnits[sensorType]}
                />
              </Card>
            </Col>
          </Row>
          
          <Divider orientation="left">
            <LineChartOutlined /> Trend Visualization
          </Divider>
          <Card>
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <LineChart
                  data={processedData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="timestamp"
                    tickFormatter={(unixTime) => dayjs(unixTime).format('MM/DD HH:mm')}
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    scale="time"
                  />
                  <YAxis 
                    label={{ 
                      value: `${sensorTitles[sensorType]} (${sensorUnits[sensorType]})`, 
                      angle: -90, 
                      position: 'insideLeft' 
                    }} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {minThreshold && maxThreshold && (
                    <ReferenceArea y1={minThreshold} y2={maxThreshold} fill="#e6f7ff" strokeDasharray="3 3" />
                  )}
                  {minThreshold && (
                    <ReferenceLine y={minThreshold} stroke="orange" label="Min" />
                  )}
                  {maxThreshold && (
                    <ReferenceLine y={maxThreshold} stroke="red" label="Max" />
                  )}
                  
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#52c41a"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                    name={sensorTitles[sensorType]}
                    animationDuration={1000}
                  />
                  
                  {showTrend && (
                    <Line 
                      dataKey="trend" 
                      stroke="#faad14"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="5 5"
                      name="Trend Line"
                    />
                  )}
                  
                  {showComparison && (
                    <Line 
                      dataKey="comparison" 
                      stroke="#722ed1"
                      strokeWidth={1.5}
                      strokeOpacity={0.6}
                      dot={false}
                      name="Previous Period"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          
          <Divider orientation="left">Raw Data</Divider>
          <Table
            title={() => (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>Sensor Readings</Text>
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />} 
                  onClick={downloadCSV}
                  disabled={data.length === 0}
                >
                  Export CSV
                </Button>
              </div>
            )}
            columns={columns}
            dataSource={data}
            loading={loading}
            rowKey="timestamp"
            pagination={{ pageSize: 10 }}
            style={{ marginBottom: 24 }}
            scroll={{ x: true }}
          />
        </Card>
      </Content>
    </Layout>
  );
}