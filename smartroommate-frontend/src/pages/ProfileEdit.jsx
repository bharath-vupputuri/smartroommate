import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProfileByUsername, updateProfile } from '../services/api';
import ProfileForm from '../components/ProfileForm';
import { Container, Spinner } from 'react-bootstrap';

export default function ProfileEdit() {
  const { username } = useParams();
  const [initial, setInitial] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const resp = await getProfileByUsername(username);
      setInitial(resp.data);
    })();
  }, [username]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const userId = initial.id;
      await updateProfile(userId, data);
      // If username changed, update localStorage and navigate to new username
      const newUsername = data.username || username;
      localStorage.setItem('username', newUsername);
      navigate(`/dashboard/${newUsername}`);
    } finally { setSaving(false); }
  };

  if (!initial) return <Container className="py-5 text-center"><Spinner animation="border"/></Container>;
  return (
    <Container className="py-4">
      <h2 className="mb-3">Edit Profile</h2>
      <ProfileForm onSubmit={onSubmit} formData={initial}/>
    </Container>
  );
}
