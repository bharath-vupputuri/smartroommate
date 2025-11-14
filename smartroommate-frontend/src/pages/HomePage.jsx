import { Container, Button, Stack, Card, Row, Col, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { seedUsers } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleSeed = async () => {
    setBusy(true);
    try {
      const response = await seedUsers(16);
      const data = response.data;
      if (data.error) {
        alert(`Error: ${data.error}`);
      } else if (data.warning) {
        alert(`${data.warning}\nSeeded: ${data.seeded}/${data.requested} users\nTotal in DB: ${data.total}`);
      } else {
        alert(`Successfully seeded ${data.seeded} users!\nTotal in database: ${data.total}`);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to seed users';
      alert(`Error: ${errorMsg}\n\nPlease ensure:\n1. MongoDB is running\n2. Backend server is running\n3. Check browser console for details`);
      console.error('Seed error:', err);
    } finally { 
      setBusy(false); 
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    setUsername(null);
  };

  return (
    <Container className="py-5 fade-in">
      <div className="text-center mb-5">
        <h1 className="display-4 mb-3 gradient-text fw-bold">SmartRoommate</h1>
        <p className="lead text-muted fs-5">Find your perfect roommate match using AI-powered compatibility</p>
      </div>

      {username ? (
        <Row className="justify-content-center">
          <Col md={6}>
            <Card className="modern-card shadow-lg border-0">
              <Card.Body className="text-center p-5">
                <div className="mb-4">
                  <h3 className="mb-3 fw-bold">Welcome back! 👋</h3>
                  <p className="text-muted">You're logged in. Continue to your dashboard to see your matches.</p>
                </div>
                <Stack gap={2} className="d-flex align-items-center">
                  <Button as={Link} to={`/dashboard/${username}`} variant="primary" size="lg" className="w-100 fw-semibold">
                    Go to Dashboard
                  </Button>
                  <Button onClick={handleLogout} variant="outline-secondary" size="sm">
                    Logout
                  </Button>
                </Stack>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : (
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="modern-card shadow-lg border-0">
              <Card.Body className="p-5">
                <h3 className="text-center mb-4 fw-bold">Get Started</h3>
                <p className="text-center text-muted mb-4 fs-5">
                  Create a profile or login to find compatible roommates
                </p>
                <Stack gap={3} className="mb-4">
                  <Button as={Link} to="/signup" variant="primary" size="lg" className="w-100 fw-semibold py-3">
                    Create New Profile
                  </Button>
                  <Button as={Link} to="/login" variant="outline-primary" size="lg" className="w-100 fw-semibold py-3">
                    Login with Existing Account
                  </Button>
                </Stack>
                <div className="text-center">
                  <Button 
                    variant="outline-secondary" 
                    onClick={handleSeed} 
                    disabled={busy}
                    size="sm"
                  >
                    {busy ? 'Seeding...' : 'Seed Demo Users (16)'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row className="mt-5 mb-4">
        <Col md={12} className="text-center mb-4">
          <Card className="modern-card border-0 shadow-lg">
            <Card.Body className="p-4">
              <h4 className="mb-3 fw-bold">📊 View Analytics Dashboard</h4>
              <p className="text-muted mb-3">Explore community insights, user demographics, and lifestyle preferences</p>
              <Button 
                href="/analytics" 
                target="_blank"
                variant="primary" 
                size="lg"
                onClick={(e) => {
                  e.preventDefault();
                  window.open('/analytics', '_blank');
                }}
                className="fw-semibold"
              >
                Open Analytics in New Tab 📈
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-3">
        <Col md={4} className="text-center mb-4">
          <div className="p-4 modern-card h-100">
            <div className="mb-3" style={{ fontSize: '2.5rem' }}>🤖</div>
            <h5 className="fw-bold mb-3">AI-Powered Matching</h5>
            <p className="text-muted">Advanced algorithms analyze compatibility based on lifestyle, preferences, and personality</p>
          </div>
        </Col>
        <Col md={4} className="text-center mb-4">
          <div className="p-4 modern-card h-100">
            <div className="mb-3" style={{ fontSize: '2.5rem' }}>✨</div>
            <h5 className="fw-bold mb-3">Smart Compatibility</h5>
            <p className="text-muted">Match with roommates who share similar habits, schedules, and living preferences</p>
          </div>
        </Col>
        <Col md={4} className="text-center mb-4">
          <div className="p-4 modern-card h-100">
            <div className="mb-3" style={{ fontSize: '2.5rem' }}>⚙️</div>
            <h5 className="fw-bold mb-3">Easy Profile Management</h5>
            <p className="text-muted">Update your preferences anytime to get better matches</p>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
