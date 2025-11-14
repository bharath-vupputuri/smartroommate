import { Navbar, Nav, Container } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function NavBar() {
  const [username, setUsername] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    setUsername(storedUsername);
    
    // Listen for storage changes (e.g., logout from another tab)
    const handleStorageChange = () => {
      setUsername(localStorage.getItem('username'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    setUsername(null);
    navigate('/');
  };

  return (
    <Navbar bg="white" expand="lg" className="shadow-md mb-4 border-bottom">
      <Container>
        <Navbar.Brand as={NavLink} to="/" className="fw-bold gradient-text fs-4">SmartRoommate</Navbar.Brand>
        <Navbar.Toggle aria-controls="nav" />
        <Navbar.Collapse id="nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/">Home</Nav.Link>
            <Nav.Link 
              href="/analytics" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                window.open('/analytics', '_blank');
              }}
            >
              📊 Analytics
            </Nav.Link>
            {username ? (
              <>
                <Nav.Link as={NavLink} to={`/dashboard/${username}`}>Dashboard</Nav.Link>
                <Nav.Link as={NavLink} to={`/profile/${username}/edit`}>Profile</Nav.Link>
                <Nav.Link as={NavLink} to={`/matches/${username}`}>Matches</Nav.Link>
                <Nav.Link onClick={handleLogout} style={{ cursor: 'pointer' }}>Logout</Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link as={NavLink} to="/login">Login</Nav.Link>
                <Nav.Link as={NavLink} to="/signup">Sign Up</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
