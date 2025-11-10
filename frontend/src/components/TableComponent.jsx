import React from 'react';

// Props:
// - data: pełna lista pomiarów
// - isEditable: boolean (czy użytkownik jest zalogowany)
// - onRowClick: callback (id) po kliknięciu wiersza
// - onEdit: callback (obiekt pomiaru)
// - onDelete: callback (id)
// - highlightedPointId: ID punktu do podświetlenia wiersza
function TableComponent({ data, isEditable, onRowClick, onEdit, onDelete, highlightedPointId }) {

    return (
        <div className="table-container">
            <table>
                <thead>
                <tr>
                    <th>Seria</th>
                    <th>Wartość</th>
                    <th>Czas</th>
                    {isEditable && <th className="no-print">Akcje</th>}
                </tr>
                </thead>
                <tbody>
                {data.length === 0 && (
                    <tr>
                        <td colSpan={isEditable ? 4 : 3} style={{ textAlign: 'center' }}>
                            Brak danych do wyświetlenia.
                        </td>
                    </tr>
                )}
                {data.map(m => (
                    <tr
                        key={m.id}
                        onClick={() => onRowClick(m.id)}
                        // Podświetlanie wiersza (zgodnie z wymaganiami)
                        className={m.id === highlightedPointId ? 'highlighted' : ''}
                    >
                        <td style={{ color: m.color, fontWeight: 'bold' }}>{m.series_name}</td>
                        <td>{m.value} °C</td>
                        <td>{new Date(m.timestamp).toLocaleString('pl-PL')}</td>

                        {/* Przyciski CRUD widoczne tylko dla zalogowanych */}
                        {isEditable && (
                            <td className="no-print actions-cell">
                                {/* Zatrzymujemy propagację, aby kliknięcie przycisku
                      nie wywołało 'onRowClick' dla całego wiersza */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit(m); }}
                                    className="btn-edit"
                                >
                                    Edytuj
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(m.id); }}
                                    className="btn-delete"
                                >
                                    Usuń
                                </button>
                            </td>
                        )}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default TableComponent;