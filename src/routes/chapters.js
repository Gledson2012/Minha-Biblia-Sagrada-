const express = require('express');
const { getDb } = require('../database/init');

const router = express.Router();

/**
 * @swagger
 * /api/v1/chapters:
 *   get:
 *     summary: Lista os capítulos de um livro
 *     tags: [Chapters]
 *     parameters:
 *       - in: query
 *         name: bookId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do livro
 *       - in: query
 *         name: bibleId
 *         schema:
 *           type: string
 *         description: ID da versão bíblica
 *     responses:
 *       200:
 *         description: Lista de capítulos
 *       404:
 *         description: Livro não encontrado
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { bookId, bibleId } = req.query;

    if (!bookId) {
      return res.status(400).json({
        status: 'error',
        error: 'O parâmetro bookId é obrigatório'
      });
    }

    let query = `
      SELECT c.id, c.number, c.verses_count, b.name as book_name, b.short_name as book_short_name
      FROM chapters c
      JOIN books b ON c.book_id = b.id
      WHERE c.book_id = ?
    `;
    const params = [bookId];

    if (bibleId) {
      query += ' AND c.bible_id = ?';
      params.push(bibleId);
    }

    query += ' ORDER BY c.number';

    const chapters = db.prepare(query).all(...params);

    if (chapters.length === 0) {
      return res.status(404).json({
        status: 'error',
        error: 'Capítulos não encontrados'
      });
    }

    res.json({
      status: 'success',
      data: chapters
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar os capítulos'
    });
  }
});

/**
 * @swagger
 * /api/v1/chapters/{chapterId}:
 *   get:
 *     summary: Retorna um capítulo com todos os seus versículos
 *     tags: [Chapters]
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do capítulo
 *     responses:
 *       200:
 *         description: Capítulo com versículos
 *       404:
 *         description: Capítulo não encontrado
 */
router.get('/:chapterId', (req, res) => {
  try {
    const db = getDb();

    const chapter = db.prepare(`
      SELECT c.id, c.number, c.verses_count, b.id as book_id, b.name as book_name, b.short_name as book_short_name, b.number as book_number
      FROM chapters c
      JOIN books b ON c.book_id = b.id
      WHERE c.id = ?
    `).get(req.params.chapterId);

    if (!chapter) {
      return res.status(404).json({
        status: 'error',
        error: 'Capítulo não encontrado'
      });
    }

    const verses = db.prepare(`
      SELECT number, text
      FROM verses
      WHERE chapter_id = ?
      ORDER BY number
    `).all(req.params.chapterId);

    res.json({
      status: 'success',
      data: {
        ...chapter,
        verses
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar o capítulo'
    });
  }
});

module.exports = router;
