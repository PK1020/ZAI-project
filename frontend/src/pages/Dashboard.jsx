import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

import ChartComponent from '../components/ChartComponent.jsx';
import TableComponent from '../components/TableComponent.jsx';
import MeasurementForm from '../components/MeasurementForm.jsx';
import EditMeasurementModal from '../components/EditMeasurementModal.jsx';

const API_URL = import.meta.env.VITE_API_URL || '';

function Dashboard() {
    const { isAuthenticated, user } = useAuth();
    const [measurements, setMeasurements] = useState([]);
    const [series, setSeries] = useState([]);
    const [error, setError] = useState(null);
    const [highlightedPointId, setHighlightedPointId] = useState(null);
    const [editingRecord, setEditingRecord] = useState(null);

    const [filters, setFilters] = useState({
        start: '',
        end: '',
        selectedSeries: new Set()
    });

    const fetchSeries = () => {
        axios.get(`${API_URL}/api/series`)
            .then(res => {
                setSeries(res.data);
                setFilters(prev => ({
                    ...prev,
                    selectedSeries: new Set(res.data.map(s => s.id))
                }));
            })
            .catch(err => setError('Nie można pobrać serii'));
    };

    const fetchMeasurements = () => {
        setError(null);
        axios.get(`${API_URL}/api/measurements`, {
            params: {
                start: filters.start || null,
                end: filters.end || null,
                series_id: Array.from(filters.selectedSeries).join(',') || null
            }
        })
            .then(res => setMeasurements(res.data))
            .catch(err => setError('Nie można pobrać pomiarów'));
    };

    useEffect(() => {
        fetchSeries();
        fetchMeasurements();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchMeasurements();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.start, filters.end, filters.selectedSeries]);

    const handlePrint = () => {
        window.print();
    };

    const handleRowClick = (id) => {
        setHighlightedPointId(prevId => (prevId === id ? null : id));
    };

    const handleDelete = async (id) => {
        if (window.confirm('Czy na pewno chcesz usunąć ten pomiar?')) {
            try {
                await axios.delete(`${API_URL}/api/measurements/${id}`);
                fetchMeasurements();
            } catch (err) {
                setError('Nie udało się usunąć pomiaru.');
            }
        }
    };

    const handleSaveEdit = async (updatedRecord) => {
        try {
            await axios.put(`${API_URL}/api/measurements/${updatedRecord.id}`, {
                value: updatedRecord.value,
                series_id: updatedRecord.series_id,
                timestamp: updatedRecord.timestamp,
            });
            setEditingRecord(null);
            fetchMeasurements();
        } catch (err) {
            setError('Nie udało się zaktualizować pomiaru.');
        }
    };

    const handleSeriesToggle = (seriesId) => {
        setHighlightedPointId(null);
        const newSelection = new Set(filters.selectedSeries);
        if (newSelection.has(seriesId)) {
            newSelection.delete(seriesId);
        } else {
            newSelection.add(seriesId);
        }
        setFilters(prev => ({ ...prev, selectedSeries: newSelection }));
    };

    const handleFiltersChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="dashboard-container">
            {error && <div className="message-error">{error}</div>}
            {isAuthenticated && (
                <div className="message-success">
                    Witaj, <strong>{user?.username}</strong>! Możesz teraz edytować dane.
                </div>
            )}

            <section className="filters-section no-print">
                <fieldset>
                    <legend>Wybierz serie</legend>
                    {series.map(s => (
                        <label key={s.id} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={filters.selectedSeries.has(s.id)}
                                onChange={() => handleSeriesToggle(s.id)}
                            />
                            {s.name}
                        </label>
                    ))}
                </fieldset>

                <fieldset>
                    <legend>Ogranicz przedział czasu</legend>
                    <label>
                        Od:{' '}
                        <input
                            type="datetime-local"
                            value={filters.start}
                            onChange={e => handleFiltersChange('start', e.target.value)}
                        />
                    </label>
                    <label>
                        Do:{' '}
                        <input
                            type="datetime-local"
                            value={filters.end}
                            onChange={e => handleFiltersChange('end', e.target.value)}
                        />
                    </label>
                    <button type="button" onClick={fetchMeasurements} className="btn-filter">
                        Filtruj Czas
                    </button>
                </fieldset>
            </section>

            <MeasurementForm
                series={series}
                onMeasurementAdded={fetchMeasurements}
                setError={setError}
            />

            <section className="chart-table-section">
                <div className="chart-wrapper">
                    <h2>Wykres</h2>
                    <ChartComponent
                        data={measurements}
                        highlightedPointId={highlightedPointId}
                        onPointClick={setHighlightedPointId}
                    />
                </div>

                <div className="table-wrapper">
                    <h2>Tabela Danych</h2>
                    <TableComponent
                        data={measurements}
                        highlightedPointId={highlightedPointId}
                        onRowClick={handleRowClick}
                        onDelete={handleDelete}
                        onEdit={setEditingRecord}
                    />
                    <button onClick={handlePrint} className="btn-print no-print">
                        Drukuj Widok
                    </button>
                </div>
            </section>

            {editingRecord && (
                <EditMeasurementModal
                    record={editingRecord}
                    series={series}
                    onClose={() => setEditingRecord(null)}
                    onSave={handleSaveEdit}
                    setError={setError}
                />
            )}
        </div>
    );
}

export default Dashboard;
