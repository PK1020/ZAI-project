// backend/routes/auth.js

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const verifyToken = require('../middleware/authMiddleware'); // jeśli u Ciebie nazywa się inaczej, popraw ścieżkę

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Uwierzytelnianie użytkowników
 */

// ============================
// POST /auth/login
// ============================

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Logowanie użytkownika
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Zwraca token JWT i dane użytkownika
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Brak loginu lub hasła
 *       401:
 *         description: Nieprawidłowe dane logowania
 */

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: 'Nazwa użytkownika i hasło są wymagane' });
  }

  try {
    const result = await db.query(
      'SELECT id, username, password_hash FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ message: 'Nieprawidłowe dane logowania' });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ message: 'Nieprawidłowe dane logowania' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res
      .status(500)
      .json({ message: 'Błąd serwera podczas logowania' });
  }
});

// ============================
// POST /auth/register – rejestracja nowego użytkownika
// ============================

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Rejestracja nowego użytkownika
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Użytkownik został utworzony
 *       400:
 *         description: Brak loginu lub hasła
 *       409:
 *         description: Użytkownik o podanej nazwie już istnieje
 */

router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: 'Nazwa użytkownika i hasło są wymagane' });
  }

  try {
    // czy user już istnieje?
    const existing = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    if (existing.rows.length > 0) {
      return res
        .status(409)
        .json({ message: 'Użytkownik o takiej nazwie już istnieje' });
    }

    // hash hasła
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // zapis do bazy
    await db.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
      [username, passwordHash]
    );

    return res
      .status(201)
      .json({ message: 'Użytkownik został utworzony. Możesz się zalogować.' });
  } catch (err) {
    console.error('Register error:', err);
    return res
      .status(500)
      .json({ message: 'Błąd serwera podczas tworzenia użytkownika' });
  }
});

// ============================
// PUT /auth/change-password – zmiana hasła
// ============================

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Zmiana hasła zalogowanego użytkownika
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Hasło zostało zmienione
 *       400:
 *         description: Brakuje pól w żądaniu
 *       401:
 *         description: Brak autoryzacji lub błędne stare hasło
 */


router.put('/change-password', verifyToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user && req.user.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Brak autoryzacji' });
  }

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: 'Stare i nowe hasło są wymagane' });
  }

  try {
    const userResult = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Użytkownik nie istnieje' });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: 'Stare hasło jest nieprawidłowe' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newHash, userId]
    );

    return res.status(200).json({ message: 'Hasło zostało zmienione' });
  } catch (err) {
    console.error('Change password error:', err);
    return res
      .status(500)
      .json({ message: 'Błąd serwera podczas zmiany hasła' });
  }
});

module.exports = router;
