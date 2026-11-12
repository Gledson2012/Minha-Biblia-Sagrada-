const express = require('express');
const { getDb } = require('../database/init');

const router = express.Router();

/**
 * @swagger
 * /api/v1/bibles:
 *   get:
 *     summary: Lista todas as versões da Bíblia disponíveis
 *     tags: [Bibles]
 *     responses:
 *       200:
 *         description: Lista de versões bíblicas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       language:
 *                         type: string
 *                       testaments:
 *                         type: string
 *                       copyright:
 *                         type: string
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const bibles = db.prepare(`
      SELECT id, name, description, language, testaments, copyright
      FROM bibles
    `).all();

    res.json({
      status: 'success',
      data: bibles
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar as versões da Bíblia'
    });
  }
});

/**
 * @swagger
 * /api/v1/bibles/{bibleId}:
 *   get:
 *     summary: Retorna os detalhes de uma versão específica da Bíblia
 *     tags: [Bibles]
 *     parameters:
 *       - in: path
 *         name: bibleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da versão bíblica
 *     responses:
 *       200:
 *         description: Detalhes da versão bíblica
 *       404:
 *         description: Versão não encontrada
 */
router.get('/:bibleId', (req, res) => {
  try {
    const db = getDb();
    const bible = db.prepare(`
      SELECT id, name, description, language, testaments, copyright
      FROM bibles WHERE id = ?
    `).get(req.params.bibleId);

    if (!bible) {
      return res.status(404).json({
        status: 'error',
        error: 'Versão bíblica não encontrada'
      });
    }

    res.json({
      status: 'success',
      data: bible
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Erro ao buscar a versão da Bíblia'
    });
  }
});

module.exports = router;
