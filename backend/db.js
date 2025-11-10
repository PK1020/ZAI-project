// Używamy puli połączeń dla wydajności i bezpieczeństwa
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Eksportujemy metodę query, która automatycznie parametryzuje zapytania
// (OCHRONA PRZED SQL INJECTION)
module.exports = {
    query: (text, params) => pool.query(text, params),
};