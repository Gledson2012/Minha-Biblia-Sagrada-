const express = require('express');
const { getDb } = require('../database/init');

const router = express.Router();

/**
 * @swagger
 * /api/v1/verses:
 *   get:
 *     summary: Retorna versículos específicos
 *     tags: [Verses]
 *     parameters:
 *       - in: query
 *         name: bibleId
 *         schema:
 *           type: string
 *         description: ID da versão bíblica
 *       - in: query
 *         name: bookId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do livro
 *       - in: query
 *         name: chapter
 *         required: true
 *         schema:
 *           type: integer
 *         description: Número do capítulo
 *       - in: query
 *         name: verse
 *         schema:
 *           type: integer
 *         description: Número do versículo (opcional, retorna todo o capítulo se não informado)
 *       - in: query
 *         name: verseEnd
 *         schema:
 *           type: integer
 *         description: Versículo final do intervalo
 *     responses:
 *       200:
 *         description: Versículos encontrados
 *       404:
 *         description: Versículos não encontrados
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { bibleId, bookId, chapter, verse, verseEnd } = req.query;

    if (!bookId || !chapter) {
      return res.status(400).json({
        status: 'error',
        error: 'Os parâmetros bookId e chapter são obrigatórios'
      });
    }

    // Find the chapter
    let chapterQuery = `
      SELECT c.id
      FROM chapters c
      JOIN books b ON c.book_id = b.id
      WHERE c.book_id = ? AND c.number = ?
    `;
    const chapterParams = [bookId, chapter];

    if (bibleId) {
      chapterQuery += ' AND c.bible_id = ?';
      chapterParams.push(bibleId);
    }

    const chapterData = db.prepare(chapterQuery).get(...chapterParams);

    if (!chapterData) {
      return res.status(404).json({
        status: 'error',
        error: 'Capítulo não encontrado'
      });
    }

    // Get book info
    const book = db.prepare(`
      SELECT id, number, name, short_name, testament, chapters_count
      FROM books WHERE id = ?
    `).get(bookId);

    // Get verses
    let versesQuery = `
      SELECT v.number, v.text
      FROM verses v
      WHERE v.chapter_id = ?
    `;
    const versesParams = [chapterData.id];

    if (verseEnd) {
      versesQuery += ' AND v.number >= ? AND v.number <= ?';
      versesParams.push(verse, verseEnd);
    } else if (verse) {
      versesQuery += ' AND v.number = ?';
      versesParams.push(verse);
    }

    versesQuery += ' ORDER BY v.number';

    const verses = db.prepare(versesQuery).all(...versesParams);

    if (verses.length === 0) {
      return res.status(404).json({
        status: 'error',
        error: 'Versículos não encontrados'
      });
    }

    res.json({
      status: 'success',
      data: {
        book: {
          id: book.id,
          number: book.number,
          name: book.name,
          short_name: book.short_name,
          testament: book.testament,
          chapters_count: book.chapters_count
        },
        chapter: parseInt(chapter),
        verses
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
