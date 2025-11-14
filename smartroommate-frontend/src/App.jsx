import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import MatchResults from './pages/MatchResults';
import Dashboard from './pages/Dashboard';
import ProfileEdit from './pages/ProfileEdit';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Analytics from './pages/Analytics';
import './App.css';

export default function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard/:username" element={<Dashboard />} />
        <Route path="/profile/:username/edit" element={<ProfileEdit />} />
        <Route path="/matches/:username" element={<MatchResults />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/logout" element={<Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
