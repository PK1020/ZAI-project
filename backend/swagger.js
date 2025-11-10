// backend/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Measurements API',
    version: '1.0.0',
    description:
      'Dokumentacja REST API projektu "Aplikacja pomiarowa" (Zaawansowane Aplikacje Internetowe)',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Serwer lokalny',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          username: { type: 'string' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string' },
          password: { type: 'string' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string' },
          password: { type: 'string' },
        },
      },
      Series: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          min_value: { type: 'number' },
          max_value: { type: 'number' },
          color: { type: 'string' },
          icon: { type: 'string' },
        },
      },
      Measurement: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          series_id: { type: 'integer' },
          value: { type: 'number' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'], // tu Swagger będzie szukał komentarzy @swagger
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
