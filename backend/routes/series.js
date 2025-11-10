const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Series
 *   description: Operacje na seriach pomiarowych
 */

// GET /api/series - Pobieranie wszystkich serii (publiczne)

/**
 * @swagger
 * /api/series:
 *   get:
 *     summary: Pobierz wszystkie serie pomiarowe
 *     tags: [Series]
 *     responses:
 *       200:
 *         description: Lista serii
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Series'
 */


router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM series ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/series - Tworzenie serii (tylko zalogowani)

/**
 * @swagger
 * /api/series:
 *   post:
 *     summary: Dodaj nową serię pomiarową
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Series'
 *     responses:
 *       201:
 *         description: Seria została utworzona
 *       400:
 *         description: Błąd walidacji
 *       401:
 *         description: Brak autoryzacji
 */


router.post('/', verifyToken, async (req, res) => {
    const { name, min_value, max_value, color, icon } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO series (name, min_value, max_value, color, icon) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, min_value, max_value, color || '#000000', icon]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/series/:id - Edycja serii (tylko zalogowani)

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
    const { name, min_value, max_value, color, icon } = req.body;
    try {
        const result = await db.query(
            'UPDATE series SET name = $1, min_value = $2, max_value = $3, color = $4, icon = $5 WHERE id = $6 RETURNING *',
            [name, min_value, max_value, color, icon, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Nie znaleziono serii' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/series/:id - Usuwanie serii (tylko zalogowani)

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
        const result = await db.query('DELETE FROM series WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Nie znaleziono serii' });
        res.status(200).json({ message: 'Seria usunięta', deleted: result.rows[0] });
    } catch (err) {
        // Błąd klucza obcego, jeśli seria ma pomiary (jeśli nie ma ON DELETE CASCADE)
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;