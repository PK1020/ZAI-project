const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Measurements
 *   description: Operacje na pomiarach
 */


// GET /api/measurements - Pobieranie pomiarów (publiczne)
// Filtrowanie (parametry zapytania)
// /api/measurements?series_id=1,2&start=...&end=...

/**
 * @swagger
 * /api/measurements:
 *   get:
 *     summary: Pobierz pomiary (z możliwością filtrowania)
 *     tags: [Measurements]
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date-time
 *         required: false
 *         description: Początek przedziału czasu
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date-time
 *         required: false
 *         description: Koniec przedziału czasu
 *       - in: query
 *         name: seriesIds
 *         schema:
 *           type: string
 *         required: false
 *         description: Lista ID serii (np. "1,2,3")
 *     responses:
 *       200:
 *         description: Lista pomiarów
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Measurement'
 */


router.get('/', async (req, res) => {
    const { series_id, start, end } = req.query;

    let query = `
    SELECT m.id, m.value, m.timestamp, m.series_id, s.name AS series_name, s.color 
    FROM measurements m
    JOIN series s ON m.series_id = s.id
  `;
    const params = [];
    let whereClause = [];

    if (series_id) {
        const ids = series_id.split(',').map(id => parseInt(id));
        params.push(ids);
        whereClause.push(`m.series_id = ANY($${params.length})`);
    }
    if (start) {
        params.push(start);
        whereClause.push(`m.timestamp >= $${params.length}`);
    }
    if (end) {
        params.push(end);
        whereClause.push(`m.timestamp <= $${params.length}`);
    }

    if (whereClause.length > 0) {
        query += ' WHERE ' + whereClause.join(' AND ');
    }
    query += ' ORDER BY m.timestamp DESC';

    try {
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/measurements - Dodawanie pomiaru (tylko zalogowani)

/**
 * @swagger
 * /api/measurements:
 *   post:
 *     summary: Dodaj nowy pomiar
 *     tags: [Measurements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Measurement'
 *     responses:
 *       201:
 *         description: Pomiar został utworzony
 *       400:
 *         description: Błąd walidacji (np. poza zakresem min/max)
 *       401:
 *         description: Brak autoryzacji
 */

router.post('/', verifyToken, async (req, res) => {
    const { value, series_id, timestamp } = req.body;
    if (value == null || series_id == null) {
        return res.status(400).json({ error: 'Brakuje "value" lub "series_id"' });
    }

    // Transakcja, aby zapewnić spójność
    const client = await db.query('BEGIN');

    try {
        // 1. Walidacja (zgodnie z wymaganiami)
        const seriesRes = await db.query('SELECT min_value, max_value FROM series WHERE id = $1', [series_id]);
        if (seriesRes.rows.length === 0) return res.status(404).json({ error: 'Seria nie istnieje' });

        const { min_value, max_value } = seriesRes.rows[0];
        const floatValue = parseFloat(value);

        if (floatValue < min_value || floatValue > max_value) {
            // 400 Bad Request - odrzucenie i komunikacja
            return res.status(400).json({
                error: `Wartość ${floatValue} poza zakresem (${min_value} - ${max_value}).`
            });
        }

        // 2. Wstawienie rekordu
        const query = `
      INSERT INTO measurements (value, series_id, "timestamp") 
      VALUES ($1, $2, $3) RETURNING *
    `;
        const finalTimestamp = timestamp || new Date();
        const result = await db.query(query, [floatValue, series_id, finalTimestamp]);

        await db.query('COMMIT');
        res.status(201).json(result.rows[0]);

    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/measurements/:id - Edycja pomiaru (tylko zalogowani)

/**
 * @swagger
 * /api/series/{id}:
 *   put:
 *     summary: Edytuj istniejącą serię
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID serii
 *     responses:
 *       200:
 *         description: Seria zaktualizowana
 *       404:
 *         description: Seria nie istnieje
 */

router.put('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { value, series_id, timestamp } = req.body;

    // Podstawowa walidacja
    if (value == null || series_id == null || timestamp == null) {
        return res.status(400).json({ error: 'Brakuje "value", "series_id" lub "timestamp"' });
    }

    // W tym prostym przypadku nie używamy pełnej transakcji,
    // ale wykonujemy najważniejszy krok: Walidację PRZED zapisem.
    try {
        // 1. Walidacja (taka sama jak w POST)
        // Sprawdzamy, czy nowa wartość pasuje do zakresu (potencjalnie nowej) serii
        const seriesRes = await db.query('SELECT min_value, max_value FROM series WHERE id = $1', [series_id]);

        if (seriesRes.rows.length === 0) {
            return res.status(404).json({ error: 'Wybrana seria nie istnieje' });
        }

        const { min_value, max_value } = seriesRes.rows[0];
        const floatValue = parseFloat(value);

        // Sprawdzamy, czy nowa wartość mieści się w zakresie
        if (floatValue < min_value || floatValue > max_value) {
            // Odrzucenie i komunikacja (zgodnie z wymaganiami)
            return res.status(400).json({
                error: `Wartość ${floatValue} poza zakresem (${min_value} - ${max_value}).`
            });
        }

        // 2. Jeśli walidacja przeszła, aktualizujemy rekord
        const query = `
      UPDATE measurements 
      SET value = $1, series_id = $2, "timestamp" = $3
      WHERE id = $4
      RETURNING *
    `;

        const result = await db.query(query, [floatValue, series_id, timestamp, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Nie znaleziono pomiaru do zaktualizowania' });
        }

        // Zwracamy zaktualizowany rekord
        res.status(200).json(result.rows[0]);

    } catch (err) {
        // Łapiemy błędy bazy danych lub inne błędy serwera
        console.error(err); // Ważne dla debugowania na serwerze
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/measurements/:id - Usuwanie pomiaru (tylko zalogowani)

/**
 * @swagger
 * /api/series/{id}:
 *   delete:
 *     summary: Usuń serię
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID serii
 *     responses:
 *       204:
 *         description: Seria została usunięta
 *       404:
 *         description: Seria nie istnieje
 */

router.delete('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM measurements WHERE id = $1', [id]);
        res.status(204).send(); // 204 No Content - standard dla DELETE
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;