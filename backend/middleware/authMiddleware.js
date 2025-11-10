const jwt = require('jsonwebtoken');

// Middleware do weryfikacji tokenu JWT
function verifyToken(req, res, next) {
    // Token jest przesyłany w nagłówku "Authorization" w formacie "Bearer TOKEN"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        // 401 Unauthorized - brak tokenu
        return res.status(401).json({ error: 'Brak tokenu uwierzytelniającego' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            // 403 Forbidden - token jest, ale nieprawidłowy
            return res.status(403).json({ error: 'Nieważny token' });
        }
        // Przypisujemy zdekodowane dane użytkownika (np. id) do obiektu req
        req.user = user;
        next(); // Przejście do następnej funkcji (kontrolera)
    });
}

module.exports = verifyToken;