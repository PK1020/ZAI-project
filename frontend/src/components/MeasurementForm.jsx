import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Props:
// - series: lista serii do wyboru w <select>
// - onMeasurementAdded: funkcja (callback) do odświeżenia danych w Dashboard
// - setError: funkcja (callback) do ustawienia błędu na poziomie Dashboard
function MeasurementForm({ series, onMeasurementAdded, setError }) {
    const [value, setValue] = useState('');
    const [seriesId, setSeriesId] = useState('');
    const [timestamp, setTimestamp] = useState('');

    // Ustaw domyślną serię, gdy lista się załaduje
    useEffect(() => {
        if (series.length > 0) {
            setSeriesId(series[0].id);
        }
    }, [series]); // Uruchom, gdy zmieni się lista serii

    const handleSubmit = async (e) => {
        e.preventDefault(); // Zapobiegaj przeładowaniu strony
        setError(null); // Wyczyść stare błędy

        if (!seriesId) {
            setError('Nie wybrano serii');
            return;
        }

        try {
            const payload = {
                value: parseFloat(value),
                series_id: parseInt(seriesId),
                timestamp: timestamp || null, // Wyślij null, jeśli puste (baza ustawi domyślny)
            };

            await axios.post('/api/measurements', payload);

            // Sukces
            onMeasurementAdded(); // Wywołaj callback, aby Dashboard odświeżył dane
            setValue(''); // Wyczyść formularz
            setTimestamp('');

        } catch (err) {
            // Wyświetlanie błędu walidacji z API (zgodnie z wymaganiami)
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            } else {
                setError('Nie udało się dodać pomiaru.');
            }
        }
    };

    return (
        <section className="form-section no-print">
            <h2>Dodaj nowy pomiar</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="series">Seria:</label>
                    <select
                        id="series"
                        value={seriesId}
                        onChange={(e) => setSeriesId(e.target.value)}
                        required
                    >
                        {series.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.name} (Zakres: {s.min_value} - {s.max_value})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="value">Temperatura:</label>
                    <input
                        id="value"
                        type="number"
                        step="0.01" // Liczba zmiennoprzecinkowa
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        required
                        placeholder="np. 25.5"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="timestamp">Znacznik czasu (opcjonalnie):</label>
                    <input
                        id="timestamp"
                        type="datetime-local"
                        value={timestamp}
                        onChange={(e) => setTimestamp(e.target.value)}
                    />
                </div>
                {/* Wysłanie formularza klawiszem Enter działa domyślnie w formularzach */}
                <button type="submit" className="btn-submit">Dodaj (lub Enter)</button>
            </form>
        </section>
    );
}

export default MeasurementForm;