import React, { useState, useEffect } from 'react';
import axios from 'axios';


function EditMeasurementModal({ record, series, onClose, onSave, setError }) {
    const [formData, setFormData] = useState({ ...record });
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        // Formatowanie daty dla inputu datetime-local
        const localDate = new Date(record.timestamp);
        localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
        const formattedTimestamp = localDate.toISOString().slice(0, 16);

        setFormData({
            ...record,
            timestamp: formattedTimestamp,
            value: record.value,
            series_id: record.series_id,
        });
    }, [record]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setError(null);

        try {
            const payload = {
                value: parseFloat(formData.value),
                series_id: parseInt(formData.series_id),
                timestamp: new Date(formData.timestamp).toISOString(),
            };

            // Używamy endpointu PUT
            await axios.put(`/api/measurements/${record.id}`, payload);

            onSave();
            onClose();

        } catch (err) {
            if (err.response && err.response.data && err.response.data.error) {
                setLocalError(err.response.data.error);
            } else {
                setLocalError('Nie udało się zapisać zmian.');
            }
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-content">
                <h2>Edytuj Pomiar (ID: {record.id})</h2>
                {localError && <div className="message-error">{localError}</div>}

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="edit-series">Seria:</label>
                        <select
                            id="edit-series"
                            name="series_id"
                            value={formData.series_id}
                            onChange={handleChange}
                            required
                        >
                            {series.map(s => (
                                <option key={s.id} value={s.id}>
                                    {/* Wersja bez ikony */}
                                    {s.name} (Zakres: {s.min_value} - {s.max_value})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-value">Temperatura:</label>
                        <input
                            id="edit-value"
                            name="value"
                            type="number"
                            step="0.01"
                            value={formData.value}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="edit-timestamp">Znacznik czasu:</label>
                        <input
                            id="edit-timestamp"
                            name="timestamp"
                            type="datetime-local"
                            value={formData.timestamp}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">Anuluj</button>
                        <button type="submit" className="btn-submit">Zapisz zmiany</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditMeasurementModal;