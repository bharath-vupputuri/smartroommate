import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { submitProfile } from '../services/api';
import { Form, Button, Container, Alert, Card, Row, Col } from 'react-bootstrap';

export default function Signup() {
  const [form, setForm] = useState({
    username: '',
    name: '',
    age: '',
    sleep: 'early',
    clean: 'yes',
    noise: 'low',
    gender: 'other',
    pets: 'no',
    smoking: 'no',
    study_time: 'morning',
    hobbies: '',
    bio: ''
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const onChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username.trim()) {
      setError('Username is required.');
      return;
    }
    if (!form.name.trim() || !form.age || parseInt(form.age) <= 0) {
      setError('Name and valid age are required.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        ...form,
        username: form.username.trim().toLowerCase(),
        age: parseInt(form.age),
        hobbies: form.hobbies
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
      };
      const resp = await submitProfile(payload);
      localStorage.setItem('username', resp.data.username);
      localStorage.setItem('userId', resp.data.id);
      navigate(`/dashboard/${resp.data.username}`);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Signup failed. Please try again.';
      setError(errorMsg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="py-5 fade-in" style={{ maxWidth: '700px' }}>
      <Card className="modern-card shadow-lg border-0">
        <Card.Body className="p-5">
          <h2 className="text-center mb-3 fw-bold gradient-text">Create Your Profile</h2>
          <p className="text-center text-muted mb-4">Fill in your preferences to find your perfect roommate match</p>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Username <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                name="username" 
                value={form.username} 
                onChange={onChange} 
                required 
                disabled={busy}
                placeholder="Choose a unique username"
                pattern="[a-zA-Z0-9_]+"
                title="Username can only contain letters, numbers, and underscores"
              />
              <Form.Text className="text-muted">This will be used to login. Only letters, numbers, and underscores allowed.</Form.Text>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    name="name" 
                    value={form.name} 
                    onChange={onChange} 
                    required 
                    disabled={busy}
                    placeholder="Your full name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Age <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    type="number" 
                    name="age" 
                    value={form.age} 
                    onChange={onChange} 
                    required 
                    min={18} 
                    max={100}
                    disabled={busy}
                    placeholder="Your age"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sleep Schedule</Form.Label>
                  <Form.Select name="sleep" value={form.sleep} onChange={onChange} disabled={busy}>
                    <option value="early">Early Bird</option>
                    <option value="late">Night Owl</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Noise Tolerance</Form.Label>
                  <Form.Select name="noise" value={form.noise} onChange={onChange} disabled={busy}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cleanliness Preference</Form.Label>
                  <Form.Select name="clean" value={form.clean} onChange={onChange} disabled={busy}>
                    <option value="yes">Clean & Organized</option>
                    <option value="no">Casual</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Gender</Form.Label>
                  <Form.Select name="gender" value={form.gender} onChange={onChange} disabled={busy}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Pets</Form.Label>
                  <Form.Select name="pets" value={form.pets} onChange={onChange} disabled={busy}>
                    <option value="no">No Pets</option>
                    <option value="yes">Have Pets / Pet Friendly</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Smoking</Form.Label>
                  <Form.Select name="smoking" value={form.smoking} onChange={onChange} disabled={busy}>
                    <option value="no">Non-smoker</option>
                    <option value="yes">Smoker</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Preferred Study Time</Form.Label>
              <Form.Select name="study_time" value={form.study_time} onChange={onChange} disabled={busy}>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Hobbies</Form.Label>
              <Form.Control 
                name="hobbies" 
                value={form.hobbies} 
                onChange={onChange} 
                placeholder="reading, music, sports, gaming, etc. (comma separated)"
                disabled={busy}
              />
              <Form.Text className="text-muted">Separate multiple hobbies with commas</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Bio</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={4} 
                name="bio" 
                value={form.bio} 
                onChange={onChange}
                placeholder="Tell us about yourself, your lifestyle, and what you're looking for in a roommate..."
                disabled={busy}
              />
            </Form.Group>

            <Button type="submit" className="w-100 mb-3" disabled={busy} variant="primary">
              {busy ? 'Creating Profile...' : 'Create Profile'}
            </Button>
          </Form>

          <div className="text-center">
            <p className="mb-0">
              Already have an account?{' '}
              <Link to="/login" className="text-decoration-none">
                Login here
              </Link>
            </p>
            <Link to="/" className="text-decoration-none text-muted small">
              ← Back to Home
            </Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
