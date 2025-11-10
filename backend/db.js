// Używamy puli połączeń dla wydajności i bezpieczeństwa
const { Pool } = require('pg');
require('dotenv').config();

// Sprawdzamy, czy łączymy się z bazą w chmurze (Render)
const isRender = process.env.DATABASE_URL &&
  process.env.DATABASE_URL.includes('render.com');

// Konfigurujemy pulę połączeń
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render wymaga SSL/TLS
  ...(isRender && {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  }),
});

// Eksportujemy metodę query, która automatycznie parametryzuje zapytania
// (ochrona przed SQL injection)
module.exports = {
  query: (text, params) => pool.query(text, params),
};
