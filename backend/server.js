require('dotenv').config();
const express = require('express');
const cors = require('cors');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

// Importowanie routerów
const { connectDB } = require('./db');
const authRoutes = require('./routes/auth');
const seriesRoutes = require('./routes/series');
const measurementRoutes = require('./routes/measurements');

const app = express();

// Middleware
app.use(cors()); // Umożliwia żądania z Reacta
app.use(express.json()); // Parsowanie body jako JSON

// 🔹 Swagger UI pod /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Definiowanie API (zgodne z REST)
app.use('/auth', authRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/measurements', measurementRoutes);

// Prosty endpoint "health check"
app.get('/', (req, res) => {
    res.send('API działa. Dokumentacja: /api-docs');
  });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📘 Swagger docs available at http://localhost:${PORT}/api-docs`);
  });