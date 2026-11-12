const express = require('express');
const { getDb } = require('../database/init');

const router = express.Router();

/**
 * @swagger
 * /api/v1/verse-of-the-day:
 *   get:
 *     summary: Retorna o versículo do dia
 *     tags: [Verse of the Day]
 *     parameters:
 *       - in: query
 *         name: bibleId
 *         schema:
 *           type: string
 *         description: ID da versão bíblica
 *     responses:
 *       200:
 *         description: Versículo do dia
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { bibleId } = req.query;

    // Use the day of year to select a deterministic verse
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

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

    // Use day of year as offset for deterministic selection
    query += ' ORDER BY b.number, c.number, v.number LIMIT 1 OFFSET ?';
    params.push(dayOfYear % 1000);

    const verse = db.prepare(query).get(...params);

    if (!verse) {
      // Fallback to first verse if offset is too large
      const fallback = db.prepare(`
        SELECT v.number as verse_number, v.text, 
               c.number as chapter_number,
               b.id as book_id, b.number as book_number, b.name as book_name, b.short_name as book_short_name, b.testament
        FROM verses v
        JOIN chapters c ON v.chapter_id = c.id
        JOIN books b ON v.book_id = b.id
        ORDER BY b.number, c.number, v.number LIMIT 1
      `).get();

      if (!fallback) {
        return res.status(404).json({
          status: 'error',
          error: 'Nenhum versículo encontrado'
        });
      }

      return res.json({
        status: 'success',
        data: fallback
      });
    }

    res.json({
      status: 'success',
      data: verse
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar o versículo do dia'
    });
  }
});

module.exports = router;
