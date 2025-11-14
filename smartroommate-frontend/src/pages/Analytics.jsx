import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { getAnalyticsStats } from '../services/api';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  // Basic render test - this should always show
  console.log('Analytics component rendering, loading:', loading, 'error:', error, 'stats:', stats);

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAnalyticsStats();
      console.log('Analytics response:', response.data);
      if (response.data && response.data.error) {
        setError(response.data.error);
      } else {
        setStats(response.data);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load analytics';
      setError(errorMsg);
      console.error('Analytics error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" size="lg" />
        <p className="mt-3 text-muted">Loading analytics...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!stats) {
    return (
      <Container className="py-5">
        <Card className="modern-card">
          <Card.Body className="text-center p-5">
            <h3 className="mb-3">Loading Analytics...</h3>
            <Spinner animation="border" variant="primary" />
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (stats.total_users === 0) {
    return (
      <Container className="py-5">
        <Card className="modern-card">
          <Card.Body className="text-center p-5">
            <h3 className="mb-3">No Data Available</h3>
            <p className="text-muted">Seed some users first to see analytics!</p>
            <p className="text-muted small mt-2">Go to the homepage and click "Seed Users" to generate sample data.</p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // Prepare data for charts with error handling
  const sleepData = Object.entries(stats.sleep_distribution || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const cleanData = Object.entries(stats.clean_distribution || {}).map(([name, value]) => ({
    name: name === 'yes' ? 'Clean & Organized' : 'Casual',
    value
  }));

  const noiseData = Object.entries(stats.noise_distribution || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const genderData = Object.entries(stats.gender_distribution || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const petsData = Object.entries(stats.pets_distribution || {}).map(([name, value]) => ({
    name: name === 'yes' ? 'Pet Friendly' : 'No Pets',
    value
  }));

  const smokingData = Object.entries(stats.smoking_distribution || {}).map(([name, value]) => ({
    name: name === 'yes' ? 'Smoker' : 'Non-smoker',
    value
  }));

  const studyTimeData = Object.entries(stats.study_time_distribution || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const hobbiesData = Object.entries(stats.hobbies_popularity || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));

  return (
    <Container className="py-5 fade-in">
      <div className="text-center mb-5">
        <h1 className="display-5 mb-3 fw-bold gradient-text">📊 Analytics Dashboard</h1>
        <p className="lead text-muted">Insights into the SmartRoommate community</p>
        <div className="mt-3">
          <span className="badge-custom me-2">Total Users: {stats.total_users}</span>
          <span className="badge-custom">Avg Age: {Math.round(stats.average_age)}</span>
        </div>
      </div>

      <Row className="g-4 mb-4">
        {/* Age Distribution */}
        <Col md={6}>
          <Card className="modern-card h-100">
            <Card.Header className="fw-bold bg-white border-bottom">
              <div className="d-flex align-items-center">
                <span className="me-2">📈</span>
                <span>Age Distribution</span>
              </div>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.age_distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Sleep Schedule */}
        <Col md={6}>
          <Card className="modern-card h-100">
            <Card.Header className="fw-bold bg-white border-bottom">
              <div className="d-flex align-items-center">
                <span className="me-2">🌙</span>
                <span>Sleep Schedule Preferences</span>
              </div>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sleepData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sleepData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        {/* Cleanliness */}
        <Col md={4}>
          <Card className="modern-card h-100">
            <Card.Header className="fw-bold bg-white border-bottom">
              <div className="d-flex align-items-center">
                <span className="me-2">✨</span>
                <span>Cleanliness Preferences</span>
              </div>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={cleanData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {cleanData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Noise Tolerance */}
        <Col md={4}>
          <Card className="modern-card h-100">
            <Card.Header className="fw-bold bg-white border-bottom">
              <div className="d-flex align-items-center">
                <span className="me-2">🔊</span>
                <span>Noise Tolerance</span>
              </div>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={noiseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Gender Distribution */}
        <Col md={4}>
          <Card className="modern-card h-100">
            <Card.Header className="fw-bold bg-white border-bottom">
              <div className="d-flex align-items-center">
                <span className="me-2">👥</span>
                <span>Gender Distribution</span>
              </div>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        {/* Pets & Smoking */}
        <Col md={6}>
          <Card className="modern-card h-100">
            <Card.Header className="fw-bold bg-white border-bottom">
              <div className="d-flex align-items-center">
                <span className="me-2">🐾</span>
                <span>Pets Preference</span>
              </div>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={petsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="modern-card h-100">
            <Card.Header className="fw-bold bg-white border-bottom">
              <div className="d-flex align-items-center">
                <span className="me-2">🚭</span>
                <span>Smoking Preference</span>
              </div>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={smokingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        {/* Study Time */}
        <Col md={6}>
          <Card className="modern-card h-100">
            <Card.Header className="fw-bold bg-white border-bottom">
              <div className="d-flex align-items-center">
                <span className="me-2">📚</span>
                <span>Preferred Study Time</span>
              </div>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={studyTimeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {studyTimeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Top Hobbies */}
        <Col md={6}>
          <Card className="modern-card h-100">
            <Card.Header className="fw-bold bg-white border-bottom">
              <div className="d-flex align-items-center">
                <span className="me-2">🎨</span>
                <span>Popular Hobbies</span>
              </div>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={hobbiesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ec4899" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Lifestyle Radar Chart */}
      <Row className="g-4">
        <Col md={12}>
          <Card className="modern-card">
            <Card.Header className="fw-bold bg-white border-bottom">
              <div className="d-flex align-items-center">
                <span className="me-2">🎯</span>
                <span>Lifestyle Preferences Overview</span>
              </div>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={[
                  {
                    category: 'Early Sleep',
                    value: (stats.sleep_distribution.early || 0) / stats.total_users * 100
                  },
                  {
                    category: 'Clean',
                    value: (stats.clean_distribution.yes || 0) / stats.total_users * 100
                  },
                  {
                    category: 'Low Noise',
                    value: (stats.noise_distribution.low || 0) / stats.total_users * 100
                  },
                  {
                    category: 'No Pets',
                    value: (stats.pets_distribution.no || 0) / stats.total_users * 100
                  },
                  {
                    category: 'Non-smoker',
                    value: (stats.smoking_distribution.no || 0) / stats.total_users * 100
                  },
                  {
                    category: 'Morning Study',
                    value: (stats.study_time_distribution.morning || 0) / stats.total_users * 100
                  }
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Percentage"
                    dataKey="value"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

