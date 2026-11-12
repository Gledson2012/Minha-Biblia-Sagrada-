const express = require('express');
const { getDb } = require('../database/init');
const { getBookIdByName } = require('../validator');

const router = express.Router();

/**
 * @swagger
 * /api/v1/reference/{bookName}/{chapter}/{verse}:
 *   get:
 *     summary: "Busca versículo por referência (nome do livro)"
 *     description: "Busca um versículo específico usando o nome do livro em vez do ID numérico. Suporta nomes com e sem acentos."
 *     tags: [Reference]
 *     parameters:
 *       - in: path
 *         name: bookName
 *         required: true
 *         schema:
 *           type: string
 *         description: "Nome do livro (ex: Joao, Genesis, Salmos)"
 *       - in: path
 *         name: chapter
 *         required: true
 *         schema:
 *           type: integer
 *         description: "Número do capítulo"
 *       - in: path
 *         name: verse
 *         required: true
 *         schema:
 *           type: integer
 *         description: "Número do versículo"
 *     responses:
 *       200:
 *         description: "Versículo encontrado"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     book:
 *                       type: object
 *                     chapter:
 *                       type: integer
 *                     verse:
 *                       type: object
 *       400:
 *         description: "Parâmetros inválidos"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: "Livro ou versículo não encontrado"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Helper function to resolve book and chapter
function resolveBookAndChapter(bookName, chapter, res) {
  const bookId = getBookIdByName(bookName);
  if (!bookId) {
    return res.status(404).json({
      status: 'error',
      error: `Livro "${bookName}" não encontrado. Verifique o nome do livro.`
    });
  }

  const chapterNum = parseInt(chapter);
  if (isNaN(chapterNum) || chapterNum < 1) {
    return res.status(400).json({
      status: 'error',
      error: 'Número do capítulo inválido'
    });
  }

  const db = getDb();

  const chapterData = db.prepare(`
    SELECT c.id
    FROM chapters c
    JOIN books b ON c.book_id = b.id
    WHERE c.book_id = ? AND c.number = ?
  `).get(bookId, chapterNum);

  if (!chapterData) {
    return res.status(404).json({
      status: 'error',
      error: `Capítulo ${chapterNum} não encontrado no livro ${bookName}`
    });
  }

  const book = db.prepare(`
    SELECT id, number, name, short_name, testament, chapters_count
    FROM books WHERE id = ?
  `).get(bookId);

  return { bookId, chapterNum, chapterData, book, db };
}

// GET /:bookName/:chapter - returns entire chapter
router.get('/:bookName/:chapter', (req, res) => {
  try {
    const { bookName, chapter } = req.params;

    const result = resolveBookAndChapter(bookName, chapter, res);
    if (!result) return;

    const { chapterData, book } = result;

    const verses = getDb().prepare(`
      SELECT number, text
      FROM verses
      WHERE chapter_id = ?
      ORDER BY number
    `).all(chapterData.id);

    res.json({
      status: 'success',
      data: {
        book: {
          id: book.id,
          number: book.number,
          name: book.name,
          short_name: book.short_name,
          testament: book.testament
        },
        chapter: parseInt(chapter),
        verses
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar a referência'
    });
  }
});

// GET /:bookName/:chapter/:verse - returns specific verse
router.get('/:bookName/:chapter/:verse', (req, res) => {
  try {
    const { bookName, chapter, verse } = req.params;

    const result = resolveBookAndChapter(bookName, chapter, res);
    if (!result) return;

    const { chapterData, book } = result;

    const verseNum = parseInt(verse);
    if (isNaN(verseNum) || verseNum < 1) {
      return res.status(400).json({
        status: 'error',
        error: 'Número do versículo inválido'
      });
    }

    const verseData = getDb().prepare(`
      SELECT number, text
      FROM verses
      WHERE chapter_id = ? AND number = ?
    `).get(chapterData.id, verseNum);

    if (!verseData) {
      return res.status(404).json({
        status: 'error',
        error: `Versículo ${verseNum} não encontrado`
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
          testament: book.testament
        },
        chapter: parseInt(chapter),
        verse: verseData
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar a referência'
    });
  }
});

module.exports = router;
