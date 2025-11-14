import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMatchesByUsername } from '../services/api';
import { Card, Container, Row, Col, Fade, Spinner } from 'react-bootstrap';
import './match-anim.css'; // hover styles

export default function MatchResults() {
  const { username } = useParams();
  const [matches, setMatches] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const resp = await getMatchesByUsername(username);
      setMatches(resp.data);
      setLoaded(true);
    })();
  }, [username]);

  return (
    <Container className="py-5 fade-in">
      <h2 className="text-center mb-4 fw-bold gradient-text">Top Roommate Matches</h2>
      {!loaded ? (
        <div className="text-center"><Spinner animation="border" variant="primary" /></div>
      ) : (
        <Fade in={loaded}>
          <div>
            <Row xs={1} className="g-4">
              {matches.map((m, idx) => (
                <Col key={idx}>
                  <Card className="h-100 modern-card card-hover">
                    <Card.Header className="fw-bold bg-white border-bottom">
                      <div className="d-flex justify-content-between align-items-center">
                        <span>{m.name}</span>
                        <span className="badge-custom">{m.similarity}</span>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <div><b>Similarity:</b> {m.similarity}</div>
                      <div className="mb-2"><b>Reason:</b> {m.reason}</div>
                      <hr/>
                      <div><b>Age:</b> {m.profile.age}</div>
                      <div><b>Sleep:</b> {m.profile.sleep}</div>
                      <div><b>Clean:</b> {m.profile.clean}</div>
                      <div><b>Noise:</b> {m.profile.noise}</div>
                      <div><b>Gender:</b> {m.profile.gender}</div>
                      <div><b>Pets:</b> {m.profile.pets}</div>
                      <div><b>Smoking:</b> {m.profile.smoking}</div>
                      <div><b>Study Time:</b> {m.profile.study_time}</div>
                      <div><b>Hobbies:</b> {Array.isArray(m.profile.hobbies) ? m.profile.hobbies.join(', ') : m.profile.hobbies}</div>
                      <div><b>Bio:</b> {m.profile.bio}</div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </Fade>
      )}
    </Container>
  );
}
