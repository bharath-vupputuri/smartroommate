import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getProfileByUsername } from "../services/api";
import { Form, Button, Container, Alert, Card } from "react-bootstrap";

export default function Login() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username.trim()) {
      setError("Please enter your username.");
      setLoading(false);
      return;
    }

    try {
      const resp = await getProfileByUsername(username.trim()); // validate user exists

      if (resp.status === 200) {
        localStorage.setItem("username", username.trim());
        localStorage.setItem("userId", resp.data.id); // Keep userId for backward compatibility
        navigate(`/dashboard/${username.trim()}`);
      }
    } catch (err) {
      setError("Invalid username. Please check your username and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5 fade-in" style={{ maxWidth: "450px" }}>
      <Card className="modern-card shadow-lg border-0">
        <Card.Body className="p-5">
          <h2 className="text-center mb-3 fw-bold gradient-text">Login</h2>
          <p className="text-center text-muted mb-4">Enter your username to access your dashboard</p>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={loading}
              />
            </Form.Group>

            <Button type="submit" className="w-100 mb-3" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </Form>

          <div className="text-center">
            <p className="mb-0">
              Don't have an account?{" "}
              <Link to="/signup" className="text-decoration-none">
                Sign up here
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
