import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMatchesByUsername, getProfileByUsername } from '../services/api';
import { Card, Container, Row, Col, Spinner } from 'react-bootstrap';

export default function Dashboard() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    (async () => {
      const p = await getProfileByUsername(username);
      setProfile(p.data);
      const m = await getMatchesByUsername(username);
      setMatches(m.data);
    })();
  }, [username]);

  if (!profile) {
    return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;
  }

  return (
    <Container className="py-4 fade-in">
      <h2 className="mb-4 fw-bold">Welcome, <span className="gradient-text">{profile.name}</span>! 👋</h2>

      <Row className="g-4">
        <Col md={6}>
          <Card className="modern-card h-100">
            <Card.Header className="fw-bold bg-white border-bottom">Profile Summary</Card.Header>
            <Card.Body>
              <div><b>Username:</b> {profile.username}</div>
              <div><b>Age:</b> {profile.age}</div>
              <div><b>Sleep:</b> {profile.sleep}</div>
              <div><b>Clean:</b> {profile.clean}</div>
              <div><b>Noise:</b> {profile.noise}</div>
              <div><b>Gender:</b> {profile.gender}</div>
              <div><b>Pets:</b> {profile.pets}</div>
              <div><b>Smoking:</b> {profile.smoking}</div>
              <div><b>Study Time:</b> {profile.study_time}</div>
              <div><b>Hobbies:</b> {Array.isArray(profile.hobbies) ? profile.hobbies.join(', ') : profile.hobbies}</div>
              <div><b>Bio:</b> {profile.bio}</div>
              <hr/>
              <Link to={`/profile/${username}/edit`}>Edit Profile</Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="modern-card h-100">
            <Card.Header className="fw-bold bg-white border-bottom">Your Matches</Card.Header>
            <Card.Body>
              {matches.length === 0 ? (
                <div className="text-muted">No matches yet.</div>
              ) : (
                <ul className="mb-0">
                  {matches.map((m,i) => (
                    <li key={i}>
                      <b>{m.name}</b> – {m.similarity} · <Link to={`/matches/${username}`}>see details</Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
