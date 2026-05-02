import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import Navbar from './components/Navbar';
import FloatingChatbot from './components/FloatingChatbot';
import { AuthContext, getStoredAuth, setStoredAuth } from './services/api';
import './index.css';

function App() {
  const [auth, setAuth] = useState(getStoredAuth());
  const navigate = useNavigate();

  useEffect(() => {
    setStoredAuth(auth);
  }, [auth]);

  const authContextValue = useMemo(
    () => ({ auth, setAuth }),
    [auth],
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/admin"
            element={
              auth?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/user"
            element={
              auth?.role === 'user' ? <UserDashboard /> : <Navigate to="/login" replace />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <FloatingChatbot />
      </div>
    </AuthContext.Provider>
  );
}

export default App;
