import { useEffect, useState } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';

export default function ProfileForm({ onSubmit, formData }) {
  const [form, setForm] = useState({
    username: '', name: '', age: '', sleep:'early', clean:'yes', noise:'low',
    gender:'other', pets:'no', smoking:'no', study_time:'morning',
    hobbies:'', bio:''
  });
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (formData) {
      setForm({
        username: formData.username || '',
        name: formData.name || '',
        age: formData.age ?? '',
        sleep: formData.sleep || 'early',
        clean: formData.clean || 'yes',
        noise: formData.noise || 'low',
        gender: formData.gender || 'other',
        pets: formData.pets || 'no',
        smoking: formData.smoking || 'no',
        study_time: formData.study_time || 'morning',
        hobbies: Array.isArray(formData.hobbies) ? formData.hobbies.join(',') : (formData.hobbies || ''),
        bio: formData.bio || ''
      });
    }
  }, [formData]);

  const onChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const invalidAge = !(parseInt(form.age) > 0);
    if (invalidAge || !form.name.trim() || !form.username.trim()) {
      setValidated(true);
      if (!form.username.trim()) {
        setError('Username is required.');
      } else if (invalidAge) {
        setError('Age must be greater than 0.');
      } else {
        setError('Name is required.');
      }
      return;
    }
    setError('');
    const payload = {
      ...form,
      username: form.username.trim().toLowerCase(),
      age: parseInt(form.age),
      hobbies: form.hobbies.split(',').map(s => s.trim()).filter(Boolean),
    };
    onSubmit(payload);
  };

  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit} className="p-4 bg-light rounded">
      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
      <Form.Group className="mb-3" controlId="username">
        <Form.Label>Username</Form.Label>
        <Form.Control 
          required 
          name="username" 
          value={form.username} 
          onChange={onChange}
          pattern="[a-zA-Z0-9_]+"
          title="Username can only contain letters, numbers, and underscores"
        />
        <Form.Control.Feedback type="invalid">Please provide a valid username.</Form.Control.Feedback>
      </Form.Group>
      <Row className="mb-3">
        <Form.Group as={Col} md="6" controlId="name">
          <Form.Label>Name</Form.Label>
          <Form.Control required name="name" value={form.name} onChange={onChange}/>
          <Form.Control.Feedback type="invalid">Please provide your name.</Form.Control.Feedback>
        </Form.Group>
        <Form.Group as={Col} md="6" controlId="age">
          <Form.Label>Age</Form.Label>
          <Form.Control required type="number" name="age" value={form.age} onChange={onChange} min={1}/>
          <Form.Control.Feedback type="invalid">Age must be greater than 0.</Form.Control.Feedback>
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} md="6">
          <Form.Label>Sleep Schedule</Form.Label>
          <Form.Select name="sleep" value={form.sleep} onChange={onChange}>
            <option value="early">Early</option><option value="late">Late</option>
          </Form.Select>
        </Form.Group>
        <Form.Group as={Col} md="6">
          <Form.Label>Cleanliness</Form.Label>
          <Form.Select name="clean" value={form.clean} onChange={onChange}>
            <option value="yes">Yes</option><option value="no">No</option>
          </Form.Select>
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} md="6">
          <Form.Label>Noise Tolerance</Form.Label>
          <Form.Select name="noise" value={form.noise} onChange={onChange}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </Form.Select>
        </Form.Group>
        <Form.Group as={Col} md="6">
          <Form.Label>Gender</Form.Label>
          <Form.Select name="gender" value={form.gender} onChange={onChange}>
            <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
          </Form.Select>
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} md="6">
          <Form.Label>Pets</Form.Label>
          <Form.Select name="pets" value={form.pets} onChange={onChange}>
            <option value="no">No</option><option value="yes">Yes</option>
          </Form.Select>
        </Form.Group>
        <Form.Group as={Col} md="6">
          <Form.Label>Smoking</Form.Label>
          <Form.Select name="smoking" value={form.smoking} onChange={onChange}>
            <option value="no">No</option><option value="yes">Yes</option>
          </Form.Select>
        </Form.Group>
      </Row>

      <Row className="mb-3">
        <Form.Group as={Col} md="6">
          <Form.Label>Preferred Study Time</Form.Label>
          <Form.Select name="study_time" value={form.study_time} onChange={onChange}>
            <option value="morning">Morning</option><option value="evening">Evening</option>
          </Form.Select>
        </Form.Group>
        <Form.Group as={Col} md="6">
          <Form.Label>Hobbies (comma separated)</Form.Label>
          <Form.Control name="hobbies" value={form.hobbies} onChange={onChange} placeholder="reading, music, ..." />
        </Form.Group>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Bio</Form.Label>
        <Form.Control as="textarea" rows={3} name="bio" value={form.bio} onChange={onChange}/>
      </Form.Group>

      <div className="text-center">
        <Button type="submit" variant="primary">Save</Button>
      </div>
    </Form>
  );
}
