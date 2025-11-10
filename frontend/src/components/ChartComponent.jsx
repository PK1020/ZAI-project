import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale, // Ważne dla osi czasu
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // Poprawny import adaptera daty

// Rejestracja komponentów Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    TimeScale,
    Title,
    Tooltip,
    Legend
);

// Props:
// - data: pełna lista pomiarów
// - selectedSeries: Set() z ID serii, które mają być widoczne
// - highlightedPointId: ID punktu, który ma być podświetlony
function ChartComponent({ data, selectedSeries, highlightedPointId }) {

    const chartData = useMemo(() => {
        // Grupujemy pomiary po serii
        const groupedBySeries = data.reduce((acc, m) => {
            // Filtrujemy tylko zaznaczone serie
            if (!selectedSeries.has(m.series_id)) {
                return acc;
            }

            if (!acc[m.series_id]) {
                acc[m.series_id] = {
                    label: m.series_name,
                    data: [],
                    borderColor: m.color,
                    backgroundColor: m.color,
                };
            }
            // Dodajemy ID do danych punktu, aby móc je podświetlić
            acc[m.series_id].data.push({
                x: new Date(m.timestamp),
                y: m.value,
                id: m.id // Przekazujemy ID do kontekstu wykresu
            });
            return acc;
        }, {});

        return { datasets: Object.values(groupedBySeries) };
    }, [data, selectedSeries]); // Przelicz tylko, gdy zmienią się dane lub filtry

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: 'time', // Oś X jako czas
                time: {
                    tooltipFormat: 'dd.MM.yyyy HH:mm:ss',
                },
                title: {
                    display: true,
                    text: 'Czas',
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Temperatura (°C)',
                },
            },
        },
        // Logika podświetlania punktu (zgodnie z wymaganiami)
        elements: {
            point: {
                radius: (context) => {
                    // Pobieramy nasz 'id' z danych punktu
                    const pointId = context.raw?.id;
                    return pointId === highlightedPointId ? 10 : 3; // 10px jeśli podświetlony
                },
                hoverRadius: (context) => {
                    const pointId = context.raw?.id;
                    return pointId === highlightedPointId ? 12 : 6;
                }
            }
        }
    };

    return (
        <div className="chart-container">
            <Line options={chartOptions} data={chartData} />
        </div>
    );
}

export default ChartComponent;