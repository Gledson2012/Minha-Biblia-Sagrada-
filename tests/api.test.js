const request = require('supertest');
const { getDb, initDb, closeDb } = require('../src/database/init');
const path = require('path');
const fs = require('fs');

// Use a test database
process.env.DB_PATH = path.join(__dirname, 'test.db');

// Import app after setting DB_PATH
let app;

beforeAll(async () => {
  // Clear test DB
  const testDbPath = path.join(__dirname, 'test.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
  const walPath = testDbPath + '-wal';
  const shmPath = testDbPath + '-shm';
  if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
  if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

  // Re-require to pick up new DB_PATH
  delete require.cache[require.resolve('../src/database/init')];
  delete require.cache[require.resolve('../src/middleware')];
  delete require.cache[require.resolve('../src/index')];

  // Inicializa o banco de dados para os testes
  const { initDb } = require('../src/database/init');
  initDb();

  app = require('../src/index');
});

afterAll(() => {
  closeDb();
  const testDbPath = path.join(__dirname, 'test.db');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  const walPath = testDbPath + '-wal';
  const shmPath = testDbPath + '-shm';
  if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
  if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  delete process.env.DB_PATH;
});

describe('Health Endpoint', () => {
  test('GET /api/v1/health returns ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.version).toBe('2.0.0');
    expect(res.body.database).toBeDefined();
    expect(res.body.database.connected).toBe(true);
  });
});

describe('Bibles Endpoint', () => {
  test('GET /api/v1/bibles returns list', async () => {
    const res = await request(app).get('/api/v1/bibles');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('GET /api/v1/bibles/almeida returns details', async () => {
    const res = await request(app).get('/api/v1/bibles/almeida');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe('almeida');
    expect(res.body.data.name).toBe('Almeida Corrigida Fiel');
  });

  test('GET /api/v1/bibles/nonexistent returns 404', async () => {
    const res = await request(app).get('/api/v1/bibles/nonexistent');
    expect(res.statusCode).toBe(404);
  });
});

describe('Books Endpoint', () => {
  test('GET /api/v1/books returns paginated list', async () => {
    const res = await request(app).get('/api/v1/books');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.total).toBe(66);
  });

  test('GET /api/v1/books?testament=Novo Testamento filters correctly', async () => {
    const res = await request(app).get('/api/v1/books?testament=Novo Testamento');
    expect(res.statusCode).toBe(200);
    expect(res.body.meta.total).toBe(27);
    res.body.data.forEach(book => {
      expect(book.testament).toBe('Novo Testamento');
    });
  });

  test('GET /api/v1/books with pagination', async () => {
    const res = await request(app).get('/api/v1/books?limit=10&offset=20');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(10);
    expect(res.body.meta.page).toBe(3);
  });

  test('GET /api/v1/books/1 returns Genesis', async () => {
    const res = await request(app).get('/api/v1/books/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('Gênesis');
  });
});

describe('Chapters Endpoint', () => {
  test('GET /api/v1/chapters?bookId=1 returns chapters', async () => {
    const res = await request(app).get('/api/v1/chapters?bookId=1');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(50);
  });

  test('GET /api/v1/chapters without bookId returns 400', async () => {
    const res = await request(app).get('/api/v1/chapters');
    expect(res.statusCode).toBe(400);
  });
});

describe('Verses Endpoint', () => {
  test('GET /api/v1/verses?bookId=1&chapter=1&verse=1 returns Genesis 1:1', async () => {
    const res = await request(app).get('/api/v1/verses?bookId=1&chapter=1&verse=1');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.verses[0].text).toContain('No princípio criou Deus');
  });

  test('GET /api/v1/verses?bookId=43&chapter=3&verse=16 returns João 3:16', async () => {
    const res = await request(app).get('/api/v1/verses?bookId=43&chapter=3&verse=16');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.verses[0].text).toContain('Porque Deus amou o mundo');
  });

  test('GET /api/v1/verses without bookId returns 400', async () => {
    const res = await request(app).get('/api/v1/verses');
    expect(res.statusCode).toBe(400);
  });
});

describe('Reference Endpoint', () => {
  test('GET /api/v1/reference/Joao/3/16 returns João 3:16', async () => {
    const res = await request(app).get('/api/v1/reference/Joao/3/16');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.verse.text).toContain('Porque Deus amou o mundo');
  });

  test('GET /api/v1/reference/Genesis/1/1 returns Gênesis 1:1', async () => {
    const res = await request(app).get('/api/v1/reference/Genesis/1/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.verse.text).toContain('No princípio criou Deus');
  });

  test('GET /api/v1/reference/Salmos/23/1 returns Salmo 23:1', async () => {
    const res = await request(app).get('/api/v1/reference/Salmos/23/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.verse.text).toContain('O Senhor é o meu pastor');
  });

  test('GET /api/v1/reference/Joao/3 returns chapter', async () => {
    const res = await request(app).get('/api/v1/reference/Joao/3');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.verses)).toBe(true);
  });

  test('GET /api/v1/reference/InvalidBook/1/1 returns 404', async () => {
    const res = await request(app).get('/api/v1/reference/InvalidBook/1/1');
    expect(res.statusCode).toBe(404);
  });
});

describe('Random Verse Endpoint', () => {
  test('GET /api/v1/random-verse returns a verse', async () => {
    const res = await request(app).get('/api/v1/random-verse');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.text).toBeDefined();
    expect(res.body.data.book_name).toBeDefined();
  });

  test('GET /api/v1/random-verse?testament=Novo Testamento filters correctly', async () => {
    const res = await request(app).get('/api/v1/random-verse?testament=Novo Testamento');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.testament).toBe('Novo Testamento');
  });
});

describe('Verse of the Day Endpoint', () => {
  test('GET /api/v1/verse-of-the-day returns a verse', async () => {
    const res = await request(app).get('/api/v1/verse-of-the-day');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.text).toBeDefined();
  });
});

describe('Search Endpoint', () => {
  test('GET /api/v1/search?q=Deus returns results', async () => {
    const res = await request(app).get('/api/v1/search?q=Deus');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta.query).toBe('Deus');
  });

  test('GET /api/v1/search?q=amor returns results', async () => {
    const res = await request(app).get('/api/v1/search?q=amor');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('GET /api/v1/search without q returns 400', async () => {
    const res = await request(app).get('/api/v1/search');
    expect(res.statusCode).toBe(400);
  });

  test('GET /api/v1/search?q=Deus&limit=5&offset=0 has pagination', async () => {
    const res = await request(app).get('/api/v1/search?q=Deus&limit=5&offset=0');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
    expect(res.body.meta.page).toBe(1);
  });
});

describe('Provérbios Data Integrity', () => {
  test('Provérbios 3 has unique verse numbers', async () => {
    const db = getDb();
    const verses = db.prepare(`
      SELECT v.number, v.text
      FROM verses v
      JOIN chapters c ON v.chapter_id = c.id
      JOIN books b ON c.book_id = b.id
      WHERE b.name = 'Provérbios' AND c.number = 3
      ORDER BY v.number
    `).all();

    expect(verses.length).toBeGreaterThan(0);
    const numbers = verses.map(v => v.number);
    const uniqueNumbers = new Set(numbers);
    expect(numbers.length).toBe(uniqueNumbers.size);
  });
});

describe('404 Handler', () => {
  test('GET /nonexistent returns 404', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.statusCode).toBe(404);
  });
});

describe('Root Endpoint', () => {
  test('GET / returns API info', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Bíblia Sagrada API');
    expect(res.body.version).toBe('2.0.0');
    expect(res.body.endpoints.reference).toBeDefined();
  });
});
