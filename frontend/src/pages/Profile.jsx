import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Profile() {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Stany do obsługi wiadomości zwrotnych
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const { changePassword } = useAuth(); // Pobieramy funkcję z kontekstu

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        // 1. Walidacja po stronie klienta
        if (newPassword !== confirmPassword) {
            setError('Nowe hasła nie są zgodne.');
            return;
        }
        if (newPassword.length < 4) { // Prosta walidacja długości
            setError('Nowe hasło musi mieć co najmniej 4 znaki.');
            return;
        }

        // 2. Wywołanie funkcji z API (przez kontekst)
        try {
            const result = await changePassword(oldPassword, newPassword);

            if (result.success) {
                setMessage('Hasło zostało pomyślnie zmienione!');
                // Wyczyść formularz po sukcesie
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                // Ustaw błąd zwrócony z API (np. "Stare hasło jest nieprawidłowe")
                setError(result.message);
            }
        } catch (err) {
            setError('Wystąpił nieoczekiwany błąd serwera.');
        }
    };

    return (
        <div className="profile-container">
            <form onSubmit={handleSubmit} className="profile-form">
                <h2>Zmień swoje hasło</h2>

                {/* Komunikaty zwrotne */}
                {message && <p className="message-success">{message}</p>}
                {error && <p className="message-error">{error}</p>}

                <div className="form-group">
                    <label htmlFor="oldPass">Stare hasło:</label>
                    <input
                        id="oldPass"
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="newPass">Nowe hasło:</label>
                    <input
                        id="newPass"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="confirmPass">Potwierdź nowe hasło:</label>
                    <input
                        id="confirmPass"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn-submit">Zatwierdź zmianę</button>
            </form>
        </div>
    );
}

export default Profile;