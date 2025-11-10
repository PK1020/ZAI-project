import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

function SeriesManager() {
    const [seriesList, setSeriesList] = useState([]);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Stan formularza
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        min_value: '',
        max_value: '',
        color: '#000000',
        icon: 'default', // Ikona nie jest w pełni zaimplementowana, ale jest w DB
    });

    // Pobierz wszystkie serie przy załadowaniu
    useEffect(() => {
        fetchSeries();
    }, []);

    const fetchSeries = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/series`);
            setSeriesList(res.data);
        } catch (err) {
            setError('Nie udało się pobrać listy serii.');
        }
    };

    const clearForm = () => {
        setFormData({
            id: null,
            name: '',
            min_value: '',
            max_value: '',
            color: '#000000',
            icon: 'default',
        });
        setError('');
        setMessage('');
    };

    // Ustawia formularz w tryb edycji
    const handleEditClick = (series) => {
        setFormData(series);
        setError('');
        setMessage('');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Czy na pewno chcesz usunąć tę serię i wszystkie jej pomiary?')) {
            try {
                await axios.delete(`${API_URL}/api/series/${id}`);
                setMessage('Seria usunięta.');
                fetchSeries(); // Odśwież listę
                clearForm();
            } catch (err) {
                setError('Błąd podczas usuwania serii.');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        const payload = {
            name: formData.name,
            min_value: parseFloat(formData.min_value),
            max_value: parseFloat(formData.max_value),
            color: formData.color,
            icon: formData.icon,
        };

        try {
            if (formData.id) {
                // --- Tryb EDYCJI (PUT) ---
                await axios.put(`${API_URL}/api/series/${formData.id}`, payload);
                setMessage('Seria zaktualizowana.');
            } else {
                // --- Tryb TWORZENIA (POST) ---
                await axios.post(`${API_URL}/api/series`, payload);
                setMessage('Seria dodana.');
            }
            fetchSeries(); // Odśwież listę
            clearForm(); // Wyczyść formularz
        } catch (err) {
            setError('Błąd zapisu. Sprawdź dane.');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="series-manager-container">
            <h2>Zarządzanie Seriami Pomiarowymi</h2>
            {error && <p className="message-error">{error}</p>}
            {message && <p className="message-success">{message}</p>}

            <div className="series-content">
                {/* --- Formularz Edycji/Dodawania --- */}
                <form onSubmit={handleSubmit} className="series-form">
                    <h3>{formData.id ? 'Edytuj Serię' : 'Dodaj Nową Serię'}</h3>
                    <div className="form-group">
                        <label>Nazwa:</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Wartość Min:</label>
                        <input
                            type="number"
                            step="0.01"
                            name="min_value"
                            value={formData.min_value}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Wartość Max:</label>
                        <input
                            type="number"
                            step="0.01"
                            name="max_value"
                            value={formData.max_value}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Kolor na wykresie:</label>
                        <input
                            type="color"
                            name="color"
                            value={formData.color}
                            onChange={handleChange}
                        />
                    </div>
                    <button type="submit" className="btn-submit">
                        {formData.id ? 'Zapisz zmiany' : 'Dodaj'}
                    </button>
                    {formData.id && (
                        <button
                            type="button"
                            onClick={clearForm}
                            className="btn-cancel"
                        >
                            Anuluj edycję
                        </button>
                    )}
                </form>

                {/* --- Lista Istniejących Serii --- */}
                <div className="series-list">
                    <h3>Istniejące Serie</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Nazwa</th>
                                <th>Zakres</th>
                                <th>Kolor</th>
                                <th>Akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {seriesList.map(s => (
                                <tr key={s.id}>
                                    <td>{s.name}</td>
                                    <td>{s.min_value} - {s.max_value}</td>
                                    <td>
                                        <div
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                backgroundColor: s.color,
                                                border: '1px solid #ccc',
                                            }}
                                        ></div>
                                    </td>
                                    <td className="actions-cell">
                                        <button
                                            onClick={() => handleEditClick(s)}
                                            className="btn-edit"
                                        >
                                            Edytuj
                                        </button>
                                        <button
                                            onClick={() => handleDelete(s.id)}
                                            className="btn-delete"
                                        >
                                            Usuń
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default SeriesManager;
