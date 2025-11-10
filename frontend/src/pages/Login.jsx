import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
//import './Login.css'; // jeśli masz osobny plik stylów

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 🔹 Stany dla rejestracji
  const [showRegister, setShowRegister] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');

  const auth = useAuth();
  const navigate = useNavigate();

  // 🔹 Logowanie
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const success = await auth.login(username, password);
    if (success) {
      navigate('/');
    } else {
      setError('Nieprawidłowy login lub hasło');
    }
  };

  // 🔹 Rejestracja nowego użytkownika
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterMessage('');

    const result = await auth.register(newUsername, newPassword);

    if (result.success) {
      setRegisterMessage('✅ Użytkownik utworzony. Możesz się teraz zalogować.');
      setShowRegister(false);
      setNewUsername('');
      setNewPassword('');
    } else {
      setRegisterMessage(result.message || '❌ Błąd podczas tworzenia użytkownika.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Logowanie</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error">{error}</p>}

          <div className="form-group">
            <label>Użytkownik</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Hasło</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Zaloguj
          </button>
        </form>

        {/* 🔹 Przycisk do otwierania formularza rejestracji */}
        <button
          type="button"
          className="btn btn-link"
          onClick={() => setShowRegister((prev) => !prev)}
        >
          {showRegister ? 'Anuluj rejestrację' : 'Dodaj użytkownika'}
        </button>
      </div>

      {/* 🔹 Formularz rejestracji nowego użytkownika */}
      {showRegister && (
        <div className="login-box">
          <h2>Rejestracja użytkownika</h2>
          <form onSubmit={handleRegister}>
            {registerMessage && <p className="info">{registerMessage}</p>}

            <div className="form-group">
              <label>Nazwa użytkownika</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Hasło</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-secondary">
              Utwórz konto
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Login;
