const express = require('express');
const { getDb } = require('../database/init');
const { validateQuery, limitSchema, offsetSchema } = require('../validator');

const router = express.Router();

/**
 * @swagger
 * /api/v1/search:
 *   get:
 *     summary: Busca versículos por palavra ou frase (FTS5)
 *     description: Usa busca full-text (FTS5) do SQLite para resultados mais precisos e rápidos.
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Palavra ou frase para buscar
 *       - in: query
 *         name: bibleId
 *         schema:
 *           type: string
 *         description: ID da versão bíblica
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
 *         description: Resultados da busca
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
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     query:
 *                       type: string
 *       400:
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', (req, res) => {
  try {
    const { q, bibleId } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        error: 'O parâmetro q (query) é obrigatório'
      });
    }

    const { result, errors } = validateQuery(req.query, {
      limit: limitSchema,
      offset: offsetSchema
    });

    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        error: `Parâmetros inválidos: ${errors.join(', ')}`
      });
    }

    const { limit = 20, offset = 0 } = result;

    const db = getDb();

    // Use FTS5 for full-text search
    let ftsQuery = `
      SELECT v.id, v.number as verse_number, v.text, 
             c.number as chapter_number,
             b.id as book_id, b.number as book_number, b.name as book_name, 
             b.short_name as book_short_name, b.testament,
             rank
      FROM verses v
      INNER JOIN verses_fts vf ON v.id = vf.rowid
      JOIN chapters c ON v.chapter_id = c.id
      JOIN books b ON v.book_id = b.id
      WHERE verses_fts MATCH ?
    `;
    const ftsParams = [q];

    if (bibleId) {
      ftsQuery += ' AND v.bible_id = ?';
      ftsParams.push(bibleId);
    }

    // Count total
    const countQuery = ftsQuery.replace(
      'SELECT v.id, v.number as verse_number, v.text, \n             c.number as chapter_number,\n             b.id as book_id, b.number as book_number, b.name as book_name, \n             b.short_name as book_short_name, b.testament,\n             rank',
      'SELECT COUNT(*) as total'
    );
    const total = db.prepare(countQuery).get(...ftsParams).total;

    ftsQuery += ' ORDER BY rank LIMIT ? OFFSET ?';
    ftsParams.push(limit, offset);

    let results = db.prepare(ftsQuery).all(...ftsParams);

    // Fallback to LIKE if FTS returns no results
    if (results.length === 0) {
      let likeQuery = `
        SELECT v.number as verse_number, v.text, 
               c.number as chapter_number,
               b.id as book_id, b.number as book_number, b.name as book_name, 
               b.short_name as book_short_name, b.testament
        FROM verses v
        JOIN chapters c ON v.chapter_id = c.id
        JOIN books b ON v.book_id = b.id
        WHERE v.text LIKE ?
      `;
      const likeParams = [`%${q}%`];

      if (bibleId) {
        likeQuery += ' AND v.bible_id = ?';
        likeParams.push(bibleId);
      }

      const likeTotal = db.prepare(likeQuery.replace('SELECT v.number as verse_number, v.text, \n               c.number as chapter_number,\n               b.id as book_id, b.number as book_number, b.name as book_name, \n               b.short_name as book_short_name, b.testament', 'SELECT COUNT(*) as total')).get(...likeParams).total;

      likeQuery += ' ORDER BY b.number, c.number, v.number LIMIT ? OFFSET ?';
      likeParams.push(limit, offset);

      results = db.prepare(likeQuery).all(...likeParams);

      const finalTotal = likeTotal;
      return res.json({
        status: 'success',
        data: results,
        meta: {
          page: Math.floor(offset / limit) + 1,
          limit,
          total: finalTotal,
          totalPages: Math.ceil(finalTotal / limit),
          query: q
        }
      });
    }

    res.json({
      status: 'success',
      data: results,
      meta: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        query: q
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar os versículos'
    });
  }
});

module.exports = router;
