import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

import ChartComponent from '../components/ChartComponent.jsx';
import TableComponent from '../components/TableComponent.jsx';
import MeasurementForm from '../components/MeasurementForm.jsx';
import EditMeasurementModal from '../components/EditMeasurementModal.jsx';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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
        axios.get(`${API_URL}/series`)
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
        axios.get(`${API_URL}/measurements`, {
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
    }, []);

    const handleTimeFilterApply = () => {
        setHighlightedPointId(null);
        fetchMeasurements();
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

    const handlePrint = () => {
        window.print();
    };

    const handleRowClick = (id) => {
        setHighlightedPointId(prevId => (prevId === id ? null : id));
    };

    const handleDelete = async (id) => {
        if (window.confirm('Czy na pewno chcesz usunąć ten pomiar?')) {
            try {
                await axios.delete(`${API_URL}/measurements/${id}`);
                fetchMeasurements();
            } catch (err) {
                setError('Nie udało się usunąć pomiaru.');
            }
        }
    };

    const handleEdit = (record) => {
        setError(null);
        setEditingRecord(record);
    };

    const handleSaveEdit = () => {
        fetchMeasurements();
        setEditingRecord(null);
    };

    const filteredMeasurements = measurements.filter(m =>
        filters.selectedSeries.has(m.series_id)
    );

    return (
        <div className="dashboard-container">
            {error && <div className="message-error no-print">{error}</div>}

            {isAuthenticated && (
                <div className="welcome-box no-print">
                    Witaj, <strong>{user?.username}</strong>! Możesz teraz edytować dane.
                </div>
            )}

            <div className="controls-bar no-print">
                {/* Pasek filtrów */}
                <fieldset>
                    <legend>Wybierz serie</legend>
                    {series.map(s => (
                        <label key={s.id} style={{ color: s.color, display: 'inline-block', marginRight: '1rem' }}>
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
                    <label>Od: <input type="datetime-local" value={filters.start} onChange={e => setFilters(p => ({ ...p, start: e.target.value }))} /></label>
                    <label>Do: <input type="datetime-local" value={filters.end} onChange={e => setFilters(p => ({ ...p, end: e.target.value }))} /></label>
                    <button onClick={handleTimeFilterApply}>Filtruj Czas</button>
                </fieldset>

                {/* PRZYCISK DRUKOWANIA USUNIĘTY STĄD */}
            </div>

            {isAuthenticated && (
                <MeasurementForm
                    series={series}
                    onMeasurementAdded={fetchMeasurements}
                    setError={setError}
                />
            )}

            {/* NOWA SEKCJA DLA PRZYCISKU DRUKOWANIA (MIĘDZY FORMULARZEM A WYKRESEM) */}
            <div className="print-button-container no-print">
                <button onClick={handlePrint} className="btn-print-main">
                    Drukuj Widok
                </button>
            </div>

            <div className="printable-area">
                <div className="chart-wrapper">
                    <h2>Wykres</h2>
                    <ChartComponent
                        data={measurements}
                        selectedSeries={filters.selectedSeries}
                        highlightedPointId={highlightedPointId}
                    />
                </div>

                <div className="table-wrapper">
                    <h2>Tabela Danych</h2>
                    <TableComponent
                        data={filteredMeasurements}
                        isEditable={isAuthenticated}
                        onRowClick={handleRowClick}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        highlightedPointId={highlightedPointId}
                    />
                </div>
            </div>

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