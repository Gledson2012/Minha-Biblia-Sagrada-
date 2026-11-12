require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { initDb, closeDb } = require('./database/init');
const { logger, httpLogger, rateLimiter, cacheMiddleware } = require('./middleware');
const { getBookIdByName } = require('./validator');

// Import routes
const biblesRouter = require('./routes/bibles');
const booksRouter = require('./routes/books');
const chaptersRouter = require('./routes/chapters');
const versesRouter = require('./routes/verses');
const referenceRouter = require('./routes/reference');
const randomVerseRouter = require('./routes/random-verse');
const verseOfTheDayRouter = require('./routes/verse-of-the-day');
const searchRouter = require('./routes/search');

const app = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = '/api/v1';

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bíblia Sagrada API',
      version: '2.0.0',
      description: 'API REST para acesso aos textos bíblicos. Inspirada na Holy Bible API (holy-bible-api.com), esta API fornece acesso estruturado aos livros, capítulos e versículos da Bíblia em português.',
      contact: {
        name: 'API Support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor local de desenvolvimento'
      }
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            error: { type: 'string', example: 'Mensagem de erro' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 5 }
          }
        }
      }
    },
    tags: [
      { name: 'Bibles', description: 'Versões da Bíblia' },
      { name: 'Books', description: 'Livros bíblicos' },
      { name: 'Chapters', description: 'Capítulos' },
      { name: 'Verses', description: 'Versículos' },
      { name: 'Reference', description: 'Referência rápida por nome' },
      { name: 'Random', description: 'Versículos aleatórios' },
      { name: 'Verse of the Day', description: 'Versículo do dia' },
      { name: 'Search', description: 'Busca de versículos' },
      { name: 'Health', description: 'Status do servidor' }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(cors());
app.use(express.json());
app.use(httpLogger);
app.use(rateLimiter);
app.use(cacheMiddleware(300));

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Bíblia Sagrada API - Documentação'
}));

// Raw Swagger JSON spec
app.get('/swagger.json', (req, res) => {
  res.json(swaggerSpec);
});

// Health check endpoint
/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Verifica o status do servidor
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Servidor está funcionando
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                 uptime:
 *                   type: number
 *                 version:
 *                   type: string
 *                 database:
 *                   type: string
 */
app.get(`${API_PREFIX}/health`, (req, res) => {
  try {
    const { getDb } = require('./database/init');
    const db = getDb();
    const verseCount = db.prepare('SELECT COUNT(*) as count FROM verses').get();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '2.0.0',
      database: {
        connected: true,
        versesCount: verseCount.count
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Erro ao verificar o status do servidor'
    });
  }
});

// API routes
app.use(`${API_PREFIX}/bibles`, biblesRouter);
app.use(`${API_PREFIX}/books`, booksRouter);
app.use(`${API_PREFIX}/chapters`, chaptersRouter);
app.use(`${API_PREFIX}/verses`, versesRouter);
app.use(`${API_PREFIX}/reference`, referenceRouter);
app.use(`${API_PREFIX}/random-verse`, randomVerseRouter);
app.use(`${API_PREFIX}/verse-of-the-day`, verseOfTheDayRouter);
app.use(`${API_PREFIX}/search`, searchRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Bíblia Sagrada API',
    version: '2.0.0',
    description: 'API REST para acesso aos textos bíblicos',
    documentation: '/docs',
    endpoints: {
      bibles: `${API_PREFIX}/bibles`,
      books: `${API_PREFIX}/books`,
      chapters: `${API_PREFIX}/chapters`,
      verses: `${API_PREFIX}/verses`,
      reference: `${API_PREFIX}/reference/:bookName/:chapter/:verse`,
      randomVerse: `${API_PREFIX}/random-verse`,
      verseOfTheDay: `${API_PREFIX}/verse-of-the-day`,
      search: `${API_PREFIX}/search`,
      health: `${API_PREFIX}/health`
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    error: 'Endpoint não encontrado'
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error({ err }, 'Erro interno do servidor');
  res.status(500).json({
    status: 'error',
    error: 'Erro interno do servidor'
  });
});

// Initialize database and start server (apenas quando roda localmente, não no Vercel)
if (require.main === module) {
  initDb();
  app.listen(PORT, () => {
    logger.info({ port: PORT }, '📖 Bíblia Sagrada API rodando');
    logger.info({ docs: `http://localhost:${PORT}/docs` }, '📚 Documentação Swagger');
    logger.info({ health: `http://localhost:${PORT}${API_PREFIX}/health` }, '🏥 Health check');
  });
}

// No Vercel, inicializa o banco a cada cold start
if (process.env.VERCEL) {
  initDb();
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM recebido, fechando o servidor...');
  closeDb();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT recebido, fechando o servidor...');
  closeDb();
  process.exit(0);
});

module.exports = app;
