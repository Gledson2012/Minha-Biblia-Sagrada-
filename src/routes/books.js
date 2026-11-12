const express = require('express');
const { getDb } = require('../database/init');
const { validateQuery, testamentSchema, limitSchema, offsetSchema } = require('../validator');

const router = express.Router();

/**
 * @swagger
 * /api/v1/books:
 *   get:
 *     summary: Lista todos os livros da Bíblia
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: bibleId
 *         schema:
 *           type: string
 *         description: ID da versão bíblica
 *       - in: query
 *         name: testament
 *         schema:
 *           type: string
 *           enum: [Antigo Testamento, Novo Testamento]
 *         description: Filtrar por testamento
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Número máximo de resultados
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset para paginação
 *     responses:
 *       200:
 *         description: Lista de livros bíblicos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: array
 *                 meta:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', (req, res) => {
  try {
    const { result, errors } = validateQuery(req.query, {
      testament: testamentSchema,
      limit: limitSchema,
      offset: offsetSchema
    });

    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        error: `Parâmetros inválidos: ${errors.join(', ')}`
      });
    }

    const { bibleId, testament, limit = 20, offset = 0 } = { ...req.query, ...result };

    const db = getDb();

    let query = `
      SELECT b.id, b.number, b.testament, b.name, b.short_name, b.chapters_count, bi.name as bible_name
      FROM books b
      JOIN bibles bi ON b.bible_id = bi.id
      WHERE 1=1
    `;
    const params = [];

    if (bibleId) {
      query += ' AND b.bible_id = ?';
      params.push(bibleId);
    }

    if (testament) {
      query += ' AND b.testament = ?';
      params.push(testament);
    }

    // Count total
    const countQuery = query.replace('SELECT b.id, b.number, b.testament, b.name, b.short_name, b.chapters_count, bi.name as bible_name', 'SELECT COUNT(*) as total');
    const total = db.prepare(countQuery).get(...params).total;

    query += ' ORDER BY b.number LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const books = db.prepare(query).all(...params);

    res.json({
      status: 'success',
      data: books,
      meta: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar os livros da Bíblia'
    });
  }
});

/**
 * @swagger
 * /api/v1/books/{bookId}:
 *   get:
 *     summary: Retorna os detalhes de um livro específico
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do livro
 *     responses:
 *       200:
 *         description: Detalhes do livro
 *       404:
 *         description: Livro não encontrado
 */
router.get('/:bookId', (req, res) => {
  try {
    const db = getDb();
    const book = db.prepare(`
      SELECT b.id, b.number, b.testament, b.name, b.short_name, b.chapters_count, bi.name as bible_name
      FROM books b
      JOIN bibles bi ON b.bible_id = bi.id
      WHERE b.id = ?
    `).get(req.params.bookId);

    if (!book) {
      return res.status(404).json({
        status: 'error',
        error: 'Livro não encontrado'
      });
    }

    res.json({
      status: 'success',
      data: book
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar o livro'
    });
  }
});

module.exports = router;
