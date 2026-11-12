const express = require('express');
const { getDb } = require('../database/init');

const router = express.Router();

/**
 * @swagger
 * /api/v1/random-verse:
 *   get:
 *     summary: Retorna um versículo aleatório
 *     tags: [Random]
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
 *     responses:
 *       200:
 *         description: Versículo aleatório
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { bibleId, testament } = req.query;

    let query = `
      SELECT v.number as verse_number, v.text, 
             c.number as chapter_number,
             b.id as book_id, b.number as book_number, b.name as book_name, b.short_name as book_short_name, b.testament
      FROM verses v
      JOIN chapters c ON v.chapter_id = c.id
      JOIN books b ON v.book_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (bibleId) {
      query += ' AND v.bible_id = ?';
      params.push(bibleId);
    }

    if (testament) {
      query += ' AND b.testament = ?';
      params.push(testament);
    }

    query += ' ORDER BY RANDOM() LIMIT 1';

    const verse = db.prepare(query).get(...params);

    if (!verse) {
      return res.status(404).json({
        status: 'error',
        error: 'Nenhum versículo encontrado'
      });
    }

    res.json({
      status: 'success',
      data: verse
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar o versículo aleatório'
    });
  }
});

module.exports = router;
